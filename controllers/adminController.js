const mongoose = require("mongoose");
const Book = require("../models/bookModel");
const User = require("../models/userModel");
const Borrow = require("../models/borrowModel");
const Notification = require("../models/notificationModel");

// ADMIN STATS
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
    res.status(500).json({ message: "Server error" });
  }
};

// MONTHLY STATS
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
    res.status(500).json({ message: "Error fetching stats" });
  }
};

// NOTIFY ALL USERS
const notifyAllUsers = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message required" });
    }

    const users = await User.find().select("_id");

    const notifications = users.map((u) => ({
      user: u._id,
      message,
      type: "system",
    }));

    await Notification.insertMany(notifications);

    res.json({
      message: "Notification sent to all users",
      count: notifications.length,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ADD BOOK (ADMIN)
const addBook = async (req, res) => {
  try {
    const { title, author, genre, description } = req.body;

    let image = "";

    if (req.file) {
      image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    const book = await Book.create({
      title,
      author,
      genre,
      description,
      image,
      status: "Available",
    });

    res.status(201).json(book);

  } catch (err) {
    res.status(500).json({ message: "Failed to create book" });
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
    res.status(500).json({ message: "Failed to fetch activity" });
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
    res.status(500).json({ message: "Failed to fetch top books" });
  }
};

// USERS MANAGEMENT
// GET ALL USERS
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(users);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};


// UPDATE USER ROLE
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const allowedRoles = ["user", "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (req.userId === id) {
      return res.status(400).json({
        message: "You cannot change your own role",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (err) {
    res.status(500).json({ message: "Failed to update role" });
  }
};


// DELETE USER
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (req.userId === id) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Failed to delete user" });
  }
};

module.exports = {
  getAdminStats,
  getMonthlyStats,
  notifyAllUsers,
  addBook,
  getRecentActivity,
  getTopBooks,
  getAllUsers,
  updateUserRole,
  deleteUser,
};