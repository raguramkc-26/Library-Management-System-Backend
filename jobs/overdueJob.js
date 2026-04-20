const cron = require("node-cron");
const Borrow = require("../models/borrowModel");
const User = require("../models/userModel");
const sendEmail = require("../utils/email");
const checkOverdue = async () => {
  try {
    const today = new Date();

    const overdueBooks = await Borrow.find({
      dueDate: { $lt: today },
      status: "borrowed",
      overdueNotified: false
    }).populate("borrower book");

    for (let record of overdueBooks) {
      const user = record.borrower;

      await sendEmail(
        user.email,
        "Overdue Book Alert",
        `Hi ${user.name}, your book "${record.book.title}" is overdue. Please return it immediately.`
      );

      record.overdueNotified = true;
      await record.save();
    }

    console.log(`Checked overdue: ${overdueBooks.length}`);
  } catch (err) {
    console.error("Overdue job error:", err);
  }
};

module.exports = checkOverdue;