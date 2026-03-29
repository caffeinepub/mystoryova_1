import { useSEO } from "../hooks/useSEO";

interface Props {
  isDark: boolean;
}

export default function ReturnPolicy({ isDark }: Props) {
  useSEO({
    title: "Return Policy — Mystoryova",
    description: "Return and refund policy for Mystoryova.",
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
        Return Policy
      </h1>

      <h2 style={h2}>Merchandise Returns</h2>
      <p style={p}>
        Physical merchandise (apparel, accessories) may be returned within{" "}
        <strong style={{ color: "#D4AF37" }}>10 days</strong> of delivery,
        provided items are unused, unwashed, and in original packaging with tags
        attached.
      </p>
      <p style={p}>
        Items damaged during shipping or with manufacturing defects are eligible
        for a full refund or replacement regardless of the 10-day window.
      </p>

      <h2 style={h2}>Digital Audiobook Refunds</h2>
      <p style={p}>
        Due to the nature of digital products, audiobooks are generally
        non-refundable once access has been granted. Exceptions are made in the
        following cases:
      </p>
      <ul style={{ ...p, paddingLeft: "1.5rem", listStyleType: "disc" }}>
        <li>
          Technical issues preventing playback that cannot be resolved by our
          support team
        </li>
        <li>Duplicate purchases made in error within 24 hours</li>
        <li>Content significantly different from the product description</li>
      </ul>

      <h2 style={h2}>Return Request Process</h2>
      <p style={p}>To initiate a return or refund request:</p>
      <ol style={{ ...p, paddingLeft: "1.5rem", listStyleType: "decimal" }}>
        <li style={{ marginBottom: "0.5rem" }}>
          Email{" "}
          <a
            href="mailto:mystoryova@gmail.com?subject=Return Request"
            style={{ color: "#D4AF37" }}
          >
            mystoryova@gmail.com
          </a>{" "}
          with the subject line &ldquo;Return Request&rdquo;
        </li>
        <li style={{ marginBottom: "0.5rem" }}>
          Include your order number and reason for return
        </li>
        <li style={{ marginBottom: "0.5rem" }}>
          Attach photos if applicable (for damaged merchandise)
        </li>
        <li style={{ marginBottom: "0.5rem" }}>
          Our team will respond within 2-3 business days
        </li>
        <li style={{ marginBottom: "0.5rem" }}>
          Approved returns will receive a prepaid return label or refund
          instructions
        </li>
      </ol>

      <h2 style={h2}>Refund Timeline</h2>
      <p style={p}>
        Approved refunds are processed within 5-7 business days. The amount will
        be returned to your original payment method via Razorpay.
      </p>

      <h2 style={h2}>Non-Returnable Items</h2>
      <p style={p}>
        The following items cannot be returned: digital audiobooks (except per
        the exceptions above), customized merchandise, items marked as final
        sale.
      </p>
    </div>
  );
}
