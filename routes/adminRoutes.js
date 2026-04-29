const express = require("express");
const router = express.Router();

const {
  getAdminStats,
  getMonthlyStats,
  notifyAllUsers,
  getRecentActivity,
  getTopBooks,
  getAllUsers,
  updateUserRole,
  deleteUser
} = require("../controllers/adminController");

const { isAuthenticated, allowRoles } = require("../middlewares/auth");

// STATS
router.get("/stats", isAuthenticated, allowRoles("admin"), getAdminStats);
router.get("/stats/monthly", isAuthenticated, allowRoles("admin"), getMonthlyStats);

// USERS
router.get("/users", isAuthenticated, allowRoles("admin"), getAllUsers);
router.put("/users/:id", isAuthenticated, allowRoles("admin"), updateUserRole);
router.delete("/users/:id", isAuthenticated, allowRoles("admin"), deleteUser);

// NOTIFICATIONS
router.post("/notify-all", isAuthenticated, allowRoles("admin"), notifyAllUsers);

// DASHBOARD
router.get("/recent", isAuthenticated, allowRoles("admin"), getRecentActivity);
router.get("/top-books", isAuthenticated, allowRoles("admin"), getTopBooks);

module.exports = router;