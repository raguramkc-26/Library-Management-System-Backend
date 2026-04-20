const Book = require("../models/bookModel");
const sendMail = require("../utils/email");
const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: books.length,
      books,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET SINGLE BOOK
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json({ book });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE BOOK
const createBook = async (req, res) => {
  try {
    const book = await Book.create(req.body);

    res.status(201).json({
      message: "Book created",
      book,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE BOOK
const updateBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({
      message: "Book updated",
      book,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE BOOK
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// SEARCH + FILTER
const searchBooks = async (req, res) => {
  try {
    const {
      keyword,
      genre,
      author,
      available,
      year,
      page = 1,
      limit = 10,
      sort = "latest"
    } = req.query;

    let query = {};

    // Keyword search
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { author: { $regex: keyword, $options: "i" } },
        { isbn: { $regex: keyword, $options: "i" } },
      ];
    }

    // Filters
    if (genre) query.genre = genre;

    if (author) {
      query.author = { $regex: author, $options: "i" };
    }

    if (available) {
      query.status = available === "true" ? "Available" : "Borrowed";
    }

    if (year) {
      query.publishedYear = Number(year);
    }
    
    //sorting
    let sortOption = {};
    switch (sort) {
      case "latest":
        sortOption = { createdAt: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "title":
        sortOption = { title: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Book.countDocuments(query);

    const books = await Book.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalResults: total,
      books,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  searchBooks,
};