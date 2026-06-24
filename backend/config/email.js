// backend/config/email.js
const nodemailer = require("nodemailer");

// ============================================
// STEP 1: VERIFY ENVIRONMENT VARIABLES
// ============================================
console.log("========== EMAIL CONFIG LOADING ==========");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "✓ SET" : "✗ UNDEFINED");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✓ SET (length: " + process.env.EMAIL_PASS.length + ")" : "✗ UNDEFINED");
console.log("OWNER_EMAIL:", process.env.OWNER_EMAIL || "✗ UNDEFINED (will use default)");
console.log("==========================================");

// ============================================
// STEP 2: CREATE SINGLETON TRANSPORTER
// ============================================
let transporter = null;

const createTransporter = () => {
  // Return existing transporter if already created (singleton pattern)
  if (transporter) {
    return transporter;
  }

  // Validate credentials before creating transporter
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ EMAIL CONFIG ERROR: Missing EMAIL_USER or EMAIL_PASS in .env file");
    console.error("   Please ensure your .env file has:");
    console.error("   EMAIL_USER=your-email@gmail.com");
    console.error("   EMAIL_PASS=your-16-char-app-password");
    console.error("   OWNER_EMAIL=your-owner-email@gmail.com");
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: process.env.EMAIL_PASS.trim(),
    },
  });

  console.log("✓ Transporter created successfully");
  return transporter;
};

// ============================================
// STEP 3: VERIFY SMTP CONNECTION
// ============================================
const verifyTransporter = async () => {
  try {
    const testTransporter = createTransporter();
    if (!testTransporter) {
      console.error("❌ SMTP VERIFY FAILED: Transporter not created");
      return false;
    }

    await testTransporter.verify();
    console.log("✓ SMTP Server is ready - emails can be sent!");
    return true;
  } catch (error) {
    console.error("❌ SMTP VERIFY FAILED:", error.message);
    console.error("   Common causes:");
    console.error("   - Wrong password (use Google App Password, not login password)");
    console.error("   - 2-Step Verification not enabled on Google account");
    console.error("   - App password has expired or been revoked");
    return false;
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Format price in Indian Rupees
const formatPrice = (price) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);
};

