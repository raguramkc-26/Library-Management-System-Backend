const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/email");

const { JWT_SECRET, NODE_ENV } = require("../utils/config");

const authController = {
  // REGISTER
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields required" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
      });

      res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
      res.status(500).json({
        message: "Error registering user",
        error: error.message,
      });
    }
  },

  // LOGIN
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password required",
        });
      }

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid password" });
      }

      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,  
        },
      });

    } catch (error) {
      res.status(500).json({
        message: "Error logging in",
        error: error.message,
      });
    }
  },

  // GET CURRENT USER
  getMe: async (req, res) => {
    try {
      const user = await User.findById(req.userId).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user });

    } catch (error) {
      res.status(500).json({
        message: "Error fetching user",
        error: error.message,
      });
    }
  },

  // LOGOUT
  logout: async (req, res) => {
    try {
      res.clearCookie("token", {
        httpOnly: true,
        secure: NODE_ENV === "production",
        sameSite: "none",
      });

      res.json({ message: "Logout successful" });

    } catch (error) {
      res.status(500).json({
        message: "Error logging out",
        error: error.message,
      });
    }
  },

  // FORGOT PASSWORD
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");

      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min

      await user.save();

      const resetURL = `http://localhost:5173/reset-password/${resetToken}`;

      await sendEmail(
        user.email,
        "Password Reset",
        `Reset your password: ${resetURL}`
      );

      res.json({ message: "Reset link sent to email" });

    } catch (error) {
      res.status(500).json({
        message: "Error sending reset email",
        error: error.message,
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
          message: "Token invalid or expired",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      user.password = hashedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();

      res.json({ message: "Password reset successful" });

    } catch (error) {
      res.status(500).json({
        message: "Error resetting password",
        error: error.message,
      });
    }
  },
};

module.exports = authController;