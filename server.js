const mongoose = require("mongoose");
const cron = require("node-cron");

const { MONGODB_URI, PORT } = require("./utils/config");
const app = require("./app");
const checkOverdue = require("./jobs/overdueJob");

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    // Run daily at 9 AM
    cron.schedule("0 9 * * *", () => {
      console.log("Running overdue check...");
      checkOverdue();
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB error:", err.message);
  });