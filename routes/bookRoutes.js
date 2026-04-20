const express = require("express");
const bookRouter = express.Router();

const {
  getAllBooks,
  createBook,
  getBookById,
  updateBook,
  deleteBook,
  searchBooks,
} = require("../controllers/bookController");

const { isAuthenticated, allowRoles } = require("../middlewares/auth");

// ORDER MATTERS
bookRouter.get("/search", searchBooks);
bookRouter.get("/", getAllBooks);
bookRouter.get("/:id", getBookById);

// ADMIN ONLY
bookRouter.post("/", isAuthenticated, allowRoles(["admin"]), createBook);
bookRouter.put("/:id", isAuthenticated, allowRoles(["admin"]), updateBook);
bookRouter.delete("/:id", isAuthenticated, allowRoles(["admin"]), deleteBook);

module.exports = bookRouter;