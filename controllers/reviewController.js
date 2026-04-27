const mongoose = require("mongoose");
const Review = require("../models/reviewModel");
const Book = require("../models/bookModel");

// ADD REVIEW
const addReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { bookId } = req.params;
    const { rating, comment } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // PREVENT DUPLICATE REVIEW
    const existing = await Review.findOne({
      user: userId,
      book: bookId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this book",
      });
    }

    const review = await Review.create({
      user: userId,
      book: bookId,
      rating,
      comment,
      status: "approved", 
    });

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: review,
    });

  } catch (error) {
    console.error("Add Review Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET REVIEWS
const getReviews = async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const reviews = await Review.find({
      book: bookId,
      status: "approved",
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews,
    });

  } catch (error) {
    console.error("Get Reviews Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET AVERAGE RATING
const getAverageRating = async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const result = await Review.aggregate([
      {
        $match: {
          book: new mongoose.Types.ObjectId(bookId),
          status: "approved",
        },
      },
      {
        $group: {
          _id: "$book",
          avgRating: { $avg: "$rating" },
          total: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: result[0] || { avgRating: 0, total: 0 },
    });

  } catch (error) {
    console.error("Average Rating Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addReview,
  getReviews,
  getAverageRating,     
};