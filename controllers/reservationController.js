const mongoose = require("mongoose");
const Reservation = require("../models/reservationModel");
const Book = require("../models/bookModel");

// CREATE RESERVATION
const createReservation = async (req, res) => {
  try {
    const userId = req.userId;
    const { bookId } = req.params;

    // Validate user
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID"
      });
    }

    // Check book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    // FIXED: correct logic
    if (book.status === "Available") {
      return res.status(400).json({
        success: false,
        message: "Book is available. Borrow instead."
      });
    }

    // Prevent duplicate reservation
    const existing = await Reservation.findOne({
      user: userId,
      book: bookId,
      status: "waiting"
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already reserved this book"
      });
    }

    // Create reservation
    const reservation = await Reservation.create({
      user: userId,
      book: bookId,
      status: "waiting"
    });

    return res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: reservation
    });

  } catch (error) {
    console.error("createReservation error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


// GET MY RESERVATIONS
const getMyReservations = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const reservations = await Reservation.find({ user: userId })
      .populate("book")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });

  } catch (error) {
    console.error("getMyReservations error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  createReservation,
  getMyReservations
};