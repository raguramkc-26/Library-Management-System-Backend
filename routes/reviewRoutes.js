const express = require("express");
const router = express.Router();
const { isAuthenticated, allowRoles } = require("../middlewares/auth");
const {
  addReview,
  getReviews,
  getAverageRating,
  getPendingReviews,
  approveReview,
  rejectReview,
} = require("../controllers/reviewController");
//Admin
router.get("/pending", isAuthenticated, allowRoles("admin"), getPendingReviews);
router.patch("/:id/approve", isAuthenticated, allowRoles("admin"), approveReview);
router.patch("/:id/reject", isAuthenticated, allowRoles("admin"), rejectReview);
//USER
router.post("/:bookId", isAuthenticated, addReview);
router.get("/:bookId", getReviews);
router.get("/:bookId/average", getAverageRating);
console.log("isAuthenticated:", typeof isAuthenticated);
console.log("addReview:", typeof addReview);
module.exports = router;
