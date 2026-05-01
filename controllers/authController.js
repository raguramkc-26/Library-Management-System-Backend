const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/email");

const { JWT_SECRET, NODE_ENV, CLIENT_URL } = require("../utils/config");

const authController = {

  // REGISTER
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "All fields required",
        });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        name,
        email,
        password: hashedPassword,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error registering user",
      });
    }
  },

  // LOGIN 
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password required",
        });
      }

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // FIXED TOKEN PAYLOAD
      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "7d" } 
      );

      res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error logging in",
      });
    }
  },

  // GET CURRENT USER 
  getMe: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      res.json({
        success: true,
        user: req.user,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching user",
      });
    }
  },

  // LOGOUT
  logout: async (req, res) => {
    res.json({
      success: true,
      message: "Logout successful",
    });
  },

  // FORGOT PASSWORD 
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");

      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

      await user.save();

      // FIXED 
      const resetURL = `${CLIENT_URL}/reset-password/${resetToken}`;

      await sendEmail(
        user.email,
        "Password Reset",
        `Reset your password: ${resetURL}`
      );

      res.json({
        success: true,
        message: "Reset link sent to email",
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error sending reset email",
      });
    }
  },

  // RESET PASSWORD
  resetPassword: async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Token invalid or expired",
        });
      }

      user.password = await bcrypt.hash(password, 10);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();

      res.json({
        success: true,
        message: "Password reset successful",
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error resetting password",
      });
    }
  },
};

module.exports = authController;