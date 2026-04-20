const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");

const {
  getAdminStats,
  getMonthlyStats,
  notifyAllUsers,
  getRecentActivity,
  getTopBooks,
  addBook,
  getAllUsers, 
  updateUserRole,
  deleteUser
} = require("../controllers/adminController");

const { isAuthenticated, allowRoles } = require("../middlewares/auth");

// STATS
router.get("/stats", isAuthenticated, allowRoles(["admin"]), getAdminStats);
router.get("/stats/monthly", isAuthenticated, allowRoles(["admin"]), getMonthlyStats);

// USERS 
router.get("/users", isAuthenticated, allowRoles(["admin"]), getAllUsers);

// NOTIFICATIONS
router.post("/notify-all", isAuthenticated, allowRoles(["admin"]), notifyAllUsers);

// DASHBOARD DATA
router.get("/recent", isAuthenticated, allowRoles(["admin"]), getRecentActivity);
router.get("/top-books", isAuthenticated, allowRoles(["admin"]), getTopBooks);

// BOOK CREATION
router.post(
  "/books",
  isAuthenticated,
  allowRoles(["admin"]),
  upload.single("image"),
  addBook
);

//updateUser
router.put("/users/:id", isAuthenticated, allowRoles(["admin"]), updateUserRole);

//deleteUser
router.delete("users/:id", isAuthenticated, allowRoles(["admin"]), deleteUser);

module.exports = router;