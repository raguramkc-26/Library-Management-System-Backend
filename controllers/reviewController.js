const mongoose = require("mongoose");
const Review = require("../models/reviewModel");
const Book = require("../models/bookModel");

/*ADD REVIEW*/
const addReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { bookId } = req.params;
    const { rating, comment } = req.body;

    // AUTH
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // VALID ID
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ success: false, message: "Invalid book ID" });
    }

    // VALIDATE INPUT
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be 1-5" });
    }

    // CHECK BOOK
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    // PREVENT DUPLICATE (only pending/approved)
    const existing = await Review.findOne({
      user: userId,
      book: bookId,
      status: { $in: ["pending", "approved"] },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Already reviewed" });
    }

    const review = await Review.create({
      user: userId,
      book: bookId,
      rating,
      comment,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Review submitted for approval",
      data: review,
    });

  } catch (error) {
    console.error("Add Review Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/*GET APPROVED REVIEWS (USER SIDE)*/
const getReviews = async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ success: false, message: "Invalid book ID" });
    }

    const reviews = await Review.find({
      book: bookId,
      status: "approved",
    })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: reviews,
    });

  } catch (error) {
    console.error("Get Reviews Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


/*GET AVERAGE RATING*/
const getAverageRating = async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ success: false, message: "Invalid book ID" });
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
    res.status(500).json({ success: false, message: error.message });
  }
};


/*ADMIN - GET PENDING REVIEWS*/
const getPendingReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: "pending" })
      .populate("user", "name")
      .populate("book", "title")
      .lean();

    const safe = reviews.filter(r => r.user && r.book);

    console.log("PENDING REVIEWS:", safe);

    res.status(200).json({
      success: true,
      data: safe,
    });

  } catch (error) {
    console.error("Pending Reviews Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/*ADMIN - APPROVE REVIEW*/
const approveReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid review ID" });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    review.status = "approved";
    await review.save();

    res.status(200).json({
      success: true,
      message: "Review approved",
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/*ADMIN - REJECT REVIEW*/
const rejectReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid review ID" });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    review.status = "rejected";
    await review.save();

    res.status(200).json({
      success: true,
      message: "Review rejected",
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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