const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Razorpay integration placeholder
router.post("/create-order", protect, async (req, res) => {
  // TODO: integrate Razorpay order creation here
  res.json({
    message: "Razorpay order creation placeholder",
    amount: req.body.amount
  });
});

module.exports = router;
