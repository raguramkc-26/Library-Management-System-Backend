const express = require("express");
const router = express.Router();

const { isAuthenticated, allowRoles } = require("../middlewares/auth");

const {
  createReview,
  getReviewsByBook,
  getAverageRating,
  getPendingReviews,
  approveReview,
  rejectReview,
} = require("../controllers/reviewController");

// ADMIN
router.get("/pending", isAuthenticated, allowRoles("admin"), getPendingReviews);
router.patch("/:id/approve", isAuthenticated, allowRoles("admin"), approveReview);
router.patch("/:id/reject", isAuthenticated, allowRoles("admin"), rejectReview);

// USER
router.post("/:bookId", isAuthenticated, createReview);

// IMPORTANT ORDER
router.get("/:bookId/average", getAverageRating);
router.get("/:bookId", getReviewsByBook);

module.exports = router;