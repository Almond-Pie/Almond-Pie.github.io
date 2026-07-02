import React from "react";
import "./ProductCard.css";

interface ProductCardProps {
  image: string;
  name: string;
  price: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ image, name, price }) => {
  return (
    <div className="product-card">
      <img src={image} alt={name} />
      <h3>{name}</h3>
      <p>{price}</p>
      <button className="add-to-cart">Add to Cart</button>
    </div>
  );
};

export default ProductCard;