const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/auth");

const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

// GET MY NOTIFICATIONS
router.get("/me", isAuthenticated, getMyNotifications);

// MARK ONE AS READ
router.patch("/:id/read", isAuthenticated, markAsRead);

// MARK ALL AS READ
router.patch("/read-all", isAuthenticated, markAllAsRead);

// DELETE
router.delete("/:id", isAuthenticated, deleteNotification);

module.exports = router;