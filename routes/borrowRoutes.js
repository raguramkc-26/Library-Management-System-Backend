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
borrowRouter.post("/borrow/:bookId", borrowBook);

// reserve book
borrowRouter.post("/reserve/:bookId", reserveBook);

// return book
borrowRouter.put("/return/:borrowId", returnBook);

module.exports = borrowRouter;