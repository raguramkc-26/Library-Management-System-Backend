const express = require("express");
const router = express.Router();

const { isAuthenticated, allowRoles } = require("../middlewares/auth");
const {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getRevenue,
} = require("../controllers/paymentController");

router.post("/:borrowId/create-order", isAuthenticated, createOrder);
router.post("/verify", isAuthenticated, verifyPayment);

router.get("/history", isAuthenticated, getPaymentHistory);
router.get("/revenue", isAuthenticated, allowRoles("admin"), getRevenue);

module.exports = router;