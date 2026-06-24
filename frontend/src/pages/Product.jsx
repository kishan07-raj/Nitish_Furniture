import { useParams } from "react-router-dom";
import ProductDetail from "../components/ProductDetail.jsx";

export default function Product() {
  const { slug } = useParams();
  return <ProductDetail slug={slug} />;
}

