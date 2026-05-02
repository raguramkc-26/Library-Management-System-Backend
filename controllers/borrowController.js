const mongoose = require("mongoose");
const Borrow = require("../models/borrowModel");
const Book = require("../models/bookModel");
const Reservation = require("../models/reservationModel");
const Notification = require("../models/notificationModel");
const Payment = require("../models/paymentModel");
const sendEmail = require("../utils/email");

// ================= BORROW =================
const borrowBook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.userId;
    const { bookId } = req.params;

    const book = await Book.findById(bookId).session(session);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.status !== "available") {
      return res.status(400).json({ message: "Book not available" });
    }

    const exists = await Borrow.findOne({
      borrower: userId,
      book: bookId,
      status: "borrowed",
    }).session(session);

    if (exists) {
      return res.status(400).json({ message: "Already borrowed" });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

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
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// ================= RESERVE =================
const reserveBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const exists = await Reservation.findOne({
      user: req.userId,
      book: bookId,
      status: "waiting",
    });

    if (exists) throw new Error("Already in queue");

    const count = await Reservation.countDocuments({
      book: bookId,
      status: "waiting",
    });

    await Reservation.create({
      user: req.userId,
      book: bookId,
      position: count + 1,
    });

    res.json({ success: true, message: `Queue position ${count + 1}` });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= RETURN =================
const returnBook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { borrowId } = req.params;

    const record = await Borrow.findById(borrowId).session(session);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // SECURITY 
   if (record.borrower.toString() !== req.userId.toString()) {
  return res.status(403).json({
    success: false,
    message: "Not authorized to return this book",
  });
}

    record.status = "returned";
    record.returnedDate = new Date();

    let fine = 0;

    if (record.returnedDate > record.dueDate) {
      const days = Math.ceil(
        (record.returnedDate - record.dueDate) / (1000 * 60 * 60 * 24)
      );
      fine = days * 10;
    }

    record.fineAmount = fine;
    record.finePaid = false;

    await record.save({ session });

    // PAYMENT RECORD
    if (fine > 0) {
      await Payment.create([{
        user: record.borrower,
        borrow: record._id,
        amount: fine,
      }], { session });
    }

    const book = await Book.findById(record.book).session(session);

    const next = await Reservation.findOne({
      book: record.book,
      status: "waiting",
    })
      .sort({ createdAt: 1 })
      .populate("user");

    // ALWAYS RESET BOOK
    book.status = "available";
    book.borrowedBy = null;
    await book.save({ session });

    await session.commitTransaction();
    session.endSession();

    // EMAIL OUTSIDE TRANSACTION
    if (next) {
      try {
        next.status = "notified";
        await next.save();

        await sendEmail({
          to: next.user.email,
          subject: "Book Available",
          html: `<p>${book.title} is available</p>`,
        });
      } catch (err) {
        console.error("Email failed:", err.message);
      }
    }

    res.json({ success: true, fine });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ message: err.message });
  }
};

// ================= GET =================
const getMyBorrowings = async (req, res) => {
  const data = await Borrow.find({ borrower: req.userId })
    .populate("book")
    .sort({ createdAt: -1 });

  res.json({ success: true, data });
};

module.exports = {
  borrowBook,
  reserveBook,
  returnBook,
  getMyBorrowings,
};