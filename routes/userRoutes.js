const express = require("express");
const {  getUserDetails, updateRole } = require("../controllers/userController"); 
const { isAuthenticated, allowRoles } = require("../middlewares/auth");
const userRouter = express.Router();
userRouter.get("/:id", isAuthenticated, getUserDetails); 
userRouter.put("/:id", isAuthenticated, allowRoles (["admin"]), updateRole);
module.exports = userRouter;             

