const User = require("../models/userModel");
const mongoose = require("mongoose");


// ================= GET ALL USERS (ADMIN) =================
const getAllUsers = async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only",
      });
    }

    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ================= GET USER DETAILS =================
const getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // allow self OR admin
    if (req.userId.toString() !== userId && req.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ================= UPDATE ROLE =================
const updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    if (req.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update roles",
      });
    }

    // prevent admin modifying own role
    if (req.userId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Admin cannot change their own role",
      });
    }

    const allowedRoles = ["user", "admin"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: user,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ================= DELETE USER =================
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (req.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only",
      });
    }

    if (String(req.userId) === String(userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const Borrow = require("../models/borrowModel");

    const activeBorrow = await Borrow.findOne({
    borrower: userId,
    status: "borrowed"
    });

if (activeBorrow) {
  return res.status(400).json({
    message: "User has active borrowed books"
  });
}

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


module.exports = {
  getAllUsers,
  getUserDetails,
  updateRole,
  deleteUser,
};