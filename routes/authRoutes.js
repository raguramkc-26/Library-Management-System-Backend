const express = require("express");
const { register, login, getMe, logout } = require("../controllers/authController");
const { isAuthenticated } = require("../middlewares/auth");
const authController = require("../controllers/authController");
const authRouter = express.Router();

// public routes
authRouter.post("/register", register);
authRouter.post("/login", login);

// protected routes
authRouter.get("/getMe", isAuthenticated, getMe);
authRouter.post("/logout", isAuthenticated, logout);

authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password/:token", authController.resetPassword);

module.exports = authRouter; 