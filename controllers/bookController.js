const Book = require("../models/bookModel");

// CREATE BOOK (with image)
const createBook = async (req, res) => {
  try {
    const { title, author, genre, description } = req.body;

    if (!title || !author) {
      return res.status(400).json({ message: "Title and Author required" });
    }

    let image = "";

    if (req.file) {
      image = req.file.path; // Cloudinary URL
    }

    const book = await Book.create({
      title,
      author,
      genre,
      description,
      image,
      status: "Available",
    });

    res.status(201).json(book);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create book" });
  }
};
// GET ALL BOOKS (with filters)
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
      books,
      totalPages: Math.ceil(total / limit),
    });

  } catch {
    res.status(500).json({ message: "Failed to fetch books" });
  }
};

// GET SINGLE BOOK
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) return res.status(404).json({ message: "Book not found" });

    res.json(book);
  } catch {
    res.status(500).json({ message: "Error fetching book" });
  }
};

// UPDATE BOOK
const updateBook = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!book) return res.status(404).json({ message: "Book not found" });

    res.json(book);

  } catch {
    res.status(500).json({ message: "Update failed" });
  }
};

// DELETE BOOK
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) return res.status(404).json({ message: "Book not found" });

    res.json({ message: "Book deleted" });

  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};

module.exports = {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
};