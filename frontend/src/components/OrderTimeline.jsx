import { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";

// Status configuration with labels, icons and colors
const STATUS_CONFIG = {
  pending: {
    label: "Order Placed",
    icon: "📦",
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    description: "Your order has been received"
  },
  confirmed: {
    label: "Order Confirmed",
    icon: "✅",
    color: "bg-green-500",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    description: "Your order has been confirmed"
  },
  processing: {
    label: "Processing",
    icon: "⚙️",
    color: "bg-yellow-500",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    description: "Your order is being prepared"
  },
  packed: {
    label: "Packed",
    icon: "📋",
    color: "bg-orange-500",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    description: "Your order has been packed"
  },
  shipped: {
    label: "Shipped",
    icon: "🚚",
    color: "bg-purple-500",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    description: "Your order is on its way"
  },
  out_for_delivery: {
    label: "Out for Delivery",
    icon: "🏃",
    color: "bg-pink-500",
    bgColor: "bg-pink-50",
    textColor: "text-pink-700",
    description: "Your order is out for delivery"
  },
  delivered: {
    label: "Delivered",
    icon: "🎉",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    description: "Your order has been delivered"
  },
  cancelled: {
    label: "Cancelled",
    icon: "❌",
    color: "bg-red-500",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    description: "Order has been cancelled"
  },
  returned: {
    label: "Returned",
    icon: "🔄",
    color: "bg-gray-500",
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    description: "Order has been returned"
  },
  refunded: {
    label: "Refunded",
    icon: "💰",
    color: "bg-teal-500",
    bgColor: "bg-teal-50",
    textColor: "text-teal-700",
    description: "Refund has been processed"
  }
};

// Order of statuses for progress display
const STATUS_ORDER = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered"
];

