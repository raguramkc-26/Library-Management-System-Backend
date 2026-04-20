const express = require("express");
const router = express.Router();

const {
  getAdminStats,
  getMonthlyStats,
  notifyAllUsers,
  getRecentActivity,
  getTopBooks,
  addBook
} = require("../controllers/adminController"); 

const { isAuthenticated, allowRoles } = require("../middlewares/auth");

router.get("/stats", isAuthenticated, allowRoles(["admin"]), getAdminStats);

router.get("/stats/monthly", isAuthenticated, allowRoles(["admin"]), getMonthlyStats);

router.post("/notify-all", isAuthenticated, allowRoles(["admin"]), notifyAllUsers);

router.get("/recent", isAuthenticated, allowRoles(["admin"]), getRecentActivity);

router.get("/top-books", isAuthenticated, allowRoles(["admin"]), getTopBooks);

router.post("/books", isAuthenticated, allowRoles(["admin"]), addBook);
module.exports = router;