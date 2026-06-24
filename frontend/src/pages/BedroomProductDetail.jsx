import { useParams } from "react-router-dom";
import { bedroomProducts } from "../data/bedroomProducts";
import { useCart } from "../context/CartContext";
import ParallaxSection from "../components/ParallaxSection";
import ScrollReveal from "../components/ScrollReveal";

function BedroomProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const product = bedroomProducts.find(p => p.id === id);

  if (!product) return <p>Product not found</p>;

  return (
    <div className="relative min-h-screen">
      {/* Full-screen background image with parallax */}
      <ParallaxSection speed={0.3} className="absolute inset-0 z-0">
        <div
          className="w-full h-screen bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${product.image.replace('w=600&h=400', 'w=3840&h=2160')})`,
          }}
        />
      </ParallaxSection>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>

      {/* Product content with scroll reveal */}
      <ScrollReveal className="relative z-20 mx-auto max-w-4xl px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white bg-opacity-90 rounded-lg p-8 shadow-lg">
          <img src={product.image} alt={product.name} className="w-full rounded-lg" />
          <div>
            <h1 className="text-3xl font-semibold mb-4">{product.name}</h1>
            <p className="text-lg text-slate-600 mb-4">{product.description}</p>
            <p className="text-2xl font-bold text-emerald-700 mb-6">₹{product.price.toLocaleString("en-IN")}</p>
            <button
              onClick={() => addToCart(product)}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}

export default BedroomProductDetail;
