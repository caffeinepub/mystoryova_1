import { useSEO } from "../hooks/useSEO";

interface Props {
  isDark: boolean;
}

export default function PrivacyPolicy({ isDark }: Props) {
  useSEO({
    title: "Privacy Policy — Mystoryova",
    description: "Privacy Policy for Mystoryova.",
  });

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
        Privacy Policy
      </h1>
      <p style={{ ...p, color: isDark ? "#666" : "#888" }}>
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <h2 style={h2}>1. Information We Collect</h2>
      <p style={p}>
        We collect information you provide directly, including your name, email
        address, shipping address, and phone number when you make purchases or
        subscribe to our newsletter.
      </p>

      <h2 style={h2}>2. How We Use Your Information</h2>
      <p style={p}>
        We use your information to process orders, deliver products, send
        newsletters (with your consent), and improve our services.
      </p>

      <h2 style={h2}>3. Store Purchases</h2>
      <p style={p}>
        When you make a purchase through our store, your order details are
        stored securely. We retain purchase records for order fulfillment and
        customer service purposes.
      </p>

      <h2 style={h2}>4. Razorpay Payment Processing</h2>
      <p style={p}>
        Payments are processed by Razorpay, a third-party payment gateway. When
        you make a payment, your payment information is transmitted directly to
        Razorpay and is governed by their privacy policy. We do not store your
        payment card details on our servers.
      </p>
      <p style={p}>
        Razorpay may collect: card details, UPI IDs, bank account information,
        device information, and transaction data. Please review Razorpay&apos;s
        privacy policy at razorpay.com/privacy for details.
      </p>

      <h2 style={h2}>5. Cookies</h2>
      <p style={p}>
        We use local storage to save your theme preferences and wishlist. No
        third-party tracking cookies are used.
      </p>

      <h2 style={h2}>6. Data Sharing</h2>
      <p style={p}>
        We do not sell or share your personal information with third parties
        except as required to fulfill orders (e.g., shipping partners) or as
        required by law.
      </p>

      <h2 style={h2}>7. Contact</h2>
      <p style={p}>
        For privacy inquiries, contact us at{" "}
        <a href="mailto:mystoryova@gmail.com" style={{ color: "#D4AF37" }}>
          mystoryova@gmail.com
        </a>
      </p>
    </div>
  );
}
