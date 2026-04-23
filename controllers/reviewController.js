const mongoose = require("mongoose");
const Review = require("../models/reviewModel");
const Book = require("../models/bookModel"); 

const addReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { bookId } = req.params;
    const { rating, comment } = req.body;

    // AUTH CHECK
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // VALID OBJECT ID
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    // VALIDATE RATING
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // CHECK BOOK EXISTS
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // CHECK DUPLICATE REVIEW
    const existing = await Review.findOne({
      user: userId,
      book: bookId,
    });

    if (existing) {
      return res.status(400).json({ message: "Already reviewed" });
    }

    const review = await Review.create({
      user: userId,
      book: bookId,
      rating,
      comment,
      status: "pending",
    });

    res.status(201).json({
      message: "Review submitted for approval",
      review,
    });

  } catch (error) {
    console.error("Add Review Error:", error);
    res.status(500).json({ message: error.message });
  }
};
const getReviews = async (req, res) => {
  try {
    const { bookId } = req.params;

    const reviews = await Review.find({ 
      book: bookId,
      status: "approved", 
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ reviews });

  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAverageRating = async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
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

    res.status(200).json(result[0] || { avgRating: 0, total: 0 });

  } catch (error) {
    console.error("Average Rating Error:", error);
    res.status(500).json({ message: error.message });
  }
};

 const getPendingReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: "pending" })
      .populate("user", "name")
      .populate("book", "title");

    // FILTER BROKEN DATA
    const safeReviews = reviews.filter(
      (r) => r.user !== null && r.book !== null
    );

    res.json({ reviews: safeReviews });

  } catch (error) {
    console.error("Pending Reviews Error:", error);
    res.status(500).json({ message: error.message });
  }
};
// ADMIN: APPROVE REVIEW
const approveReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.status = "approved";
    await review.save();

    res.json({ message: "Review approved" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: REJECT REVIEW
const rejectReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.status = "rejected";
    await review.save();

    res.json({ message: "Review rejected" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  addReview,
  getReviews,
  getAverageRating,
  getPendingReviews,
  approveReview,
  rejectReview,
};