const Razorpay = require("razorpay");
const crypto = require("crypto");

const Borrow = require("../models/borrowModel");
const Payment = require("../models/paymentModel");
const Notification = require("../models/notificationModel");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// ================= CREATE ORDER =================
const createOrder = async (req, res) => {
  try {
    const { borrowId } = req.params;

    const record = await Borrow.findById(borrowId);

    if (!record) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    // SECURITY: only owner can pay
    if (record.borrower.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (record.finePaid) {
      return res.status(400).json({ message: "Fine already paid" });
    }

    const fine = Number(record.fineAmount || 0);

    if (fine <= 0) {
      return res.status(400).json({ message: "No fine to pay" });
    }

    // CREATE PAYMENT ENTRY FIRST 
    const payment = await Payment.create({
      user: record.borrower,
      borrow: record._id,
      amount: fine,
      status: "pending",
    });

    const order = await razorpay.orders.create({
      amount: fine * 100,
      currency: "INR",
      receipt: `rcpt_${payment._id}`,
    });

    // link order → payment
    payment.orderId = order.id;
    await payment.save();

    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


// ================= VERIFY PAYMENT =================
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment fields" });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // find payment by orderId
    const payment = await Payment.findOne({
      orderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status === "paid") {
      return res.json({ message: "Already verified" });
    }

    // update payment
    payment.status = "paid";
    payment.paymentId = razorpay_payment_id;
    await payment.save();

    // update borrow
    const record = await Borrow.findById(payment.borrow);

    record.finePaid = true;
    record.paymentId = razorpay_payment_id;
    record.orderId = razorpay_order_id;
    record.paidAt = new Date();

    await record.save();

    // notification
    await Notification.create({
      user: record.borrower,
      message: "Your fine payment was successful",
      type: "system",
    });

    return res.json({
      success: true,
      message: "Payment verified successfully",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


// ================= PAYMENT HISTORY =================
const getPaymentHistory = async (req, res) => {
  try {
    const data = await Payment.find({ user: req.userId })
      .populate({
        path: "borrow",
        populate: {
          path: "book",
          select: "title author",
        },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: data.length,
      data,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= ADMIN REVENUE =================
const getRevenue = async (req, res) => {
  try {
    const result = await Payment.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]);

    res.json(result[0] || { totalRevenue: 0 });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getRevenue,
};