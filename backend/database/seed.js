require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const User = require("../models/User");

const uri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nitish_furniture";

const seed = async () => {
  try {
    await mongoose.connect(uri, { autoIndex: true });
    console.log("MongoDB connected for seeding");

    // Clear old data
    await Product.deleteMany({});
    await User.deleteMany({});

    // -------------------------
    // Seed Users
    // -------------------------
    await User.insertMany([
      {
        name: "Test Customer",
        email: "customer@test.com",
        password: "password123",
        role: "customer",
      },
      {
        name: "Test Admin",
        email: "admin@test.com",
        password: "admin123",
        role: "admin",
      },
    ]);

    // -------------------------
    // Import frontend product data
    // -------------------------
    const { bedroomProducts } = require("../../frontend/src/data/bedroomProducts");
    const { sofaProducts } = require("../../frontend/src/data/sofaProducts");
    const { mattressProducts } = require("../../frontend/src/data/mattressProducts");
    const { diningProducts } = require("../../frontend/src/data/diningProducts");
    const { livingProducts } = require("../../frontend/src/data/livingProducts");
    const { storageProducts } = require("../../frontend/src/data/storageProducts");
    const { kidsProducts } = require("../../frontend/src/data/kidsProducts");
    const { decorProducts } = require("../../frontend/src/data/decorProducts");
    const { officeProducts } = require("../../frontend/src/data/officeProducts");
    const { modularProducts } = require("../../frontend/src/data/modularProducts");

    // -------------------------
    // Helper: slug generator (unique)
    // -------------------------
    const usedSlugs = new Set();

    const generateSlug = (name) => {
      let slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      let originalSlug = slug;
      let counter = 1;

      while (usedSlugs.has(slug)) {
        slug = `${originalSlug}-${counter}`;
        counter++;
      }

      usedSlugs.add(slug);
      return slug;
    };

    // -------------------------
    // Transform frontend product → backend product
    // -------------------------
    const transformProduct = (product, categorySlug, category) => {
      if (!product || !product.name) return null;

      return {
        name: product.name,
        slug: generateSlug(product.name),
        category: category,
        categorySlug: categorySlug,
        style: "Modern + Traditional",

        // 🔥 IMPORTANT FIX
        basePrice: product.basePrice || product.price || 9999,

        shortDescription: product.description
          ? product.description.substring(0, 100)
          : product.name,

        description: product.description || product.name,

        images: product.imageUrl ? [product.imageUrl] : [],

        defaultWood: "Sheesham",
        defaultSize: "Standard",

        customization: {
          woodTypes: ["Sheesham", "Teak", "Mango"],
          sizes: ["Standard", "Large"],
          finishes: ["Natural", "Honey", "Walnut"],
        },

        inStock: product.inStock ?? true,

        tags: [
          category,
          product.subcategory
            ? product.subcategory.toLowerCase().replace(/\s+/g, "-")
            : category,
        ],

        featured: product.featured ?? false,
      };
    };

    // -------------------------
    // Combine all products
    // -------------------------
    const allProducts = [
      ...bedroomProducts.map((p) => transformProduct(p, "bedroom", "bedroom")),
      ...sofaProducts.map((p) => transformProduct(p, "sofas", "sofa")),
      ...mattressProducts.map((p) => transformProduct(p, "mattress", "mattress")),
      ...diningProducts.map((p) => transformProduct(p, "dining", "dining")),
      ...livingProducts.map((p) => transformProduct(p, "living", "living")),
      ...storageProducts.map((p) => transformProduct(p, "storage", "storage")),
      ...kidsProducts.map((p) => transformProduct(p, "kids", "kids")),
      ...decorProducts.map((p) => transformProduct(p, "decor", "decor")),
      ...officeProducts.map((p) => transformProduct(p, "office", "office")),
      ...modularProducts.map((p) => transformProduct(p, "modular", "modular")),
    ].filter(Boolean);

    // -------------------------
    // Insert products
    // -------------------------
    await Product.insertMany(allProducts);

    console.log(
      `Seeded ${allProducts.length} products successfully (Nitish Furniture House)`
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seed();
