require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const logger = require("./middlewares/logger");
const errorRoute = require("./middlewares/errorRoute");
const upload = require("./middlewares/upload");
const authRouter = require("./routes/authRoutes");
const bookRouter = require("./routes/bookRoutes");
const borrowRouter = require("./routes/borrowRoutes");
const userRouter = require("./routes/userRoutes");
const reservationRouter = require("./routes/reservationRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// CORS
app.use(
  cors({
    origin:[ "http://localhost:5173","https://librarymanagemsystem.netlify.app" ],
    credentials: true,
  })
);

// Parsers
app.use(express.json());
app.use(cookieParser());

// Logger
app.use(logger);

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/books", bookRouter);
app.use("/api/v1/borrow", borrowRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/reservation", reservationRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/notifications", notificationRoutes);
// Test route
app.get("/test-email", async (req, res) => {
  const sendMail = require("./utils/email");

  await sendMail(
    process.env.EMAIL_USER,
    "Test Email",
    "If you see this, email works"
  );

  res.send("Email sent");
});

// Error handler (must be last)
app.use(errorRoute);

module.exports = app;