export default function OrderTimeline({ 
  order, 
  showDetails = true, 
  compact = false,
  className = "" 
}) {
  const { socket } = useSocket();
  const [currentStatus, setCurrentStatus] = useState(order?.status || "pending");
  const [timeline, setTimeline] = useState(order?.orderTimeline || []);
  const [deliveryStages, setDeliveryStages] = useState(order?.deliveryStages || {});

  // Update when order prop changes
  useEffect(() => {
    if (order) {
      setCurrentStatus(order.status);
      setTimeline(order.orderTimeline || []);
      setDeliveryStages(order.deliveryStages || {});
    }
  }, [order]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket || !order?._id) return;

    const handleStatusUpdate = (data) => {
      if (data.orderId === order._id) {
        setCurrentStatus(data.status);
        if (data.timeline) {
          setTimeline(prev => [...prev, data.timeline]);
        }
        if (data.deliveryStages) {
          setDeliveryStages(data.deliveryStages);
        }
      }
    };

    socket.on("order-status-update", handleStatusUpdate);

    return () => {
      socket.off("order-status-update", handleStatusUpdate);
    };
  }, [socket, order?._id]);

  // Get current status index in the progression
  const getStatusIndex = (status) => STATUS_ORDER.indexOf(status);

  // Check if status is completed
  const isStatusCompleted = (status) => {
    const currentIndex = getStatusIndex(currentStatus);
    const statusIndex = getStatusIndex(status);
    return statusIndex <= currentIndex;
  };

  // Check if status is current
  const isStatusCurrent = (status) => status === currentStatus;

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Get timeline entry for a status
  const getTimelineEntry = (status) => {
    return timeline.find(t => t.status === status);
  };

  // Handle cancelled/returned states
  if (currentStatus === "cancelled" || currentStatus === "returned" || currentStatus === "refunded") {
    const config = STATUS_CONFIG[currentStatus];
    return (
      <div className={`${className}`}>
        <div className={`${config.bgColor} border-2 border-dashed ${config.textColor} rounded-lg p-6 text-center`}>
          <div className="text-4xl mb-2">{config.icon}</div>
          <h3 className="text-xl font-bold">{config.label}</h3>
          <p className="text-sm mt-1 opacity-80">{config.description}</p>
          {timeline.length > 0 && (
            <div className="mt-4 text-sm opacity-75">
              Last updated: {formatTime(timeline[timeline.length - 1]?.timestamp)}
            </div>
          )}
        </div>
        
        {/* Show timeline details if enabled */}
        {showDetails && timeline.length > 0 && (
          <div className="mt-4 space-y-3">
            <h4 className="font-semibold text-gray-700">Order History</h4>
            {timeline.slice().reverse().map((entry, index) => {
              const entryConfig = STATUS_CONFIG[entry.status] || {};
              return (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <div className="text-lg">{entryConfig.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium">{entry.statusLabel || entry.status}</p>
                    {entry.notes && <p className="text-gray-500 text-xs">{entry.notes}</p>}
                    <p className="text-gray-400 text-xs">{formatTime(entry.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (compact) {
    // Compact view - just progress bar
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between">
          {STATUS_ORDER.slice(0, -1).map((status, index) => {
            const config = STATUS_CONFIG[status];
            const completed = isStatusCompleted(status);
            const current = isStatusCurrent(status);
            
            return (
              <div key={status} className="flex items-center flex-1">
                <div 
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm
                    ${completed ? config.color : "bg-gray-200"}
                    ${current ? "ring-4 ring-offset-2 ring-blue-300" : ""}
                    text-white font-bold
                  `}
                >
                  {completed ? config.icon : index + 1}
                </div>
                {index < STATUS_ORDER.length - 2 && (
                  <div className={`flex-1 h-1 mx-1 ${completed ? config.color : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Status label */}
        <div className="text-center mt-2">
          <span className={`font-medium ${STATUS_CONFIG[currentStatus]?.textColor}`}>
            {STATUS_CONFIG[currentStatus]?.label}
          </span>
        </div>
      </div>
    );
  }

  // Full timeline view
  return (
    <div className={`${className}`}>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STATUS_ORDER.map((status, index) => {
            const config = STATUS_CONFIG[status];
            const completed = isStatusCompleted(status);
            const current = isStatusCurrent(status);
            const entry = getTimelineEntry(status);
            
            return (
              <div key={status} className="flex flex-col items-center flex-1 relative">
                {/* Connector line */}
                {index > 0 && (
                  <div 
                    className={`
                      absolute top-4 -left-1/2 w-full h-1 -z-10
                      ${isStatusCompleted(STATUS_ORDER[index - 1]) ? config.color : "bg-gray-200"}
                    `}
                  />
                )}
                
                {/* Status circle */}
                <div 
                  className={`
                    w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg md:text-xl
                    transition-all duration-300
                    ${completed ? config.color : "bg-gray-200"}
                    ${current ? "ring-4 ring-offset-2 ring-blue-300 scale-110" : ""}
                    text-white font-bold shadow-lg
                  `}
                  title={config.label}
                >
                  {completed ? config.icon : index + 1}
                </div>
                
                {/* Status label */}
                <p className={`
                  mt-2 text-xs md:text-sm font-medium text-center
                  ${current ? config.textColor : "text-gray-500"}
                `}>
                  {config.label}
                </p>
                
                {/* Timestamp */}
                {entry?.timestamp && (
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTime(entry.timestamp)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current status card */}
      <div className={`
        ${STATUS_CONFIG[currentStatus]?.bgColor} 
        border-l-4 ${STATUS_CONFIG[currentStatus]?.color.replace("bg-", "border-")}
        rounded-r-lg p-4 mb-6
      `}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{STATUS_CONFIG[currentStatus]?.icon}</span>
          <div>
            <h3 className={`font-bold ${STATUS_CONFIG[currentStatus]?.textColor}`}>
              {STATUS_CONFIG[currentStatus]?.label}
            </h3>
            <p className="text-sm text-gray-600">
              {STATUS_CONFIG[currentStatus]?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline details */}
      {showDetails && timeline.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-700 mb-4">Order Timeline</h4>
          <div className="space-y-4">
            {timeline.slice().reverse().map((entry, index) => {
              const config = STATUS_CONFIG[entry.status] || {};
              return (
                <div key={index} className="flex items-start gap-4">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${config.color} text-white text-sm
                  `}>
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800">
                        {entry.statusLabel || entry.status}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>
                    )}
                    {entry.updatedByName && (
                      <p className="text-xs text-gray-400 mt-1">
                        Updated by: {entry.updatedByName} ({entry.updatedByRole})
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delivery stages timestamps */}
      {showDetails && Object.keys(deliveryStages).length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(deliveryStages).map(([stage, timestamp]) => {
            if (!timestamp) return null;
            const stageConfig = STATUS_CONFIG[stage] || {};
            return (
              <div 
                key={stage}
                className={`
                  flex items-center gap-2 p-2 rounded
                  ${stageConfig.bgColor}
                `}
              >
                <span>{stageConfig.icon}</span>
                <div>
                  <p className="text-xs font-medium">{stageConfig.label}</p>
                  <p className="text-xs text-gray-500">{formatTime(timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper component for delivery partner status updates
export function DeliveryStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {};
  
  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
      ${config.bgColor} ${config.textColor}
    `}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

