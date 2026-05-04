const express = require("express");

const {
  getUserDetails,
  updateRole,
  getAllUsers,
  deleteUser,
} = require("../controllers/userController");

const { isAuthenticated, allowRoles } = require("../middlewares/auth");

const userRouter = express.Router();

userRouter.get("/", isAuthenticated, allowRoles("admin"), getAllUsers);

userRouter.get("/:id", isAuthenticated, getUserDetails);

userRouter.put("/:id", isAuthenticated, allowRoles("admin"), updateRole);

userRouter.delete("/:id", isAuthenticated, allowRoles("admin"), deleteUser);

module.exports = userRouter;