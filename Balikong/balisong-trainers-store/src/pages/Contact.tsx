import React from "react";
import "./Contact.css";

const Contact: React.FC = () => {
  return (
    <div className="contact">
      <h2>Contact Us</h2>
      <p>Have questions? Reach out to us at <a href="mailto:support@balikong.com">support@balikong.com</a>.</p>
    </div>
  );
};

export default Contact;