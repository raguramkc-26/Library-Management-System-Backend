const mongoose = require("mongoose");
const Borrow = require("../models/borrowModel");
const Book = require("../models/bookModel");
const Reservation = require("../models/reservationModel");
const Notification = require("../models/notificationModel");
const sendEmail = require("../utils/email");

// BORROW BOOK
const borrowBook = async (req, res) => {
  try {
    const userId = req.userId;
    const { bookId } = req.params;

    if (req.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only users can borrow books",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book.status !== "Available") {
      return res.status(400).json({
        success: false,
        message: "Book not available",
      });
    }
       book.status = "borrowed";
       await book.save();

    // prevent duplicate borrow
    const alreadyBorrowed = await Borrow.findOne({
      borrower: userId,
      book: bookId,
      status: "borrowed",
    });

    if (alreadyBorrowed) {
      return res.status(400).json({
        success: false,
        message: "You already borrowed this book",
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const borrow = await Borrow.create({
      borrower: userId,
      book: bookId,
      dueDate,
      status: "borrowed",
    });

    book.status = "borrowed";
    book.borrowedBy = userId;
    await book.save();

    res.status(201).json({
      success: true,
      message: "Book borrowed successfully",
      data: borrow,
    });

  } catch (err) {
    console.error("Borrow Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// RETURN BOOK
const returnBook = async (req, res) => {
  try {
    const { borrowId } = req.params;
    const userId = req.userId;

    if (req.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only users can return books",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(borrowId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid borrow ID",
      });
    }

    const record = await Borrow.findById(borrowId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Borrow record not found",
      });
    }

    if (record.borrower.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (record.status === "returned") {
      return res.status(400).json({
        success: false,
        message: "Already returned",
      });
    }

    record.status = "returned";
    record.returnedDate = new Date();
    await record.save();

    const book = await Book.findById(record.book);

    // reservation logic
    const next = await Reservation.findOne({
      book: record.book,
      status: "waiting",
    })
      .sort({ createdAt: 1 })
      .populate("user");

    if (next) {
      await sendEmail(
        next.user.email,
        "Book Available",
        `Hi ${next.user.name}, "${book.title}" is now available.`
      );

      await Notification.create({
        user: next.user._id,
        message: `"${book.title}" is now available`,
        type: "reservation",
      });

      next.status = "notified";
      await next.save();
    }

    book.status = "Available";
    book.borrowedBy = null;
    await book.save();

    res.json({
      success: true,
      message: "Book returned successfully",
    });

  } catch (err) {
    console.error("Return Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// GET MY BORROWINGS
const getMyBorrowings = async (req, res) => {
  try {
    const data = await Borrow.find({ borrower: req.userId })
      .populate("book")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: data.length,
      data,
    });

  } catch (err) {
    console.error("Fetch Borrow Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  borrowBook,
  returnBook,
  getMyBorrowings,
};