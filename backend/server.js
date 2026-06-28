const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");

dotenv.config();

// ============================================
// DEBUG: Log environment variables at startup
// ============================================
console.log("\n========== SERVER STARTUP - ENV CHECK ==========");
console.log("PORT:", process.env.PORT || "5000 (default)");
console.log("MONGO_URI:", process.env.MONGO_URI ? "✓ SET" : "✗ UNDEFINED");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "✓ SET" : "✗ UNDEFINED");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✓ SET (length: " + process.env.EMAIL_PASS.length + ")" : "✗ UNDEFINED");
console.log("OWNER_EMAIL:", process.env.OWNER_EMAIL ? "✓ SET" : "✗ UNDEFINED (will use default)");
console.log("================================================\n");

// Set mongoose global options
mongoose.set("strictQuery", false);

const app = express();
const server = http.createServer(app);

// Serve uploaded product images (local disk uploads)
const { UPLOAD_DIR } = (() => {
  try {
    return require("./middleware/upload");
  } catch {
    return { UPLOAD_DIR: "./uploads" };
  }
})();
app.use("/uploads", express.static(UPLOAD_DIR));

// Initialize Socket.io
const { initSocket } = require("./config/socket");
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/nitish_furniture", {
  maxPoolSize: 10,
  retryWrites: false,
  retryReads: false,
  directConnection: false,
})
.then(() => {
  console.log("✅ MongoDB connected successfully!");
  console.log("📊 Connected DB:", mongoose.connection.name);
})
.catch(err => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/user"));
app.use("/api/products", require("./routes/product"));
app.use("/api/orders", require("./routes/order"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/admin/products", require("./routes/adminProducts"));
app.use("/api/admin/orders", require("./routes/adminOrders"));
app.use("/api/admin/users", require("./routes/adminUsers"));
app.use("/api/admin", require("./routes/adminDashboard"));
app.use("/api/owner", require("./routes/owner"));
app.use("/api/delivery-partners", require("./routes/deliveryPartner"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/recommendations", require("./routes/recommendations"));
app.use("/api/voice", require("./routes/voiceCommerce"));
app.use("/api", require("./routes/chat"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/cart", require("./routes/cart"));
// app.use("/api/reviews", require("./routes/reviews"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Nitish Furniture Backend API is Running 🚀"
  });
});

// Test email route
app.get("/api/test-email", async (req, res) => {
  try {
    const { verifyTransporter, sendOwnerNotificationEmail } = require("./config/email");
    const isVerified = await verifyTransporter();
    if (!isVerified) {
      return res.status(500).json({ success: false, message: "SMTP verification failed" });
    }
    const result = await sendOwnerNotificationEmail({ orderId: "TEST-" + Date.now() }, "Test Customer");
    if (result.success) {
      res.json({ success: true, message: "Test email sent successfully!", messageId: result.messageId });
    } else {
      res.status(500).json({ success: false, message: "Failed to send email", error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Email test failed", error: error.message });
  }
});

// Email system verification at startup
const { verifyTransporter } = require("./config/email");
setTimeout(async () => {
  const emailReady = await verifyTransporter();
  if (emailReady) {
    console.log("✓ Email system is ready to send notifications!");
  } else {
    console.log("✗ Email system has issues - see errors above");
  }
}, 2000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful error handling
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ PORT ${PORT} IS ALREADY IN USE`);
    process.exit(1);
  } else {
    console.error("Server error:", err);
    process.exit(1);
  }
});
