import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const API_BASE = "";

const NOTIFICATION_ICONS = {
  order: "🛒",
  payment: "💳",
  return: "🔄",
  refund: "💰",
  delivery: "🚚",
  system: "⚙️",
  promo: "🎁"
};

const NOTIFICATION_COLORS = {
  order: "blue",
  payment: "green",
  return: "orange",
  refund: "teal",
  delivery: "purple",
  system: "gray",
  promo: "pink"
};

export default function NotificationBell({ className = "" }) {
  const { token, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/notifications?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchNotifications();
    }
  }, [isAuthenticated, token]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleNewNotification = (notification) => {
      console.log("New notification received:", notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socket.on("notification", handleNewNotification);

    return () => {
      socket.off("notification", handleNewNotification);
    };
  }, [socket, isAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark as read
  const markAsRead = async (notificationId) => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-IN");
  };

  // Get icon
  const getIcon = (type) => NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.system;

  // Get color
  const getColor = (type) => NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.system;

  if (!isAuthenticated) return null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></span>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <span className="text-4xl mb-2 block">🔔</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => !notification.isRead && markAsRead(notification._id)}
                  className={`
                    px-4 py-3 border-b cursor-pointer transition-colors
                    ${notification.isRead 
                      ? "bg-white hover:bg-gray-50" 
                      : `bg-${getColor(notification.type)}-50 hover:bg-${getColor(notification.type)}-100`
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <span className="text-xl">{getIcon(notification.type)}</span>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${notification.isRead ? "text-gray-700" : "text-gray-900"}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    
                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <span className={`w-2 h-2 rounded-full bg-${getColor(notification.type)}-500 flex-shrink-0 mt-2`} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t">
            <a
              href="/notifications"
              className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All Notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

