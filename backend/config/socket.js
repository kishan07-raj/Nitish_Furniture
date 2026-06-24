// backend/config/socket.js
const { Server } = require("socket.io");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join admin room for admin notifications
    socket.on("join-admin", () => {
      socket.join("admin");
      console.log("Client joined admin room");
    });

    // Join owner room
    socket.on("join-owner", () => {
      socket.join("owner");
      console.log("Client joined owner room");
    });

    // Join user room for order updates
    socket.on("join-user", (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join delivery partner room
    socket.on("join-delivery-partner", (partnerId) => {
      socket.join(`delivery-partner-${partnerId}`);
      console.log(`Delivery partner ${partnerId} joined their room`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

// Emit new order event to admin
function emitNewOrder(order) {
  if (io) {
    io.to("admin").emit("new-order", {
      order,
      message: `New order received from ${order.shippingAddress?.fullName || 'Customer'}`,
      timestamp: new Date().toISOString()
    });
  }
}

// Emit order status update to user
function emitOrderStatusUpdate(userId, orderUpdate) {
  if (io) {
    io.to(`user-${userId}`).emit("order-status-update", orderUpdate);
  }
}

// Emit notification to user
function emitNotification(userId, notification) {
  if (io) {
    io.to(`user-${userId}`).emit("notification", notification);
  }
}

// Emit notification to admin
function emitAdminNotification(notification) {
  if (io) {
    io.to("admin").emit("admin-notification", notification);
  }
}

// Emit notification to owner
function emitOwnerNotification(notification) {
  if (io) {
    io.to("owner").emit("owner-notification", notification);
  }
}

// Emit order to delivery partner
function emitDeliveryPartnerOrder(partnerId, order) {
  if (io) {
    io.to(`delivery-partner-${partnerId}`).emit("new-delivery-assigned", {
      order,
      message: `New delivery assigned to you`,
      timestamp: new Date().toISOString()
    });
  }
}

// Emit order update to delivery partner
function emitDeliveryPartnerUpdate(partnerId, update) {
  if (io) {
    io.to(`delivery-partner-${partnerId}`).emit("delivery-update", update);
  }
}

// Broadcast to all connected clients (for system-wide announcements)
function broadcastToAll(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

module.exports = {
  initSocket,
  emitNewOrder,
  emitOrderStatusUpdate,
  emitNotification,
  emitAdminNotification,
  emitOwnerNotification,
  emitDeliveryPartnerOrder,
  emitDeliveryPartnerUpdate,
  broadcastToAll
};
