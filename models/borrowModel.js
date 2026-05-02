const mongoose = require("mongoose");

const borrowSchema = new mongoose.Schema(
  {
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    dueDate: Date,
    returnedDate: Date,

    status: {
      type: String,
      enum: ["borrowed", "returned"], 
      default: "borrowed",
    },

    fineAmount: {
      type: Number,
      default: 0,
    },

    finePaid: {
      type: Boolean,
      default: false,
    },

    paymentId: String,
    orderId: String,
    paidAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Borrow", borrowSchema);