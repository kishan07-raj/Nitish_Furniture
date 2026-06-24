const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const path = require("path");

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

// Set mongoose global options to prevent transaction errors on standalone MongoDB
mongoose.set('strictQuery', false);

const app = express();
const server = http.createServer(app);

// Serve uploaded product images (local disk uploads)
const { UPLOAD_DIR } = (() => {
  try {
    return require("./middleware/upload");
  } catch {
    return { UPLOAD_DIR: path.join(__dirname, "../uploads") };
  }
})();
app.use("/uploads", express.static(UPLOAD_DIR));




// Initialize Socket.io
const { initSocket } = require("./config/socket");
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Database connection with options to prevent transaction errors on standalone MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/nitish_furniture", {
  maxPoolSize: 10,
  retryWrites: false,
  retryReads: false,
  directConnection: false,
})
.then(() => {
  console.log("✅ MongoDB connected successfully!");
  console.log("📊 Connected DB:", mongoose.connection.name);
  console.log("🔗 Connection URI:", process.env.MONGO_URI ? "From ENV" : "Default");
})
.catch(err => console.error("MongoDB connection error:", err));

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const orderRoutes = require("./routes/order");
const paymentRoutes = require("./routes/payment");
const adminProductsRoutes = require("./routes/adminProducts");
const adminOrdersRoutes = require("./routes/adminOrders");
const adminUsersRoutes = require("./routes/adminUsers");
const adminDashboardRoutes = require("./routes/adminDashboard");
const ownerRoutes = require("./routes/owner");
const chatRoutes = require("./routes/chat");
const wishlistRoutes = require("./routes/wishlist");
const reviewRoutes = require("./routes/reviews");
const cartRoutes = require("./routes/cart");
const deliveryPartnerRoutes = require("./routes/deliveryPartner");
const notificationRoutes = require("./routes/notifications");
const recommendationsRoutes = require("./routes/recommendations");
const voiceCommerceRoutes = require("./routes/voiceCommerce");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin/products", adminProductsRoutes);
app.use("/api/admin/orders", adminOrdersRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/delivery-partners", deliveryPartnerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/voice", voiceCommerceRoutes);
app.use("/api", chatRoutes);
app.use("/api/wishlist", wishlistRoutes);
// app.use("/api/reviews", reviewRoutes);
app.use("/api/cart", cartRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// ============================================
// SERVE STATIC FRONTEND FILES (PRODUCTION)
// ============================================
const staticPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(staticPath));

// Catch-all: serve index.html for React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

// ============================================
// TEST EMAIL ROUTE - For debugging email system
// Usage: http://localhost:5000/api/test-email
// ============================================
app.get("/api/test-email", async (req, res) => {
  console.log("\n========== TEST EMAIL ROUTE HIT ==========");
  
  try {
    const { verifyTransporter, sendOwnerNotificationEmail } = require("./config/email");
    
    // First verify SMTP connection
    console.log("Verifying SMTP connection...");
    const isVerified = await verifyTransporter();
    
    if (!isVerified) {
      return res.status(500).json({ 
        success: false, 
        message: "SMTP verification failed. Check server console for details.",
        troubleshooting: [
          "1. Ensure Google 2-Step Verification is ON",
          "2. Generate a new App Password at myaccount.google.com",
          "3. Update .env with the new 16-character App Password",
          "4. Restart the server"
        ]
      });
    }
    
    // Create a test order for the owner notification
    const testOrder = {
      orderId: "TEST-" + Date.now(),
      _id: "test-id-" + Date.now(),
      items: [
        { name: "Test Product 1", quantity: 1, pricePerUnit: 999 },
        { name: "Test Product 2", quantity: 2, pricePerUnit: 1499 }
      ],
      itemsTotal: 3997,
      shippingCharge: 199,
      grandTotal: 4196,
      createdAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      paymentMethod: "COD",
      paymentStatus: "pending",
      shippingAddress: {
        fullName: "Test Customer",
        email: "test@example.com",
        phone: "7488806695",
        addressLine1: "123 Test Street",
        city: "Test City",
        state: "TS",
        pincode: "500001"
      }
    };
    
    console.log("Sending test email to owner...");
    const result = await sendOwnerNotificationEmail(testOrder, "Test Customer");
    
    if (result.success) {
      console.log("✓ Test email sent successfully!");
      res.json({ 
        success: true, 
        message: "Test email sent successfully!",
        messageId: result.messageId
      });
    } else {
      console.error("✗ Test email failed:", result.error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to send email",
        error: result.error
      });
    }
  } catch (error) {
    console.error("✗ Test email route error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Email test failed",
      error: error.message 
    });
  }
});

// ============================================
// EMAIL SYSTEM VERIFICATION AT STARTUP
// ============================================
const { verifyTransporter } = require("./config/email");

// Verify SMTP after server starts (delayed to ensure MongoDB is connected)
setTimeout(async () => {
  console.log("\n========== EMAIL SYSTEM STARTUP CHECK ==========");
  const emailReady = await verifyTransporter();
  if (emailReady) {
    console.log("✓ Email system is ready to send notifications!");
    console.log("   Owner will receive emails when orders are placed.");
  } else {
    console.log("✗ Email system has issues - see errors above");
  }
  console.log("================================================\n");
}, 2000); // Wait 2 seconds after server starts

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful error handling for port conflicts and other server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ PORT ${PORT} IS ALREADY IN USE`);
    console.error(`Another process is listening on port ${PORT}.`);
    console.error(`\nTo fix this, run one of the following commands:\n`);
    console.error(`   Windows (CMD):      netstat -ano | findstr :${PORT} && taskkill /PID <PID> /F`);
    console.error(`   Windows (PowerShell): Get-NetTCPConnection -LocalPort ${PORT} | Stop-Process -Id { $_.OwningProcess }`);
    console.error(`   Or change the PORT in your .env file and restart.\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
