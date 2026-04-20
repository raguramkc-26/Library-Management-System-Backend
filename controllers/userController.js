const User = require('../models/userModel');
const mongoose = require('mongoose');

const getUserDetails = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        // Only self OR admin
        if (req.userId.toString() !== userId && req.role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }

        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateRole = async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        if(!mongoose.Types.ObjectId.isValid(userId)) {
            return
            res.status(400).json({ message: "Invalid ID"});
        }

        if (req.role !== "admin") {
            return res.status(403).json({ message: "Only admin can update roles" });
        }

        // Prevent self-change
        if (req.userId.toString() === userId) {
            return res.status(400).json({ message: "Admin cannot change their own role" });
        }

        const allowedRoles = ["user", "admin"];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Role updated successfully",
            user
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getUserDetails,
    updateRole
};