// Format date for display
const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// Generate professional HTML bill template for customer
const generateOrderBillHTML = (order, customerName) => {
  const itemsHTML = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        ${item.name}
        ${item.selectedWood ? `<br><small style="color: #6b7280;">Wood: ${item.selectedWood}</small>` : ""}
        ${item.selectedSize ? `<br><small style="color: #6b7280;">Size: ${item.selectedSize}</small>` : ""}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.pricePerUnit)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.pricePerUnit * item.quantity)}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #b45309 0%, #92400e 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Nitish Furniture House</h1>
      <p style="color: #fef3c7; margin: 5px 0 0 0; font-size: 14px;">Premium Furniture Crafted with Love</p>
    </div>

    <!-- Success Message -->
    <div style="padding: 30px; text-align: center;">
      <div style="width: 60px; height: 60px; background-color: #d1fae5; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg style="width: 30px; height: 30px; color: #059669;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h2 style="color: #111827; margin: 0 0 10px; font-size: 22px;">Order Confirmed Successfully!</h2>
      <p style="color: #6b7280; margin: 0;">Thank you for choosing Nitish Furniture House</p>
    </div>

    <!-- Order Details -->
    <div style="padding: 0 30px 30px;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order ID:</td>
          <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right; font-family: monospace;">${order.orderId || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order Date:</td>
          <td style="padding: 8px 0; color: #111827; text-align: right;">${formatDate(order.createdAt)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Estimated Delivery:</td>
          <td style="padding: 8px 0; color: #059669; font-weight: 500; text-align: right;">${formatDate(order.estimatedDelivery)}</td>
        </tr>
      </table>

      <!-- Customer Info -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #111827; margin: 0 0 15px; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Customer Details</h3>
        <p style="margin: 5px 0; color: #374151; font-size: 14px;"><strong>Name:</strong> ${customerName}</p>
        <p style="margin: 5px 0; color: #374151; font-size: 14px;"><strong>Phone:</strong> ${order.shippingAddress?.phone || "N/A"}</p>
      </div>

      <!-- Shipping Address -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #111827; margin: 0 0 15px; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Shipping Address</h3>
        <p style="margin: 5px 0; color: #374151; font-size: 14px;">${order.shippingAddress?.fullName}</p>
        <p style="margin: 5px 0; color: #374151; font-size: 14px;">${order.shippingAddress?.addressLine1}</p>
        ${order.shippingAddress?.addressLine2 ? `<p style="margin: 5px 0; color: #374151; font-size: 14px;">${order.shippingAddress.addressLine2}</p>` : ""}
        <p style="margin: 5px 0; color: #374151; font-size: 14px;">${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}</p>
        <p style="margin: 5px 0; color: #374151; font-size: 14px;">${order.shippingAddress?.country || "India"}</p>
      </div>

      <!-- Payment Method -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #111827; margin: 0 0 15px; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Payment Method</h3>
        <p style="margin: 0; color: #374151; font-size: 14px;">
          <strong>${order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}</strong>
          <span style="color: #d97706; font-size: 12px; margin-left: 10px;">(${order.paymentStatus === "pending" ? "Payment Pending" : "Paid"})</span>
        </p>
      </div>

      <!-- Order Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #374151; font-size: 12px; text-transform: uppercase;">Product</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #374151; font-size: 12px; text-transform: uppercase;">Qty</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151; font-size: 12px; text-transform: uppercase;">Price</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151; font-size: 12px; text-transform: uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <!-- Order Summary -->
      <div style="border-top: 2px solid #e5e7eb; padding-top: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Subtotal</td>
            <td style="padding: 8px 0; text-align: right; color: #374151;">${formatPrice(order.itemsTotal)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Shipping</td>
            <td style="padding: 8px 0; text-align: right; color: #374151;">${formatPrice(order.shippingCharge)}</td>
          </tr>
          <tr style="border-top: 2px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #111827; font-size: 16px; font-weight: 600;">Total Amount</td>
            <td style="padding: 12px 0; text-align: right; color: #b45309; font-size: 18px; font-weight: 700;">${formatPrice(order.grandTotal)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #1f2937; padding: 30px; text-align: center;">
      <p style="color: #9ca3af; margin: 0 0 10px; font-size: 14px;">Need help? Contact our support team</p>
      <p style="color: #ffffff; margin: 0 0 5px; font-size: 14px;">+91 6200694677 | support@nitishfurniture.com</p>
      <p style="color: #6b7280; margin: 15px 0 0; font-size: 12px;">
        Nitish Furniture House | Jodhpur, Rajasthan | www.nitishfurniture.com
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

// Generate professional HTML template for owner notification
const generateOwnerNotificationHTML = (order, customerName) => {
  const itemsHTML = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        ${item.name}
        ${item.selectedWood ? `<br><small style="color: #6b7280;">Wood: ${item.selectedWood}</small>` : ""}
        ${item.selectedSize ? `<br><small style="color: #6b7280;">Size: ${item.selectedSize}</small>` : ""}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.pricePerUnit)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.pricePerUnit * item.quantity)}</td>
    </tr>
  `
    )
    .join("");

  const paymentStatusColor = order.paymentStatus === "paid" ? "#059669" : "#d97706";
  const paymentStatusText = order.paymentStatus === "paid" ? "Paid" : "Pending";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header - Green for owner notification -->
    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">New Order Received</h1>
      <p style="color: #d1fae5; margin: 5px 0 0 0; font-size: 14px;">Nitish Furniture House</p>
    </div>

    <!-- Order Alert -->
    <div style="padding: 30px; text-align: center;">
      <div style="width: 60px; height: 60px; background-color: #dbeafe; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg style="width: 30px; height: 30px; color: #2563eb;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
        </svg>
      </div>
      <h2 style="color: #111827; margin: 0 0 10px; font-size: 22px;">New Order #${order.orderId || order._id}</h2>
      <p style="color: #6b7280; margin: 0;">You have received a new order!</p>
    </div>

    <!-- Order Details -->
    <div style="padding: 0 30px 30px;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order ID:</td>
          <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right; font-family: monospace;">${order.orderId || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order Date:</td>
          <td style="padding: 8px 0; color: #111827; text-align: right;">${formatDate(order.createdAt)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Estimated Delivery:</td>
          <td style="padding: 8px 0; color: #059669; font-weight: 500; text-align: right;">${formatDate(order.estimatedDelivery)}</td>
        </tr>
      </table>

      <!-- Customer Info -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #111827; margin: 0 0 15px; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Customer Details</h3>
        <p style="margin: 5px 0; color: #374151; font-size: 14px;"><strong>Name:</strong> ${customerName}</p>
        <p style="margin: 5px 0; color: #374151; font-size: 14px;"><strong>Email:</strong> ${order.shippingAddress?.email || "N/A"}</p>
        <p style="margin: 5px 0; color: #374151; font-size: 14px;"><strong>Phone:</strong> ${order.shippingAddress?.phone || "N/A"}</p>
      </div>

      <!-- Shipping Address -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #111827; margin: 0 0 15px; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Shipping Address</h3>
        <p style="margin: 5px 0; color: #374151; font-size: 14px;">${order.shippingAddress?.fullName}</p>
        <p style="margin: 5px 0; color: #374151; font-size: 14px;">${order.shippingAddress?.addressLine1}</p>
        ${order.shippingAddress?.addressLine2 ? `<p style="margin: 5px 0; color: #374151; font-size: 14px;">${order.shippingAddress.addressLine2}</p>` : ""}
        <p style="margin: 5px 0; color: #374151; font-size: 14px;">${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}</p>
        <p style="margin: 5px 0; color: #374151; font-size: 14px;">${order.shippingAddress?.country || "India"}</p>
      </div>

      <!-- Payment Info -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #111827; margin: 0 0 15px; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Payment Details</h3>
        <p style="margin: 5px 0; color: #374151; font-size: 14px;"><strong>Method:</strong> ${order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}</p>
        <p style="margin: 5px 0; color: #374151; font-size: 14px;"><strong>Status:</strong> 
          <span style="color: ${paymentStatusColor}; font-weight: 500;">${paymentStatusText}</span>
        </p>
      </div>

      <!-- Order Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #374151; font-size: 12px; text-transform: uppercase;">Product</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #374151; font-size: 12px; text-transform: uppercase;">Qty</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151; font-size: 12px; text-transform: uppercase;">Price</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151; font-size: 12px; text-transform: uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <!-- Order Summary -->
      <div style="border-top: 2px solid #e5e7eb; padding-top: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Subtotal</td>
            <td style="padding: 8px 0; text-align: right; color: #374151;">${formatPrice(order.itemsTotal)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Shipping</td>
            <td style="padding: 8px 0; text-align: right; color: #374151;">${formatPrice(order.shippingCharge)}</td>
          </tr>
          <tr style="border-top: 2px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #111827; font-size: 16px; font-weight: 600;">Total Amount</td>
            <td style="padding: 12px 0; text-align: right; color: #059669; font-size: 18px; font-weight: 700;">${formatPrice(order.grandTotal)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #1f2937; padding: 30px; text-align: center;">
      <p style="color: #9ca3af; margin: 0 0 10px; font-size: 14px;">Nitish Furniture House | Jodhpur, Rajasthan</p>
      <p style="color: #6b7280; margin: 0; font-size: 12px;">www.nitishfurniture.com</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Send order confirmation email to customer
const sendOrderConfirmationEmail = async (order, customerEmail, customerName) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = generateOrderBillHTML(order, customerName);

    const info = await transporter.sendMail({
      from: `"Nitish Furniture House" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Order Confirmation - ${order.orderId || "Order #" + order._id}`,
      html: htmlContent,
    });

    console.log("Customer email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending customer email:", error);
    return { success: false, error: error.message };
  }
};

// Send notification email to owner (Professional HTML Template)
const sendOwnerNotificationEmail = async (order, customerName) => {
  try {
    const transporter = createTransporter();
    const ownerEmail = process.env.OWNER_EMAIL || "kishankrvpd@gmail.com";

    const htmlContent = generateOwnerNotificationHTML(order, customerName);

    const info = await transporter.sendMail({
      from: `"Nitish Furniture House" <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      subject: `New Order - ${order.orderId || order._id} - ${formatPrice(order.grandTotal)}`,
      html: htmlContent,
    });

    console.log("Owner notification sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending owner notification:", error);
    return { success: false, error: error.message };
  }
};

