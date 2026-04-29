const Book = require("../models/bookModel");

// CREATE BOOK
const createBook = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const { title, author, genre, description, year, isbn } = req.body;

    if (!title || !author || !year || !isbn || !description) {
      return res.status(400).json({
        success: false,
        message: "All required fields missing",
      });
    }

    const existing = await Book.findOne({ isbn });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "ISBN already exists",
      });
    }

    let image = "";
    if (req.file) image = req.file.path;

    const book = await Book.create({
      title,
      author,
      genre,
      description,
      year: Number(year), // 🔥 FIX
      isbn,
      image,
      status: "Available",
    });

    res.status(201).json({
      success: true,
      data: book,
    });

  } catch (err) {
    console.error("CREATE BOOK ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};
// GET ALL 
const getBooks = async (req, res) => {
  try {
    const { keyword, genre, available, page = 1 } = req.query;

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

    const limit = 6;
    const skip = (page - 1) * limit;

    const books = await Book.find(query).skip(skip).limit(limit);
    const total = await Book.countDocuments(query);

    res.json({
      success: true,
      books,
      totalPages: Math.ceil(total / limit),
    });

  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch books",
    });
  }
};


// GET ONE
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.json({
      success: true,
      data: book,
    });

  } catch {
    res.status(500).json({
      success: false,
      message: "Error fetching book",
    });
  }
};


// UPDATE
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

    res.json({
      success: true,
      data: book,
    });

  } catch {
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};


// DELETE
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.json({
      success: true,
      message: "Book deleted",
    });

  } catch {
    res.status(500).json({
      success: false,
      message: "Delete failed",
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