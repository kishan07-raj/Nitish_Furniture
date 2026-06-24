import { Link } from "react-router-dom";

function RelatedProductsSlider({ products = [] }) {
  if (!products.length) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Related Products</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {products.map((product) => {
          const imageSrc =
            product.images?.[0] ||
            product.image ||
            "https://via.placeholder.com/300x200/0f172a/ffffff?text=No+Image";

          return (
            <Link
              key={product._id || product.id}
              to={`/product/${product.slug}`}
              className="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                  {product.name}
                </h4>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  ₹{(product.price || product.basePrice || 0).toLocaleString("en-IN")}
                </p>
                {product.mrp && product.mrp > (product.price || product.basePrice || 0) && (
                  <p className="text-sm text-gray-500 line-through">
                    ₹{product.mrp.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default RelatedProductsSlider;
