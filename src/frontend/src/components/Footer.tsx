import { Link } from "react-router-dom";

interface Props {
  isDark: boolean;
}

export default function Footer({ isDark }: Props) {
  const bg = isDark ? "#0d0d0d" : "#1a1a1a";
  const border = "rgba(212,175,55,0.15)";

  return (
    <footer style={{ background: bg, borderTop: `1px solid ${border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div
              className="text-2xl font-bold mb-2"
              style={{
                fontFamily: "Playfair Display, serif",
                background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Mystoryova
            </div>
            <p className="text-sm mb-4" style={{ color: "#888" }}>
              Stories That Stay With You
            </p>
            <p className="text-sm mb-4" style={{ color: "#666" }}>
              A premium author platform by O. Chiddarwar — crafting narratives
              that transcend time.
            </p>
            <div className="flex gap-3">
              {[
                {
                  label: "Instagram",
                  url: "https://www.instagram.com/mystoryova?igsh=MW9zZjdscWtodXpwNg==",
                  path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
                },
                {
                  label: "Facebook",
                  url: "https://www.facebook.com/share/18R1ypxq4q/",
                  path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
                },
                {
                  label: "Amazon",
                  url: "https://www.amazon.com/author/o.chiddarwar",
                  path: "M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.7-3.182v.685zm3.186 7.705c-.209.189-.512.201-.745.074-1.047-.872-1.236-1.276-1.814-2.106-1.734 1.768-2.962 2.297-5.209 2.297-2.661 0-4.731-1.641-4.731-4.927 0-2.565 1.391-4.309 3.37-5.164 1.715-.754 4.11-.891 5.942-1.099v-.41c0-.753.06-1.642-.383-2.294-.385-.579-1.124-.819-1.775-.819-1.205 0-2.277.618-2.54 1.897-.054.285-.261.567-.549.582l-3.061-.33c-.259-.056-.548-.266-.474-.66.704-3.716 4.06-4.838 7.066-4.838 1.537 0 3.547.41 4.758 1.574 1.538 1.436 1.392 3.352 1.392 5.438v4.923c0 1.481.616 2.13 1.192 2.929.204.287.248.631-.009.848l-2.44 2.085z",
                },
              ].map(({ label, url, path }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                  style={{
                    border: "1px solid rgba(212,175,55,0.2)",
                    color: "#D4AF37",
                  }}
                  aria-label={label}
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label={label}
                  >
                    <title>{label}</title>
                    <path d={path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4
              className="text-sm font-semibold mb-4"
              style={{ color: "#D4AF37" }}
            >
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                ["/", "Home"],
                ["/books", "Books"],
                ["/blog", "Blog"],
                ["/about", "About"],
                ["/contact", "Contact"],
                ["/store", "Store"],
                ["/library", "My Library"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link
                    to={href}
                    className="text-sm transition-colors duration-200 hover:text-amber-400"
                    style={{ color: "#888" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="text-sm font-semibold mb-4"
              style={{ color: "#D4AF37" }}
            >
              Store & Support
            </h4>
            <ul className="space-y-2">
              {[
                ["/cart", "Cart"],
                ["/checkout", "Checkout"],
                ["/order-tracking", "Track Order"],
                ["/privacy-policy", "Privacy Policy"],
                ["/terms", "Terms of Service"],
                ["/return-policy", "Return Policy"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link
                    to={href}
                    className="text-sm transition-colors duration-200 hover:text-amber-400"
                    style={{ color: "#888" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="mailto:mystoryova@gmail.com"
                  className="text-sm transition-colors duration-200 hover:text-amber-400"
                  style={{ color: "#888" }}
                >
                  mystoryova@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-10 pt-6 text-center text-xs"
          style={{ borderTop: "1px solid rgba(212,175,55,0.1)", color: "#555" }}
        >
          © {new Date().getFullYear()} Mystoryova by O. Chiddarwar. All rights
          reserved. ·{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-400 transition-colors"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
