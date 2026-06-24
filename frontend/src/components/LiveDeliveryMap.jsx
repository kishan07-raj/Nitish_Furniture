import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * Live Delivery Map Tracking
 * Shows real-time delivery status with map visualization
 * Order stages: Placed → Processing → Packed → Shipped → Out for Delivery → Delivered
 */

// Delivery stages with icons and descriptions
const DELIVERY_STAGES = [
  {
    id: "placed",
    label: "Order Placed",
    icon: "📝",
    description: "Your order has been confirmed",
    color: "bg-blue-500"
  },
  {
    id: "processing",
    label: "Processing",
    icon: "⚙️",
    description: "Preparing your items",
    color: "bg-amber-500"
  },
  {
    id: "packed",
    label: "Packed",
    icon: "📦",
    description: "Ready for shipment",
    color: "bg-orange-500"
  },
  {
    id: "shipped",
    label: "Shipped",
    icon: "🚚",
    description: "On the way",
    color: "bg-purple-500"
  },
  {
    id: "out_for_delivery",
    label: "Out for Delivery",
    icon: "🏃",
    description: "Near your location",
    color: "bg-pink-500"
  },
  {
    id: "delivered",
    label: "Delivered",
    icon: "✅",
    description: "Successfully delivered",
    color: "bg-green-500"
  }
];

// Mock delivery partner data (in production, this would come from real-time API)
const MOCK_PARTNER = {
  name: "Raj Kumar",
  phone: "+91 98765 43210",
  vehicle: "Two Wheeler",
  photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
};

