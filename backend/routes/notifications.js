const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");
const { NOTIFICATION_TYPES } = require("../models/Notification");

const router = express.Router();

// GET /api/notifications - Get user's notifications
router.get("/", protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, unreadOnly } = req.query;
    
    const result = await Notification.getUserNotifications(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      unreadOnly: unreadOnly === 'true'
    });

    res.json({
      success: true,
      notifications: result.notifications,
      unreadCount: result.unreadCount,
      pagination: result.pagination
    });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
});

// GET /api/notifications/unread-count - Get unread count
router.get("/unread-count", protect, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      unreadCount: count
    });
  } catch (err) {
    console.error("Get unread count error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch count" });
  }
});

// GET /api/notifications/:id - Get single notification
router.get("/:id", protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({
      success: true,
      notification
    });
  } catch (err) {
    console.error("Get notification error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch notification" });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put("/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      notification,
      message: "Notification marked as read"
    });
  } catch (err) {
    console.error("Mark as read error:", err);
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put("/read-all", protect, async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("Mark all as read error:", err);
    res.status(500).json({ success: false, message: "Failed to mark all as read" });
  }
});

// DELETE /api/notifications/:id - Delete single notification
router.delete("/:id", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification deleted"
    });
  } catch (err) {
    console.error("Delete notification error:", err);
    res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
});

// DELETE /api/notifications - Delete all read notifications
router.delete("/", protect, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      user: req.user.id,
      isRead: true
    });

    res.json({
      success: true,
      message: `${result.deletedCount} notifications deleted`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Delete notifications error:", err);
    res.status(500).json({ success: false, message: "Failed to delete notifications" });
  }
});

// POST /api/notifications/create - Create notification (internal/admin use)
router.post("/create", protect, async (req, res) => {
  try {
    const { userId, type, title, message, data, priority, actionUrl, icon, color } = req.body;

    // Only admin/owner can create notifications for other users
    if (userId && userId !== req.user.id) {
      if (!['owner', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: "Only admins can create notifications for other users" 
        });
      }
    }

    const notification = await Notification.create({
      user: userId || req.user.id,
      type: type || NOTIFICATION_TYPES.SYSTEM,
      title,
      message,
      data: data || {},
      priority: priority || 'normal',
      actionUrl,
      icon,
      color
    });

    // Emit socket event if user is online
    const { emitNotification } = require("../config/socket");
    emitNotification(userId || req.user.id, notification.toSocketPayload());

    res.status(201).json({
      success: true,
      notification,
      message: "Notification created"
    });
  } catch (err) {
    console.error("Create notification error:", err);
    res.status(500).json({ success: false, message: "Failed to create notification" });
  }
});

module.exports = router;

