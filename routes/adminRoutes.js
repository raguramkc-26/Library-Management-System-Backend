const express = require("express");
const router = express.Router();

const { getAdminStats, getMonthlyBorrowStats } = require("../controllers/adminController");
const { isAuthenticated, allowRoles } = require("../middlewares/auth");

router.get(
  "/stats",
  isAuthenticated,
  allowRoles(["admin"]),
  getAdminStats
);

router.get(
  "/stats/monthly",
  isAuthenticated,
  allowRoles(["admin"]),
  getMonthlyBorrowStats
);
module.exports = router;