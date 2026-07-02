import React from "react";
import "./Home.css";

const Home: React.FC = () => {
  return (
    <div className="home">
      <section className="hero">
        <h2>Welcome to Bali Kong!</h2>
        <p>Your ultimate destination for premium balisong trainers.</p>
        <a href="/shop" className="cta-button">Shop Now</a>
      </section>
    </div>
  );
};

export default Home;