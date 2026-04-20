const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  status: {
    type: String,
    enum: ["waiting", "notified", "fulfilled", "expired"],
    default: "waiting",
  },
  notified: {
    type: Boolean,
    default: false,
  },
  lockUntil: {
    type: Date,
  }
}, { timestamps: true });

const Reservation = mongoose.model("Reservation", reservationSchema);

module.exports = Reservation;