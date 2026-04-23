const express = require("express");
const router = express.Router();

const {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");

const { isAuthenticated, allowRoles } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// PUBLIC
router.get("/", getBooks);
router.get("/:id", getBookById);

// ADMIN
router.post(
  "/",
  isAuthenticated,
  allowRoles("admin"),
  upload.single("image"),
  createBook
);

router.put(
  "/:id",
  isAuthenticated,
  allowRoles("admin"),
  upload.single("image"),
  updateBook
);

router.delete(
  "/:id",
  isAuthenticated,
  allowRoles("admin"),
  deleteBook
);

module.exports = router;