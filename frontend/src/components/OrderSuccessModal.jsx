// frontend/src/components/OrderSuccessModal.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function OrderSuccessModal({ 
  isOpen, 
  onClose, 
  orderId, 
  orderDetails = {},
  estimatedDelivery 
}) {
  const [animationComplete, setAnimationComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Trigger animation after mount
      setTimeout(() => setAnimationComplete(true), 100);
    } else {
      setAnimationComplete(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleViewOrder = () => {
    onClose();
    navigate(`/orders/${orderId}`);
  };

  const handleContinueShopping = () => {
    onClose();
    navigate("/stores");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleContinueShopping}
      />

      {/* Modal Content */}
      <div className={`relative z-10 w-full max-w-lg mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-500 ${animationComplete ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
        
        {/* Success Animation Area */}
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-8 text-center">
          <div className="relative inline-block">
            {/* Animated Circle */}
            <div className={`w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center transform transition-all duration-700 ${animationComplete ? 'scale-100' : 'scale-0'}`}>
              {/* Checkmark Animation */}
              <svg 
                className={`w-12 h-12 text-green-600 transform ${animationComplete ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                style={{ transitionDelay: '300ms' }}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
            
            {/* Pulse Effect */}
            <div className={`absolute inset-0 rounded-full bg-white opacity-50 animate-ping`} style={{ animationDuration: '1.5s' }} />
          </div>
          
          <h2 className={`mt-6 text-2xl font-bold text-white transform transition-all duration-500 ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '400ms' }}>
            Order Placed Successfully!
          </h2>
          
          <p className={`mt-2 text-emerald-100 transform transition-all duration-500 ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '500ms' }}>
            Thank you for choosing Nitish Furniture House
          </p>
        </div>

        {/* Order Details */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Order ID */}
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Order ID</span>
              <span className="font-mono font-semibold text-slate-900">{orderId}</span>
            </div>

            {/* Order Summary */}
            {orderDetails.items && (
              <div className="py-3 border-b border-slate-100">
                <span className="text-slate-600 block mb-2">Items</span>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {orderDetails.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-slate-700">{item.name} x {item.qty}</span>
                      <span className="text-slate-900">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Total Amount</span>
              <span className="text-lg font-bold text-amber-700">₹{orderDetails.total}</span>
            </div>

            {/* Estimated Delivery */}
            {estimatedDelivery && (
              <div className="flex justify-between items-center py-3">
                <span className="text-slate-600">Estimated Delivery</span>
                <span className="text-green-600 font-medium">{estimatedDelivery}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleViewOrder}
              className="flex-1 bg-amber-800 text-white py-3 px-4 rounded-xl font-medium hover:bg-amber-900 transition-colors"
            >
              View Order
            </button>
            <button
              onClick={handleContinueShopping}
              className="flex-1 bg-slate-100 text-slate-700 py-3 px-4 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>

        {/* Craftsmanship Message */}
        <div className="bg-blue-50 p-4 text-center">
          <p className="text-sm text-blue-800">
            🪵 Your furniture is being crafted with care by our artisans in Jodhpur
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccessModal;
