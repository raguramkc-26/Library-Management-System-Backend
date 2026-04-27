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

    if (req.role !== "user") {
      return res.status(403).json({
        message: "Admins are not allowed to borrow books",
      });
    }

    const { bookId } = req.params;

    // VALIDATE ID
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.status !== "Available") {
      return res.status(400).json({
        message: "Book already borrowed or not available",
      });
    }

    // PREVENT DUPLICATE BORROW
    const existing = await Borrow.findOne({
      borrower: userId,
      book: bookId,
      status: "borrowed",
    });

    if (existing) {
      return res.status(400).json({
        message: "You already borrowed this book",
      });
    }

    // DUE DATE (7 DAYS)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const borrow = await Borrow.create({
      borrower: userId,
      book: bookId,
      dueDate,
      status: "borrowed",
    });

    // UPDATE BOOK STATUS
    book.status = "Borrowed";
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
    if (req.role !== "user") {
      return res.status(403).json({
        message: "Admin cannot return books",
      });
    }

    const { borrowId } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(borrowId)) {
      return res.status(400).json({ message: "Invalid borrow ID" });
    }

    const record = await Borrow.findById(borrowId);

    if (!record) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    if (record.borrower.toString() !== userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (record.status === "returned") {
      return res.status(400).json({ message: "Already returned" });
    }

    // MARK RETURNED
    record.status = "returned";
    record.returnedDate = new Date();
    await record.save();

    const book = await Book.findById(record.book);

    // RESERVATION LOGIC
    const next = await Reservation.findOne({
      book: record.book,
      status: "waiting",
    })
      .sort({ createdAt: 1 })
      .populate("user");

    if (next) {
      // EMAIL
      await sendEmail(
        next.user.email,
        "Book Available",
        `Hi ${next.user.name}, your reserved book "${book.title}" is now available.`
      );

      // NOTIFICATION
      await Notification.create({
        user: next.user._id,
        message: `Your reserved book "${book.title}" is now available`,
        type: "reservation",
      });

      next.status = "notified";
      await next.save();
    }

    book.status = "Available";
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
    console.error("Get Borrowings Error:", err);
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