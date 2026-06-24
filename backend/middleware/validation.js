const { body, param, query, validationResult } = require("express-validator");

// ============================================
// Validation Result Handler
// ============================================
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// ============================================
// User Validation Rules
// ============================================

// Profile Update Validation
const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("phone")
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please enter a valid 10-digit Indian phone number"),
  body("avatar")
    .optional()
    .trim()
    .isURL()
    .withMessage("Avatar must be a valid URL"),
  validate
];

// Address Validation Rules
const addressValidation = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),
  body("phone")
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please enter a valid 10-digit Indian phone number"),
  body("addressLine1")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be between 5 and 200 characters"),
  body("addressLine2")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Address line 2 must be less than 200 characters"),
  body("landmark")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Landmark must be less than 100 characters"),
  body("city")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters"),
  body("state")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be between 2 and 50 characters"),
  body("pincode")
    .trim()
    .matches(/^[1-9]\d{5}$/)
    .withMessage("Please enter a valid 6-digit Indian pincode"),
  body("postalCode")
    .optional()
    .trim()
    .matches(/^[1-9]\d{5}$/)
    .withMessage("Please enter a valid 6-digit Indian postal code"),
  body("country")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Country must be less than 50 characters")
    .default("India"),
  body("addressType")
    .optional()
    .isIn(["Home", "Office", "Other"])
    .withMessage("Address type must be Home, Office, or Other"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean value"),
  validate
];

// Address ID Validation
const addressIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid address ID"),
  validate
];

// ============================================
// Order Validation Rules
// ============================================

// Create Order Validation
const createOrderValidation = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must have at least one item"),
  body("items.*.name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("items.*.pricePerUnit")
    .isFloat({ min: 0 })
    .withMessage("Price per unit must be a positive number"),
  body("shippingAddress.fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required for shipping"),
  body("shippingAddress.phone")
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please enter a valid phone number"),
  body("shippingAddress.addressLine1")
    .trim()
    .notEmpty()
    .withMessage("Address is required"),
  body("shippingAddress.city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),
  body("shippingAddress.state")
    .trim()
    .notEmpty()
    .withMessage("State is required"),
  body("shippingAddress.pincode")
    .trim()
    .matches(/^[1-9]\d{5}$/)
    .withMessage("Please enter a valid postal code"),
  body("paymentMethod")
    .optional()
    .isIn(["COD", "ONLINE", "CARD", "UPI", "WALLET"])
    .withMessage("Invalid payment method"),
  body("totalAmount")
    .isFloat({ min: 0 })
    .withMessage("Total amount must be a positive number"),
  validate
];

// Order ID Validation
const orderIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid order ID"),
  validate
];

// Cancel Order Validation
const cancelOrderValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid order ID"),
  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Cancellation reason must be less than 500 characters"),
  validate
];

// Admin Update Order Status Validation
const updateOrderStatusValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid order ID"),
  body("status")
    .isIn(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"])
    .withMessage("Invalid order status"),
  body("paymentStatus")
    .optional()
    .isIn(["pending", "paid", "failed", "refunded", "partially_refunded"])
    .withMessage("Invalid payment status"),
  body("trackingId")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Tracking ID must be less than 50 characters"),
  body("cancellationReason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Cancellation reason must be less than 500 characters"),
  body("returnReason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Return reason must be less than 500 characters"),
  validate
];

// Admin Orders List Validation
const adminOrdersListValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("status")
    .optional()
    .isIn(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"])
    .withMessage("Invalid status filter"),
  query("paymentStatus")
    .optional()
    .isIn(["pending", "paid", "failed", "refunded"])
    .withMessage("Invalid payment status filter"),
  validate
];

// ============================================
// User Orders List Validation
// ============================================
const userOrdersListValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  query("status")
    .optional()
    .isIn(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"])
    .withMessage("Invalid status filter"),
  query("sort")
    .optional()
    .isIn(["newest", "oldest", "price-high", "price-low"])
    .withMessage("Invalid sort option"),
  query("search")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Search query must be less than 50 characters"),
  validate
];

// ============================================
// Change Password Validation
// ============================================
const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6, max: 100 })
    .withMessage("New password must be between 6 and 100 characters")
    .matches(/\d/)
    .withMessage("New password must contain at least one number"),
  body("confirmPassword")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Confirm password does not match new password");
      }
      return true;
    }),
  validate
];

// ============================================
// Wishlist Validation
// ============================================
const wishlistValidation = [
  param("productId")
    .isMongoId()
    .withMessage("Invalid product ID"),
  validate
];

module.exports = {
  // User
  updateProfileValidation,
  addressValidation,
  addressIdValidation,
  
  // Order
  createOrderValidation,
  orderIdValidation,
  cancelOrderValidation,
  updateOrderStatusValidation,
  adminOrdersListValidation,
  userOrdersListValidation,
  
  // Security
  changePasswordValidation,
  
  // Wishlist
  wishlistValidation
};

