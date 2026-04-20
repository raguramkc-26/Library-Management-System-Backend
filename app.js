require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("./middlewares/logger");
const errorRoute = require("./middlewares/errorRoute");
const authRouter = require("./routes/authRoutes");
const bookRouter = require("./routes/bookRoutes");
const borrowRouter = require("./routes/borrowRoutes");
const userRouter = require("./routes/userRoutes");
const reservationRouter = require("./routes/reservationRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const cors = require('cors');

const app = express();
app.use(cors({
    origin: 'http://localhost:5173', // Your Vite frontend URL
    credentials: true,               // Required if you are using cookieParser
    methods: ["GET","POST","PUT","DELETE","OPTIONS"],
    allowedHeaders: ["content-type", "Authorization"]
}));

app.options("*", cors());

// middleware to parse the body of incoming requests as JSON
app.use(express.json());

// middleware to parse cookies
app.use(cookieParser());

// custom logger middleware
app.use(logger);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/books', bookRouter);
app.use('/api/v1/borrow', borrowRouter);
app.use('/api/v1/user', userRouter);
app.use("/api/v1/reservation", reservationRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("api/notifications",notificationRoutes);
app.get("/test-email", async (req, res) => {
  const sendMail = require("./utils/email");

  await sendMail(
    process.env.EMAIL_USER, // send to yourself
    "Test Email",
    "If you see this, email works"
  );

  res.send("Email sent");
});

// middleware to handle undefined routes
app.use(errorRoute);

module.exports = app;