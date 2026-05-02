const express = require("express");
const borrowRouter = express.Router();

const {
  borrowBook,
  returnBook,
  getMyBorrowings,
  reserveBook,
} = require("../controllers/borrowController");

const { isAuthenticated } = require("../middlewares/auth");

// apply auth middleware
borrowRouter.use(isAuthenticated);

// ROUTES 

// get user's borrowings
borrowRouter.get("/me", getMyBorrowings);

// borrow book
borrowRouter.post("/:bookId", borrowBook);

// reserve book
borrowRouter.post("/:bookId/reserve", reserveBook);

// return book
borrowRouter.put("/:borrowId/return", returnBook);

module.exports = borrowRouter;