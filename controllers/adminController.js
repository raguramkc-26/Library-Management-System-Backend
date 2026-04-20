const Book = require("../models/bookModel");
const Borrow = require("../models/borrowModel");
const User = require("../models/userModel");

const getAdminStats = async (req, res) => {
  try {
    // total books
    const totalBooks = await Book.countDocuments();
    //totalusers
    const totalUsers = await User.countDocuments();
    // borrowed books
    const borrowedBooks = await Borrow.countDocuments({
      status: "borrowed",
    });
    //available book
    const availableBooks = await Book.countDocuments({ status: "Available" });
    // overdue books
    const overdueBooks = await Borrow.countDocuments({
      status: "borrowed",
      dueDate: { $lt: new Date() },
    });

    res.json({
      totalBooks,
      borrowedBooks,
      overdueBooks,
      totalUsers,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
   
  const getMonthlyBorrowStats = async (req, res) => {
  try {
    const stats = await Borrow.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // fill all 12 months
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0,
    }));

    stats.forEach((item) => {
      months[item._id - 1].total = item.total;
    });

    res.json(months);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAdminStats , getMonthlyBorrowStats };