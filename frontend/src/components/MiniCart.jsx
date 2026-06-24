// frontend/src/components/MiniCart.jsx
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function MiniCart({ isOpen, onClose }) {
  const { cartItems, itemsTotal, shippingCharge, grandTotal } = useCart();

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Your Cart</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">{cartItems.length} item(s) in cart</p>
      </div>

      {/* Cart Items */}
      <div className="max-h-64 overflow-y-auto">
        {cartItems.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-2">🛒</div>
            <p className="text-sm text-slate-500">Your cart is empty</p>
            <Link 
              to="/stores" 
              onClick={onClose}
              className="inline-block mt-3 text-xs text-amber-700 hover:text-amber-800 font-medium"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {cartItems.slice(0, 3).map((item) => (
              <div key={item._id} className="px-4 py-3 flex gap-3">
                <div className="w-14 h-14 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🪑
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Qty: {item.qty} × ₹{item.price}
                  </p>
                </div>
                <div className="text-sm font-medium text-slate-700">
                  ₹{item.price * item.qty}
                </div>
              </div>
            ))}
            
            {cartItems.length > 3 && (
              <div className="px-4 py-2 text-center text-xs text-slate-500">
                +{cartItems.length - 3} more items
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {cartItems.length > 0 && (
        <div className="border-t border-slate-100 p-4 bg-slate-50">
          <div className="space-y-1 text-sm mb-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="text-slate-800">₹{itemsTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Shipping</span>
              <span className="text-slate-800">₹{shippingCharge}</span>
            </div>
            <div className="flex justify-between font-semibold pt-1 border-t border-slate-200">
              <span className="text-slate-900">Total</span>
              <span className="text-amber-700">₹{grandTotal}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Link
              to="/cart"
              onClick={onClose}
              className="block w-full text-center py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              View Cart
            </Link>
            <Link
              to="/checkout"
              onClick={onClose}
              className="block w-full text-center py-2 text-sm font-medium text-white bg-amber-800 rounded-lg hover:bg-amber-900 transition-colors"
            >
              Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default MiniCart;
