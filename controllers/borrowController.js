const mongoose = require("mongoose");
const Borrow = require("../models/borrowModel");
const Book = require("../models/bookModel");
const Reservation = require("../models/reservationModel");
const Notification = require("../models/notificationModel");
const sendEmail = require("../utils/email");

// ================= BORROW BOOK =================
const borrowBook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.userId;
    const { bookId } = req.params;

    const book = await Book.findById(bookId).session(session);

    if (!book) throw new Error("Book not found");

    if (book.status !== "Available") {
      return res.status(400).json({
        success: false,
        message: "Book not available",
      });
    }

    const alreadyBorrowed = await Borrow.findOne({
      borrower: userId,
      book: bookId,
      status: "borrowed",
    });

    if (alreadyBorrowed) {
      return res.status(400).json({
        success: false,
        message: "Already borrowed",
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const borrow = await Borrow.create(
      [{
        borrower: userId,
        book: bookId,
        dueDate,
        status: "borrowed",
      }],
      { session }
    );

    book.status = "borrowed";
    book.borrowedBy = userId;
    await book.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Book borrowed",
      data: borrow[0],
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================= RESERVE BOOK =================
const reserveBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const exists = await Reservation.findOne({
      user: req.userId,
      book: bookId,
      status: "waiting",
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Already in queue",
      });
    }

    const queuePosition = await Reservation.countDocuments({
      book: bookId,
      status: "waiting",
    });

    await Reservation.create({
      user: req.userId,
      book: bookId,
      status: "waiting",
      position: queuePosition + 1,
    });

    res.json({
      success: true,
      message: `Added to queue (Position ${queuePosition + 1})`,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================= RETURN BOOK =================
const returnBook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { borrowId } = req.params;

    const record = await Borrow.findById(borrowId).session(session);

    if (!record) throw new Error("Record not found");

    record.status = "returned";
    record.returnedDate = new Date();

    // OVERDUE FINE LOGIC
    let fine = 0;
    if (record.returnedDate > record.dueDate) {
      const daysLate = Math.ceil(
        (record.returnedDate - record.dueDate) / (1000 * 60 * 60 * 24)
      );
      fine = daysLate * 10; // ₹10 per day
      record.fine = fine;
    }

    await record.save({ session });

    const book = await Book.findById(record.book).session(session);

    // FIFO RESERVATION SYSTEM
    const next = await Reservation.findOne({
      book: record.book,
      status: "waiting",
    })
      .sort({ createdAt: 1 })
      .populate("user");

    if (next) {
      next.status = "notified";
      await next.save({ session });

      await sendEmail({
        to: next.user.email,
        subject: "Book Available",
        html: `<p>${book.title} is now available</p>`,
      });

      await Notification.create([{
        user: next.user._id,
        message: `${book.title} is available`,
      }], { session });

    } else {
      book.status = "available";
      book.borrowedBy = null;
      await book.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Returned successfully",
      fine,
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================= GET MY BORROW =================
const getMyBorrowings = async (req, res) => {
  try {
    const data = await Borrow.find({ borrower: req.userId })
      .populate("book")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  borrowBook,
  reserveBook,
  returnBook,
  getMyBorrowings,
};