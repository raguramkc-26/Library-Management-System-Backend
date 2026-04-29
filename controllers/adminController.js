const mongoose = require("mongoose");
const Book = require("../models/bookModel");
const User = require("../models/userModel");
const Borrow = require("../models/borrowModel");
const Notification = require("../models/notificationModel");

const getAdminStats = async (req, res) => {
  try {
    const [totalBooks, totalUsers, borrowed, overdue, revenueData] =
      await Promise.all([
        Book.countDocuments(),
        User.countDocuments(),
        Borrow.countDocuments({ status: "borrowed" }),
        Borrow.countDocuments({
          status: "borrowed",
          dueDate: { $lt: new Date() },
        }),
        Borrow.aggregate([
          { $match: { fineAmount: { $gt: 0 } } },
          { $group: { _id: null, total: { $sum: "$fineAmount" } } },
        ]),
      ]);

    const revenue = revenueData[0]?.total || 0;

    res.json({
      success: true,
      data: {
        books: totalBooks,
        users: totalUsers,
        borrowed,
        overdue,
        revenue,
      },
    });
  } catch (err) {
    console.error("Admin Stats Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
    });
  }
};


const getMonthlyStats = async (req, res) => {
  try {
    const data = await Borrow.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("Monthly Stats Error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching stats",
    });
  }
};


const notifyAllUsers = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const users = await User.find().select("_id");

    const notifications = users.map((u) => ({
      user: u._id,
      message,
      type: "system",
    }));

    await Notification.insertMany(notifications);

    res.json({
      success: true,
      message: "Notification sent to all users",
      count: notifications.length,
    });
  } catch (err) {
    console.error("Notify Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send notifications",
    });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const data = await Borrow.find()
      .populate("book", "title")
      .populate("borrower", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("Recent Activity Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity",
    });
  }
};

const getTopBooks = async (req, res) => {
  try {
    const data = await Borrow.aggregate([
      { $group: { _id: "$book", borrowCount: { $sum: 1 } } },
      { $sort: { borrowCount: -1 } },
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

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("Top Books Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top books",
    });
  }
};

// GET ALL USERS
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    console.error("Get Users Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};


// UPDATE ROLE
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    if (req.userId === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("Update Role Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update role",
    });
  }
};


// DELETE USER
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (req.userId === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};


module.exports = {
  getAdminStats,
  getMonthlyStats,
  notifyAllUsers,
  getRecentActivity,
  getTopBooks,
  getAllUsers,
  updateUserRole,
  deleteUser,
};