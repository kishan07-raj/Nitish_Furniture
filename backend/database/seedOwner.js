const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  phone: { type: String },
  avatar: { type: String, default: "" },
  role: { type: String, enum: ["owner", "admin", "manager", "staff", "customer"], default: "customer" },
  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  lastLogin: { type: Date },
  twoFactorEnabled: { type: Boolean, default: false },
  customPermissions: [{ type: String }],
  addresses: [{ type: { type: String }, street: { type: String }, city: { type: String }, state: { type: String }, zipCode: { type: String }, country: { type: String } }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  points: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
}, { timestamps: true });

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const bcrypt = require("bcryptjs");
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/nitish_furniture");
    console.log("Connected to MongoDB");

    // Check if owner exists
    const existingOwner = await User.findOne({ role: "owner" });
    
    if (existingOwner) {
      console.log("Owner already exists:", existingOwner.email);
      console.log("Role:", existingOwner.role);
    } else {
      // Create owner
      const owner = await User.create({
        name: "Nitish Owner",
        email: "owner@nitishfurniture.com",
        password: "owner123456", // Change this in production!
        phone: "+91 9876543210",
        role: "owner",
        isActive: true,
        isBlocked: false
      });
      console.log("Owner created successfully!");
      console.log("Email:", owner.email);
      console.log("Password: owner123456");
    }

    // Create admin if not exists
    const adminEmail = "admin@nitishfurniture.com";
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      await User.create({
        name: "Admin User",
        email: adminEmail,
        password: "admin123456",
        phone: "+91 9876543211",
        role: "admin",
        isActive: true,
        isBlocked: false
      });
      console.log("Admin created!");
      console.log("Email: admin@nitishfurniture.com");
      console.log("Password: admin123456");
    }

    console.log("\n=== SEED COMPLETE ===");
    console.log("Login credentials:");
    console.log("Owner: owner@nitishfurniture.com / owner123456");
    console.log("Admin: admin@nitishfurniture.com / admin123456");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seed();
