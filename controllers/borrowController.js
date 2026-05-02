const mongoose = require("mongoose");
const Borrow = require("../models/borrowModel");
const Book = require("../models/bookModel");
const Reservation = require("../models/reservationModel");
const Notification = require("../models/notificationModel");
const sendEmail = require("../utils/email");

// BORROW BOOK
const borrowBook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.userId;
    const { bookId } = req.params;

    const book = await Book.findById(bookId).session(session);
    if (!book) throw new Error("Book not found");

    if (book.status !== "available") {
      throw new Error("Book not available");
    }

    // prevent duplicate
    const already = await Borrow.findOne({
      borrower: userId,
      book: bookId,
      status: "borrowed",
    }).session(session);

    if (already) throw new Error("Already borrowed");

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + BORROW_DAYS);

    const borrow = await Borrow.create([{
      borrower: userId,
      book: bookId,
      dueDate,
      status: "borrowed",
    }], { session });

    book.status = "borrowed";
    book.borrowedBy = userId;

    await book.save({ session });

    await session.commitTransaction();

    res.json({ success: true, data: borrow[0] });

  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};


// RETURN BOOK
const returnBook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { borrowId } = req.params;

    const record = await Borrow.findById(borrowId).session(session);
    if (!record) throw new Error("Borrow record not found");

    if (record.borrower.toString() !== req.userId.toString()) {
      throw new Error("Not authorized");
    }

    if (record.status === "returned") {
      throw new Error("Already returned");
    }

    const book = await Book.findById(record.book).session(session);

    // FINE CALCULATION
    const today = new Date();
    let fine = 0;

    if (today > record.dueDate) {
      const lateDays = Math.ceil(
        (today - record.dueDate) / (1000 * 60 * 60 * 24)
      );
      fine = lateDays * FINE_PER_DAY;
    }

    record.status = "returned";
    record.returnedDate = today;
    record.fine = fine;

    await record.save({ session });

    // FIFO QUEUE
    const next = await Reservation.findOne({
      book: book._id,
      status: "waiting",
    })
      .sort({ createdAt: 1 })
      .populate("user")
      .session(session);

    if (next) {
      await sendEmail({
        to: next.user.email,
        subject: "Book Available",
        html: `<p>${book.title} is now available</p>`,
      });

      next.status = "notified";
      await next.save({ session });

      book.status = "reserved"; // important

    } else {
      book.status = "available";
    }

    book.borrowedBy = null;
    await book.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Returned successfully",
      fine,
    });

  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
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

//reserve book
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

    await Reservation.create({
      user: req.userId,
      book: bookId,
      status: "waiting",
    });

    res.json({
      success: true,
      message: "Added to reservation queue",
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
  returnBook,
  getMyBorrowings,
  reserveBook,
};