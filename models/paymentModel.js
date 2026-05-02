const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    borrow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Borrow",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    paymentId: {
      type: String, 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);