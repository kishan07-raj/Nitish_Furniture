// frontend/src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";


export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const { user, isAuthenticated, isAdmin, isOwner } = useAuth();

  useEffect(() => {
    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
      
      // Join appropriate room based on user role
      if (isOwner) {
        newSocket.emit("join-owner");
      } else if (isAdmin) {
        newSocket.emit("join-admin");
      } else if (isAuthenticated && user) {
        newSocket.emit("join-user", user._id);
      }
    });

    // Listen for new order notifications (admin/owner)
    newSocket.on("new-order", (data) => {
      console.log("New order received:", data);
      setNewOrderCount((prev) => prev + 1);
      setNotifications((prev) => [
        { id: Date.now(), type: "order", ...data },
        ...prev,
      ]);
      
      // Play notification sound (optional)
      try {
        const audio = new Audio("/notification.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors
      } catch (e) {
        // Ignore audio errors
      }
    });

    // Listen for order status updates (users)
    newSocket.on("order-status-update", (data) => {
      console.log("Order status update:", data);
      setNotifications((prev) => [
        { id: Date.now(), type: "status", ...data },
        ...prev,
      ]);
    });

    // Listen for admin notifications
    newSocket.on("admin-notification", (data) => {
      console.log("Admin notification:", data);
      setNotifications((prev) => [
        { id: Date.now(), type: "admin", ...data },
        ...prev,
      ]);
    });

    // Listen for owner notifications
    newSocket.on("owner-notification", (data) => {
      console.log("Owner notification:", data);
      setNotifications((prev) => [
        { id: Date.now(), type: "owner", ...data },
        ...prev,
      ]);
    });

    // Listen for real-time notifications (for all users)
    newSocket.on("notification", (data) => {
      console.log("Notification received:", data);
      setNotifications((prev) => [
        { id: Date.now(), type: "general", ...data },
        ...prev,
      ]);
      setUnreadNotificationCount((prev) => prev + 1);
    });

    // Listen for delivery partner notifications
    newSocket.on("new-delivery-assigned", (data) => {
      console.log("New delivery assigned:", data);
      setNotifications((prev) => [
        { id: Date.now(), type: "delivery", ...data },
        ...prev,
      ]);
    });

    // Listen for delivery updates
    newSocket.on("delivery-update", (data) => {
      console.log("Delivery update:", data);
      setNotifications((prev) => [
        { id: Date.now(), type: "delivery", ...data },
        ...prev,
      ]);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, isAdmin, isOwner, user?._id]);

  // Update socket room when admin/owner status changes
  useEffect(() => {
    if (socket) {
      if (isOwner) {
        socket.emit("join-owner");
      } else if (isAdmin) {
        socket.emit("join-admin");
      } else if (isAuthenticated && user) {
        socket.emit("join-user", user._id);
      }
    }
  }, [socket, isAdmin, isOwner, isAuthenticated, user?._id]);

  const clearNotifications = () => {
    setNotifications([]);
    setNewOrderCount(0);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const setNotificationCount = (count) => {
    setUnreadNotificationCount(count);
  };

  const decrementNotificationCount = () => {
    setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        newOrderCount,
        unreadNotificationCount,
        clearNotifications,
        removeNotification,
        setNotificationCount,
        decrementNotificationCount
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return ctx;
}

export default SocketContext;
