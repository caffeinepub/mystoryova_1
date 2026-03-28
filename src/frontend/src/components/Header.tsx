import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCartCount } from "../utils/cart";
import { getWishlist } from "../utils/wishlist";

interface Props {
  isDark: boolean;
  toggleTheme: () => void;
}

export default function Header({ isDark, toggleTheme }: Props) {
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const updateWishlist = () => setWishlistCount(getWishlist().length);
    const updateCart = () => setCartCount(getCartCount());
    updateWishlist();
    updateCart();
    window.addEventListener("storage", updateWishlist);
    window.addEventListener("wishlist-update", updateWishlist);
    window.addEventListener("storage", updateCart);
    window.addEventListener("cart-update", updateCart);
    return () => {
      window.removeEventListener("storage", updateWishlist);
      window.removeEventListener("wishlist-update", updateWishlist);
      window.removeEventListener("storage", updateCart);
      window.removeEventListener("cart-update", updateCart);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim())
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
  };

  const bg = isDark ? "rgba(10,10,10,0.92)" : "rgba(248,244,240,0.92)";
  const border = isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.3)";
  const navColor = isDark ? "#ccc" : "#444";

  const NAV_LINKS = [
    ["/", "Home"],
    ["/books", "Books"],
    ["/blog", "Blog"],
    ["/about", "About"],
    ["/contact", "Contact"],
    ["/store", "Store"],
  ] as const;

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: bg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${border}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0">
            <span
              className="text-xl font-bold tracking-wider"
              style={{
                fontFamily: "Playfair Display, serif",
                background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Mystoryova
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(([href, label]) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                baseColor={navColor}
              />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="hidden sm:flex">
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search..."
                className="text-sm px-3 py-1.5 rounded-lg w-36 focus:w-48 transition-all duration-300 outline-none"
                style={{
                  background: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.06)",
                  border: "1px solid rgba(212,175,55,0.2)",
                  color: isDark ? "#f0ead6" : "#1a1a1a",
                }}
              />
            </form>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2"
              aria-label="Wishlist"
              data-ocid="header.link"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Heart"
              >
                <title>Heart</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {wishlistCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold"
                  style={{
                    background: "#D4AF37",
                    color: "#0a0a0a",
                    fontSize: "10px",
                  }}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2"
              aria-label="Cart"
              data-ocid="header.cart.link"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Cart"
              >
                <title>Cart</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z"
                />
              </svg>
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold"
                  style={{
                    background: "#D4AF37",
                    color: "#0a0a0a",
                    fontSize: "10px",
                  }}
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-200"
              style={{ border: "1px solid rgba(212,175,55,0.2)" }}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg
                  className="w-4 h-4"
                  fill="#D4AF37"
                  viewBox="0 0 20 20"
                  role="img"
                  aria-label="Light mode"
                >
                  <title>Light mode</title>
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="#555"
                  viewBox="0 0 20 20"
                  role="img"
                  aria-label="Dark mode"
                >
                  <title>Dark mode</title>
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="md:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke={isDark ? "#f0ead6" : "#1a1a1a"}
                strokeWidth="2"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Menu"
              >
                <title>Menu</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={
                    menuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div
          className="md:hidden px-4 pb-4"
          style={{ borderTop: `1px solid ${border}` }}
        >
          <nav className="flex flex-col gap-3 pt-4">
            {NAV_LINKS.map(([href, label]) => (
              <Link
                key={href}
                to={href}
                className="text-sm font-medium py-1"
                style={{ color: "#D4AF37" }}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              to="/library"
              className="text-sm font-medium py-1"
              style={{ color: "#D4AF37" }}
              onClick={() => setMenuOpen(false)}
            >
              Library
            </Link>
            <form onSubmit={handleSearch} className="flex mt-2">
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search..."
                className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
                style={{
                  background: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.06)",
                  border: "1px solid rgba(212,175,55,0.2)",
                  color: isDark ? "#f0ead6" : "#1a1a1a",
                }}
              />
            </form>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  label,
  baseColor,
}: { href: string; label: string; baseColor: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={href}
      className="text-sm font-medium transition-colors duration-200"
      style={{ color: hovered ? "#D4AF37" : baseColor }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </Link>
  );
}