export default function LiveDeliveryMap({ orderId, orderData }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [liveLocation, setLiveLocation] = useState({ lat: 28.6139, lng: 77.2090 });
  const [showCallOption, setShowCallOption] = useState(false);
  
  // Simulate real-time updates
  useEffect(() => {
    if (!orderData?.status) return;
    
    // Map order status to stage index
    const statusMap = {
      'pending': 0,
      'processing': 1,
      'packed': 2,
      'shipped': 3,
      'out_for_delivery': 4,
      'delivered': 5,
      'confirmed': 0,
      'preparing': 1,
      'ready': 2,
      'in_transit': 3,
      'delivered': 5
    };
    
    const stageIndex = statusMap[orderData.status.toLowerCase()] ?? 0;
    setCurrentStage(stageIndex);
    
    // Calculate estimated time based on stage
    const timeLeft = (5 - stageIndex) * 30; // minutes
    setEstimatedTime(timeLeft);
    
    // Simulate live location updates when out for delivery
    if (stageIndex === 4) {
      const interval = setInterval(() => {
        setLiveLocation(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.001,
          lng: prev.lng + (Math.random() - 0.5) * 0.001
        }));
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [orderData?.status]);
  
  const formatTime = (minutes) => {
    if (minutes <= 0) return "Arriving soon";
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  const getStageStatus = (index) => {
    if (index < currentStage) return "completed";
    if (index === currentStage) return "current";
    return "pending";
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Live Delivery Tracking</h3>
            <p className="text-sm text-neutral-800">Order #{orderId?.slice(-8) || "NFH000000"}</p>
          </div>
          {currentStage < 5 && (
            <div className="text-right">
              <p className="text-xs text-neutral-700">ETA</p>
              <p className="text-lg font-bold text-neutral-900">
                {estimatedTime ? formatTime(estimatedTime) : "--"}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Map Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-neutral-800 dark:to-neutral-700">
        {/* Simulated map view */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-white dark:bg-neutral-700 rounded-full shadow-lg flex items-center justify-center">
              <span className="text-2xl">🗺️</span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {currentStage >= 3 ? "Live tracking active" : "Map will update when shipped"}
            </p>
          </div>
        </div>
        
        {/* Simulated route line */}
        {currentStage >= 3 && (
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#D4AF37" />
              </marker>
            </defs>
            <path
              d="M 50 100 Q 150 50 250 100 T 350 80"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="3"
              strokeDasharray="10,5"
              markerEnd="url(#arrowhead)"
            />
          </svg>
        )}
        
        {/* Delivery partner indicator */}
        {currentStage === 4 && (
          <motion.div
            animate={{ x: [0, 10, -5, 0], y: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-12 h-12 bg-[#D4AF37] rounded-full shadow-lg flex items-center justify-center">
              <span className="text-xl">🏍️</span>
            </div>
          </motion.div>
        )}
        
        {/* Destination marker */}
        <div className="absolute bottom-8 right-8">
          <div className="w-10 h-10 bg-green-500 rounded-full shadow-lg flex items-center justify-center">
            <span className="text-lg">🏠</span>
          </div>
        </div>
      </div>
      
      {/* Delivery Partner Info (when out for delivery) */}
      {currentStage === 4 && (
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={MOCK_PARTNER.photo}
                alt={MOCK_PARTNER.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{MOCK_PARTNER.name}</p>
                <p className="text-sm text-neutral-500">{MOCK_PARTNER.vehicle}</p>
              </div>
            </div>
            <button
              onClick={() => setShowCallOption(!showCallOption)}
              className="p-3 bg-green-500 rounded-full text-white hover:bg-green-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02a11.36 11.36 0 0 1-.57-3.52c0-1.5-.43-2.79-1.17-3.79C5.24 1.83 3.96 1.5 2.5 1.5S.17 2.58.17 4.07c0 4.52 3.62 9.46 9.53 14.69 1.47 1.29 3.1 2.85 4.27 4.37 1.19 1.53 2.53 3.22 3.59 4.16.56.5 1.37.5 1.93 0 .9-.77 2.08-1.87 2.26-2.96.09-.56-.1-1.12-.53-1.5l-.01-.01z"/>
              </svg>
            </button>
          </div>
          {showCallOption && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
            >
              <p className="text-sm text-green-700 dark:text-green-400">
                Calling {MOCK_PARTNER.phone}...
              </p>
            </motion.div>
          )}
        </div>
      )}
      
      {/* Delivery Timeline */}
      <div className="p-4">
        <h4 className="font-semibold text-neutral-900 dark:text-white mb-4">Delivery Progress</h4>
        
        <div className="space-y-4">
          {DELIVERY_STAGES.map((stage, index) => {
            const status = getStageStatus(index);
            
            return (
              <div key={stage.id} className="flex items-start gap-4">
                {/* Stage Icon */}
                <div className="relative flex flex-col items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: status === "current" ? 1.2 : 1,
                      backgroundColor: status === "completed" ? "#22c55e" : 
                                      status === "current" ? "#D4AF37" : "#e5e7eb"
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 ${
                      status === "pending" ? "bg-neutral-200 dark:bg-neutral-700" : ""
                    }`}
                  >
                    {status === "completed" ? "✓" : stage.icon}
                  </motion.div>
                  
                  {/* Connecting Line */}
                  {index < DELIVERY_STAGES.length - 1 && (
                    <div 
                      className={`absolute top-10 w-0.5 h-8 ${
                        status === "completed" ? "bg-green-500" : "bg-neutral-200 dark:bg-neutral-700"
                      }`}
                    />
                  )}
                </div>
                
                {/* Stage Info */}
                <div className="flex-1 pb-6">
                  <p className={`font-medium ${
                    status === "completed" ? "text-green-600" :
                    status === "current" ? "text-[#D4AF37]" :
                    "text-neutral-400"
                  }`}>
                    {stage.label}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {stage.description}
                  </p>
                  {status === "current" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-1"
                    >
                      <span className="inline-flex items-center gap-1 text-xs text-[#D4AF37]">
                        <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
                        In Progress
                      </span>
                    </motion.div>
                  )}
                </div>
                
                {/* Time */}
                {status === "completed" && (
                  <span className="text-xs text-green-600">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Help Section */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">Need help?</p>
            <p className="text-xs text-neutral-500">Contact our support team</p>
          </div>
          <Link
            to="/help-center"
            className="px-4 py-2 bg-[#D4AF37] text-neutral-900 text-sm font-medium rounded-lg hover:bg-[#E5C158] transition-colors"
          >
            Get Help
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Mini Delivery Tracker for Order Details Page
 */
export function MiniDeliveryTracker({ status, orderId }) {
  const [currentStage, setCurrentStage] = useState(0);
  
  useEffect(() => {
    const statusMap = {
      'pending': 0, 'confirmed': 0,
      'processing': 1, 'preparing': 1,
      'packed': 2, 'ready': 2,
      'shipped': 3, 'in_transit': 3,
      'out_for_delivery': 4,
      'delivered': 5
    };
    setCurrentStage(statusMap[status?.toLowerCase()] ?? 0);
  }, [status]);
  
  const activeStages = Math.min(currentStage + 1, 6);
  const progress = (activeStages / 6) * 100;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-neutral-900 dark:text-white">Delivery Status</h4>
        <span className="text-xs text-neutral-500">Order #{orderId?.slice(-8)}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full mb-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158]"
        />
      </div>
      
      {/* Current Status */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          {DELIVERY_STAGES[currentStage]?.label || "Processing"}
        </span>
        <span className="text-xs text-[#D4AF37] font-medium">
          {currentStage === 5 ? "Delivered" : `${activeStages}/6 stages`}
        </span>
      </div>
    </div>
  );
}

