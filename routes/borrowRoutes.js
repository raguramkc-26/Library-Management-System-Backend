const express = require("express");
const borrowRouter = express.Router();

const {
  borrowBook,
  returnBook,
  getMyBorrowings
} = require("../controllers/borrowController");

const { isAuthenticated } = require("../middlewares/auth");

borrowRouter.use(isAuthenticated);

borrowRouter.get("/me", getMyBorrowings);
borrowRouter.post("/:bookId", borrowBook);
borrowRouter.put("/:borrowId/return", returnBook);

module.exports = borrowRouter; 