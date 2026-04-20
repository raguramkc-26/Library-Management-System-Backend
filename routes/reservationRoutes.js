const express = require("express");
const router = express.Router();

const {
  createReservation,
  getMyReservations
} = require("../controllers/reservationController");
const { isAuthenticated } = require("../middlewares/auth");

// protect routes
router.use(isAuthenticated);

router.post("/:bookId", createReservation);
router.get("/me", getMyReservations);

module.exports = router;