// ============================================
// Order Cancellation Email Template
// ============================================
const generateOrderCancellationHTML = (order, customerName) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Cancelled</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Order Cancelled</h1>
      <p style="color: #fef2f2; margin: 5px 0 0 0; font-size: 14px;">Nitish Furniture House</p>
    </div>

    <!-- Message -->
    <div style="padding: 30px; text-align: center;">
      <div style="width: 60px; height: 60px; background-color: #fee2e2; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg style="width: 30px; height: 30px; color: #dc2626;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </div>
      <h2 style="color: #111827; margin: 0 0 10px; font-size: 22px;">Your Order Has Been Cancelled</h2>
      <p style="color: #6b7280; margin: 0;">We have cancelled your order. If you have any questions, please contact us.</p>
    </div>

    <!-- Order Details -->
    <div style="padding: 0 30px 30px;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order ID:</td>
          <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right; font-family: monospace;">${order.orderId || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Cancelled On:</td>
          <td style="padding: 8px 0; color: #111827; text-align: right;">${formatDate(order.cancelledAt)}</td>
        </tr>
        ${order.cancellationReason ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Reason:</td>
          <td style="padding: 8px 0; color: #111827; text-align: right;">${order.cancellationReason}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Refund Amount:</td>
          <td style="padding: 8px 0; color: #059669; font-weight: 600; text-align: right;">${formatPrice(order.grandTotal)}</td>
        </tr>
      </table>

      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        If you paid online, your refund will be processed within 5-7 business days.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #1f2937; padding: 30px; text-align: center;">
      <p style="color: #9ca3af; margin: 0 0 10px; font-size: 14px;">Need help? Contact our support team</p>
      <p style="color: #ffffff; margin: 0 0 5px; font-size: 14px;">+91 6200694677 | support@nitishfurniture.com</p>
      <p style="color: #6b7280; margin: 15px 0 0; font-size: 12px;">
        Nitish Furniture House | Jodhpur, Rajasthan | www.nitishfurniture.com
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

// ============================================
// Order Shipped Email Template
// ============================================
const generateOrderShippedHTML = (order, customerName) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Shipped</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Order Shipped! 🚚</h1>
      <p style="color: #ede9fe; margin: 5px 0 0 0; font-size: 14px;">Nitish Furniture House</p>
    </div>

    <!-- Message -->
    <div style="padding: 30px; text-align: center;">
      <div style="width: 60px; height: 60px; background-color: #ede9fe; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg style="width: 30px; height: 30px; color: #7c3aed;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
        </svg>
      </div>
      <h2 style="color: #111827; margin: 0 0 10px; font-size: 22px;">Your Order is on its Way!</h2>
      <p style="color: #6b7280; margin: 0;">Your furniture is being shipped from our workshop. Track your order below.</p>
    </div>

    <!-- Tracking Info -->
    <div style="padding: 0 30px 30px;">
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #111827; margin: 0 0 15px; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">📦 Shipment Details</h3>
        
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order ID:</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right; font-family: monospace;">${order.orderId || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Tracking ID:</td>
            <td style="padding: 8px 0; color: #7c3aed; font-weight: 600; text-align: right; font-family: monospace;">${order.trackingId || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Estimated Delivery:</td>
            <td style="padding: 8px 0; color: #059669; font-weight: 500; text-align: right;">${formatDate(order.estimatedDelivery)}</td>
          </tr>
        </table>
      </div>

      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        Track your order at: <strong>www.nitishfurniture.com/track/${order.trackingId || ''}</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #1f2937; padding: 30px; text-align: center;">
      <p style="color: #9ca3af; margin: 0 0 10px; font-size: 14px;">Need help? Contact our support team</p>
      <p style="color: #ffffff; margin: 0 0 5px; font-size: 14px;">+91 6200694677 | support@nitishfurniture.com</p>
      <p style="color: #6b7280; margin: 15px 0 0; font-size: 12px;">
        Nitish Furniture House | Jodhpur, Rajasthan | www.nitishfurniture.com
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

// Send order cancellation email
const sendOrderCancellationEmail = async (order, customerEmail, customerName) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = generateOrderCancellationHTML(order, customerName);

    const info = await transporter.sendMail({
      from: `"Nitish Furniture House" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Order Cancelled - ${order.orderId || "Order #" + order._id}`,
      html: htmlContent,
    });

    console.log("Cancellation email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending cancellation email:", error);
    return { success: false, error: error.message };
  }
};

// Send order shipped email
const sendOrderShippedEmail = async (order, customerEmail, customerName) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = generateOrderShippedHTML(order, customerName);

    const info = await transporter.sendMail({
      from: `"Nitish Furniture House" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Your Order Has Been Shipped! - ${order.orderId || "Order #" + order._id}`,
      html: htmlContent,
    });

    console.log("Shipped email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending shipped email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOrderConfirmationEmail,
  sendOwnerNotificationEmail,
  sendOrderCancellationEmail,
  sendOrderShippedEmail,
  generateOrderBillHTML,
  generateOwnerNotificationHTML,
  generateOrderCancellationHTML,
  generateOrderShippedHTML,
  formatPrice,
  formatDate,
  verifyTransporter,
  createTransporter,
};

