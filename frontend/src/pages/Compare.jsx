import { useState } from "react";
import { Link } from "react-router-dom";
import { useCompare } from "../context/CompareContext";
import { useCart } from "../context/CartContext";

function Compare() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState("overview");

  if (compareItems.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">⚖️</div>
          <h1 className="text-3xl font-semibold tracking-tight mb-4">Compare Products</h1>
          <p className="text-slate-600 mb-6">Add products to compare their features side by side.</p>
          <Link to="/stores" className="bg-amber-800 text-white px-6 py-3 rounded hover:bg-amber-900">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "specifications", label: "Specifications" },
    { id: "reviews", label: "Reviews" }
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Compare Products</h1>
            <p className="mt-2 text-slate-600">
              Comparing {compareItems.length} product{compareItems.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={clearCompare}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-amber-800 text-amber-800"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-4 px-4 font-semibold text-slate-800 w-48">Product</th>
              {compareItems.map((product) => (
                <th key={product._id} className="text-center py-4 px-4 min-w-64">
                  <div className="space-y-3">
                    <img
                      src={product.images?.[0] || "/assets/no-image.png"}
                      alt={product.name}
                      className="w-32 h-32 object-cover rounded mx-auto"
                      onError={(e) => {
                        e.target.src = "/assets/no-image.png";
                      }}
                    />
                    <h3 className="font-medium text-slate-900 text-sm">{product.name}</h3>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg font-semibold text-slate-900">
                        ₹{product.basePrice?.toLocaleString()}
                      </span>
                      {product.discount > 0 && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          {product.discount}% OFF
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/product/${product.slug}`}
                        className="bg-slate-800 text-white text-xs px-3 py-1 rounded hover:bg-slate-900"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => addToCart(product)}
                        className="bg-amber-800 text-white text-xs px-3 py-1 rounded hover:bg-amber-900"
                      >
                        Add to Cart
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCompare(product._id)}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeTab === "overview" && (
              <>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-700">Category</td>
                  {compareItems.map((product) => (
                    <td key={product._id} className="py-3 px-4 text-center text-slate-600 capitalize">
                      {product.category}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-700">Style</td>
                  {compareItems.map((product) => (
                    <td key={product._id} className="py-3 px-4 text-center text-slate-600">
                      {product.style}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-700">Wood Type</td>
                  {compareItems.map((product) => (
                    <td key={product._id} className="py-3 px-4 text-center text-slate-600">
                      {product.defaultWood}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-700">Size</td>
                  {compareItems.map((product) => (
                    <td key={product._id} className="py-3 px-4 text-center text-slate-600">
                      {product.defaultSize}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-700">In Stock</td>
                  {compareItems.map((product) => (
                    <td key={product._id} className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        product.inStock
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {product.inStock ? "Available" : "Out of Stock"}
                      </span>
                    </td>
                  ))}
                </tr>
              </>
            )}

            {activeTab === "specifications" && (
              <>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-700">Weight</td>
                  {compareItems.map((product) => (
                    <td key={product._id} className="py-3 px-4 text-center text-slate-600">
                      {product.weight ? `${product.weight} kg` : "N/A"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-700">Dimensions (L×W×H)</td>
                  {compareItems.map((product) => (
                    <td key={product._id} className="py-3 px-4 text-center text-slate-600">
                      {product.dimensions
                        ? `${product.dimensions.length || 0}×${product.dimensions.width || 0}×${product.dimensions.height || 0} cm`
                        : "N/A"
                      }
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-700">Wood Types</td>
                  {compareItems.map((product) => (
                    <td key={product._id} className="py-3 px-4 text-center text-slate-600">
                      <div className="flex flex-wrap justify-center gap-1">
                        {product.customization?.woodTypes?.slice(0, 3).map((wood, index) => (
                          <span key={index} className="bg-slate-100 px-2 py-1 rounded text-xs">
                            {wood}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-700">Finishes</td>
                  {compareItems.map((product) => (
                    <td key={product._id} className="py-3 px-4 text-center text-slate-600">
                      <div className="flex flex-wrap justify-center gap-1">
                        {product.customization?.finishes?.slice(0, 3).map((finish, index) => (
                          <span key={index} className="bg-slate-100 px-2 py-1 rounded text-xs">
                            {finish}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              </>
            )}

            {activeTab === "reviews" && (
              <>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-700">Average Rating</td>
                  {compareItems.map((product) => (
                    <td key={product._id} className="py-3 px-4 text-center text-slate-600">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span>{product.averageRating?.toFixed(1) || "N/A"}</span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-700">Total Reviews</td>
                  {compareItems.map((product) => (
                    <td key={product._id} className="py-3 px-4 text-center text-slate-600">
                      {product.reviewCount || 0}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-700">Featured</td>
                  {compareItems.map((product) => (
                    <td key={product._id} className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        product.featured
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {product.featured ? "Featured" : "Regular"}
                      </span>
                    </td>
                  ))}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Compare;
