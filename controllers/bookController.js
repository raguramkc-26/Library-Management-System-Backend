const Book = require("../models/bookModel");

// ================= CREATE BOOK =================
const createBook = async (req, res) => {
  try {
    const { title, author, genre, description, year, isbn } = req.body;

    // Validation
    if (!title || !author || !year || !isbn || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const parsedYear = Number(year);

    if (parsedYear < 1000 || parsedYear > new Date().getFullYear()) {
      return res.status(400).json({
        success: false,
        message: "Invalid year",
      });
    }

    // Check duplicate ISBN
    const existing = await Book.findOne({ isbn });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "ISBN already exists",
      });
    }

    // Image
    let image = "";
    if (req.file) {
      image = req.file.path;
    }

    const book = await Book.create({
      title,
      author,
      genre,
      description,
      year: parsedYear,
      isbn,
      image,
      status: "Available",
    });

    return res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: book, // ✅ FIXED
    });

  } catch (err) {
    console.error("CREATE BOOK ERROR:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "ISBN already exists",
      });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors)[0].message,
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Server error while adding book",
    });
  }
};


// ================= GET ALL BOOKS =================
const getBooks = async (req, res) => {
  try {
    const { keyword, genre, available, page = 1 } = req.query;

    const pageNumber = Number(page) || 1;
    const limit = 6;
    const skip = (pageNumber - 1) * limit;

    const query = {};

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { author: { $regex: keyword, $options: "i" } },
      ];
    }

    if (genre) query.genre = genre;

    if (available === "true") query.status = "Available";
    if (available === "false") query.status = "Borrowed";

    const books = await Book.find(query).skip(skip).limit(limit);
    const total = await Book.countDocuments(query);

    return res.json({
      success: true,
      data: books, // ✅ FIXED
      totalPages: Math.ceil(total / limit),
    });

  } catch (err) {
    console.error("GET BOOKS ERROR:", err); // ✅ FIXED

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch books",
    });
  }
};


// ================= GET SINGLE BOOK =================
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    return res.json({
      success: true,
      data: book,
    });

  } catch (err) {
    console.error("GET BOOK ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Error fetching book",
    });
  }
};


// ================= UPDATE BOOK =================
const updateBook = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = req.file.path;
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    return res.json({
      success: true,
      data: book,
    });

  } catch (err) {
    console.error("UPDATE BOOK ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Update failed",
    });
  }
};


// ================= DELETE BOOK =================
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    return res.json({
      success: true,
      message: "Book deleted",
    });

  } catch (err) {
    console.error("DELETE BOOK ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Delete failed",
    });
  }
};


module.exports = {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
};