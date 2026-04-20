const Book = require("../models/bookModel");
const User = require("../models/userModel");
const Borrow = require("../models/borrowModel");
const Notification = require("../models/notificationModel");

// STATS
const getAdminStats = async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalUsers = await User.countDocuments();

    const borrowed = await Borrow.countDocuments({ status: "borrowed" });

    const overdue = await Borrow.countDocuments({
      status: "borrowed",
      dueDate: { $lt: new Date() },
    });

    const revenueData = await Borrow.aggregate([
      { $match: { fineAmount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$fineAmount" } } },
    ]);

    const revenue = revenueData[0]?.total || 0;

    res.json({ totalBooks, totalUsers, borrowed, overdue, revenue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// MONTHLY
const getMonthlyStats = async (req, res) => {
  try {
    const data = await Borrow.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// NOTIFY
const notifyAllUsers = async (req, res) => {
  try {
    const { message } = req.body;

    const users = await User.find().select("_id");

    const notifications = users.map((u) => ({
      user: u._id,
      message,
      type: "system",
    }));

    await Notification.insertMany(notifications);

    res.json({ message: "Notification sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// RECENT ACTIVITY
const getRecentActivity = async (req, res) => {
  try {
    const data = await Borrow.find()
      .populate("book", "title")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// TOP BOOKS
const getTopBooks = async (req, res) => {
  try {
    const data = await Borrow.aggregate([
      { $group: { _id: "$book", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: "$book" },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
  const addBook = async (req, res) => {
  try {
    const { title, author, description, genre } = req.body;

    if (!title || !author) {
      return res.status(400).json({ message: "Title and Author required" });
    }

    const book = await Book.create({
      title,
      author,
      description,
      genre,
      status: "Available",
    });

    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 

module.exports = {
  getAdminStats,
  getMonthlyStats,
  notifyAllUsers,
  getRecentActivity,
  getTopBooks,
  addBook
};