const mongoose = require("mongoose");
const borrowSchema = new mongoose.Schema(
  {
    // USER
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // BOOK
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    // STATUS
    status: {
      type: String,
      enum: ["borrowed", "returned"],
      default: "borrowed",
    },

    // DATES
    borrowedDate: {
      type: Date,
      default: Date.now,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    returnedDate: {
      type: Date,
    },

    // FINE SYSTEM
    fineAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    finePaid: {
      type: Boolean,
      default: false,
    },

    // PAYMENT TRACKING
    paymentId: {
      type: String,
    },

    orderId: {
      type: String,
    },

    lastOrderId: {
      type: String,
    },

    paidAt: {
      type: Date,
    },

    // TRACK IF OVERDUE EMAIL SENT (prevents spam)
    overdueNotified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("Borrow", borrowSchema);