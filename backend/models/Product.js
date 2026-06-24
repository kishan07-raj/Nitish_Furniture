// backend/models/Product.js
const mongoose = require("mongoose");

const customizationSchema = new mongoose.Schema(
  {
    woodTypes: [{ type: String }],
    sizes: [{ type: String }],
    finishes: [{ type: String }]
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: [{ type: String }],
    verified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true }, // bed, sofa, dining, etc.
    categorySlug: { type: String, required: true }, // beds, sofas, dining-sets, etc.
    style: { type: String, default: "Modern + Traditional" },
    basePrice: { type: Number, required: true },
    description: { type: String },
    shortDescription: { type: String },
    images: [{ type: String }],
    defaultWood: { type: String, default: "Sheesham" },
    defaultSize: { type: String, default: "Queen" },
    customization: customizationSchema,
    inStock: { type: Boolean, default: true },
    reviews: [reviewSchema],
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    featured: { type: Boolean, default: false },
    discount: { type: Number, default: 0 }, // percentage
    weight: { type: Number }, // in kg
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
