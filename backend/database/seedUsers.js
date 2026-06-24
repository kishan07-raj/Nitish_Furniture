require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const uri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nitish_furniture";

const seedUsers = async () => {
  try {
    await mongoose.connect(uri, { autoIndex: true });
    console.log("MongoDB connected for seeding users");

    await User.deleteMany({}); // Clear existing users

    // Seed test users
    await User.create([
      {
        name: "Admin User",
        email: "admin@example.com",
        password: "admin123",
        role: "admin",
        phone: "1234567890",
      },
      {
        name: "Customer User",
        email: "customer@example.com",
        password: "customer123",
        role: "customer",
        phone: "0987654321",
      },
    ]);

    console.log("Seeded test users");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedUsers();
