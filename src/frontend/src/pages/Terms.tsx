import { useEffect } from "react";
import { Link } from "react-router-dom";

interface Props {
  isDark: boolean;
}

export default function Terms({ isDark }: Props) {
  useEffect(() => {
    document.title = "Terms of Service — Mystoryova";
  }, []);
  const h2 = {
    fontFamily: "Playfair Display, serif",
    color: isDark ? "#D4AF37" : "#8B6914",
    fontSize: "1.25rem",
    fontWeight: 700,
    marginTop: "2rem",
    marginBottom: "0.75rem",
  };
  const p = {
    color: isDark ? "#aaa" : "#555",
    lineHeight: 1.8,
    marginBottom: "1rem",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1
        className="text-4xl font-bold mb-8"
        style={{
          fontFamily: "Playfair Display, serif",
          color: isDark ? "#f0ead6" : "#1a1a1a",
        }}
      >
        Terms of Service
      </h1>
      <p style={{ ...p, color: isDark ? "#666" : "#888" }}>
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <h2 style={h2}>1. Acceptance of Terms</h2>
      <p style={p}>
        By accessing Mystoryova, you agree to these terms. If you disagree,
        please do not use this platform.
      </p>

      <h2 style={h2}>2. Store Purchases</h2>
      <p style={p}>
        All purchases made through the Mystoryova store are subject to
        availability. Prices are listed in INR and USD and may change without
        notice. Once a purchase is completed, you will receive confirmation via
        the post-payment page.
      </p>

      <h2 style={h2}>3. Digital Products</h2>
      <p style={p}>
        Audiobooks and digital products are licensed for personal,
        non-commercial use. Redistribution, resale, or sharing of digital
        content is strictly prohibited.
      </p>

      <h2 style={h2}>4. Cancellation Policy</h2>
      <p style={p}>
        Orders may be cancelled within 24 hours of purchase by contacting
        mystoryova@gmail.com. Digital products (audiobooks) cannot be cancelled
        once download access has been granted.
      </p>

      <h2 style={h2}>5. Returns</h2>
      <p style={p}>
        Physical merchandise is eligible for returns within 10 days of delivery.
        For full details, see our{" "}
        <Link to="/return-policy" style={{ color: "#D4AF37" }}>
          Return Policy
        </Link>
        .
      </p>

      <h2 style={h2}>6. Intellectual Property</h2>
      <p style={p}>
        All content on Mystoryova, including book text, cover art, and blog
        posts, is the intellectual property of O. Chiddarwar and Mystoryova.
        Unauthorized reproduction is prohibited.
      </p>

      <h2 style={h2}>7. Contact</h2>
      <p style={p}>
        For questions, contact{" "}
        <a href="mailto:mystoryova@gmail.com" style={{ color: "#D4AF37" }}>
          mystoryova@gmail.com
        </a>
      </p>
    </div>
  );
}
