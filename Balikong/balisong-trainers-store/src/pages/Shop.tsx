import React from "react";
import ProductCard from "../components/ProductCard";
import "./Shop.css";

const Shop: React.FC = () => {
  return (
    <div className="shop">
      <h2>Shop Our Products</h2>
      <div className="product-grid">
        <ProductCard image="/assets/product1.jpg" name="Balisong Trainer 1" price="$29.99" />
        <ProductCard image="/assets/product2.jpg" name="Balisong Trainer 2" price="$34.99" />
        <ProductCard image="/assets/product3.jpg" name="Balisong Trainer 3" price="$39.99" />
      </div>
    </div>
  );
};

export default Shop;