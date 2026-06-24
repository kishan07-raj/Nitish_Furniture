import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import { roomSetups } from "../data/roomSetups";

function RoomSetup() {
  const { id } = useParams();
  const [setup, setSetup] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchSetup = async () => {
      const foundSetup = roomSetups.find(s => s.id === id);
      if (foundSetup) {
        setSetup(foundSetup);
        try {
          const productPromises = foundSetup.products.map(async (prod) => {
            const res = await axios.get(`/products/${prod.slug}`);
            return res.data;
          });
          const fetchedProducts = await Promise.all(productPromises);
          setProducts(fetchedProducts);
        } catch (err) {
          console.error("Failed to load products", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSetup();
  }, [id]);

  const handleAddFullLook = () => {
    products.forEach(product => {
      addToCart(product, 1);
    });
  };

  if (!setup) return <div>Loading...</div>;

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <section className="relative h-96 overflow-hidden">
        <img
          src={setup.image}
          alt={setup.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">{setup.name}</h1>
            <p className="text-xl">{setup.description}</p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="py-8 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleAddFullLook}
              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-8 py-3 text-base font-medium text-white hover:bg-amber-700 transition-colors"
            >
              Add Full Look to Cart
            </button>
            <Link
              to="/cart"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-8 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Add Selected Items Only
            </Link>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Products in This Setup</h2>
          </div>
          {loading ? (
            <p className="text-center">Loading products...</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default RoomSetup;
