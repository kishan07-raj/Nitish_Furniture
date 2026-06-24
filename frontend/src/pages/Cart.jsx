// frontend/src/pages/Cart.jsx
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Cart() {
  const navigate = useNavigate();
  const {
    cartItems,
    itemsTotal,
    shippingCharge,
    grandTotal,
    updateQty,
    removeFromCart,
  } = useCart();

  const isEmpty = cartItems.length === 0;

  const handleDecrease = (item) => {
    const nextQty = item.qty > 1 ? item.qty - 1 : 1;
    updateQty(item._id, nextQty);
  };

  const handleIncrease = (item) => {
    updateQty(item._id, item.qty + 1);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Your Cart</h1>
      <p className="mt-2 text-sm text-slate-600">
        Review your selected furniture items before checkout.
      </p>

      {isEmpty ? (
        <EmptyCart navigate={navigate} />
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-[2fr,1.2fr]">
          <CartItems
            items={cartItems}
            onDecrease={handleDecrease}
            onIncrease={handleIncrease}
            onRemove={removeFromCart}
          />
          <CartSummary
            itemsTotal={itemsTotal}
            shippingCharge={shippingCharge}
            grandTotal={grandTotal}
            onCheckout={() => navigate("/checkout")}
          />
        </div>
      )}
    </div>
  );
}

function EmptyCart({ navigate }) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
      <p>Your cart is empty. Add some products and then come back here to place your order.</p>
      <button
        onClick={() => navigate("/")}
        className="mt-4 rounded-full bg-amber-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-50 hover:bg-black/90"
      >
        Continue shopping
      </button>
    </div>
  );
}

function CartItems({ items, onDecrease, onIncrease, onRemove }) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
      {items.map((item) => (
        <div
          key={item._id}
          className="flex items-center justify-between gap-3"
        >
          <div className="flex flex-1 items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-slate-100" />
            <div>
              <div className="font-medium text-slate-800">
                {item.name}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                <span>Qty:</span>
                <div className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-[2px]">
                  <button
                    type="button"
                    onClick={() => onDecrease(item)}
                    className="px-1 text-xs"
                  >
                    -
                  </button>
                  <span className="w-5 text-center text-xs">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => onIncrease(item)}
                    className="px-1 text-xs"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item._id)}
                  className="text-[11px] text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-700">
            ₹{item.price * item.qty}
          </div>
        </div>
      ))}
    </div>
  );
}

function CartSummary({
  itemsTotal,
  shippingCharge,
  grandTotal,
  onCheckout,
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <h2 className="text-sm font-semibold">Summary</h2>
      <div className="space-y-1 text-xs text-slate-700">
        <div className="flex justify-between">
          <span>Items total</span>
          <span>₹{itemsTotal}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>₹{shippingCharge}</span>
        </div>
        <div className="flex justify-between font-semibold text-slate-900">
          <span>Total</span>
          <span>₹{grandTotal}</span>
        </div>
      </div>

      <button
        onClick={onCheckout}
        className="mt-3 w-full rounded-full bg-amber-900 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-50 hover:bg-black/90"
      >
        Proceed to checkout
      </button>

      <Link
        to="/"
        className="block text-center text-[11px] text-slate-500 hover:underline"
      >
        Continue shopping
      </Link>
    </div>
  );
}

export default Cart;
