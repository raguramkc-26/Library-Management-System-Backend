const Razorpay = require("razorpay");
const crypto = require("crypto");
const Borrow = require("../models/borrowModel");
const Notification = require("../models/notificationModel");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// CREATE ORDER
const createOrder = async (req, res) => {
  try {
    const { borrowId } = req.params;

    const record = await Borrow.findById(borrowId);
    if (!record) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    // already paid guard
    if (record.finePaid) {
      return res.status(400).json({ message: "Fine already paid" });
    }

    // no fine guard
    const fine = Number(record.fineAmount || 0);
    if (fine <= 0) {
      return res.status(400).json({ message: "No fine to pay" });
    }

    const options = {
      amount: Math.round(fine * 100), // INR → paise
      currency: "INR",
      receipt: `rcpt_${borrowId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // store last order id (optional but useful)
    record.lastOrderId = order.id;
    await record.save();

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

// VERIFY PAYMENT
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      borrowId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !borrowId) {
      return res.status(400).json({ message: "Missing payment fields" });
    }

    const record = await Borrow.findById(borrowId);
    if (!record) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    // prevent double marking
    if (record.finePaid) {
      return res.json({ message: "Already verified" });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // mark paid
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

    return res.json({ message: "Payment verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// PAYMENT HISTORY (USER)
const getPaymentHistory = async (req, res) => {
  try {
    const data = await Borrow.find({
      borrower: req.userId,
      finePaid: true,
    })
      .populate("book", "title author")
      .sort({ paidAt: -1 });

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// REVENUE (ADMIN)
const getRevenue = async (req, res) => {
  try {
    const result = await Borrow.aggregate([
      { $match: { finePaid: true } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$fineAmount" },
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