import { useState } from "react";
import { Link } from "react-router-dom";
import type { Book } from "../backend.d";
import { isInWishlist, toggleWishlist } from "../utils/wishlist";

interface Props {
  book: Book;
  isDark: boolean;
}

const GENRE_COLORS: Record<string, string> = {
  "Literary Fiction": "#8B7355",
  Fantasy: "#6B5B95",
  Romance: "#C9A0A0",
  Thriller: "#5B6E7C",
  Poetry: "#7A8F6F",
  Adventure: "#8B6914",
};

const COVER_BG: Record<string, string> = {
  "Literary Fiction": "linear-gradient(135deg, #2c1f0e 0%, #4a3520 100%)",
  Fantasy: "linear-gradient(135deg, #1a0e2e 0%, #2d1a4a 100%)",
  Romance: "linear-gradient(135deg, #2e0e1a 0%, #4a1a2d 100%)",
  Thriller: "linear-gradient(135deg, #0e1a2e 0%, #1a2d4a 100%)",
  Poetry: "linear-gradient(135deg, #0e2e1a 0%, #1a4a2d 100%)",
  Adventure: "linear-gradient(135deg, #2e1a0e 0%, #4a2d1a 100%)",
};

export default function BookCard({ book, isDark }: Props) {
  const [wishlisted, setWishlisted] = useState(isInWishlist(book.id));
  const [hovered, setHovered] = useState(false);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleWishlist(book.id);
    setWishlisted(next);
    window.dispatchEvent(new Event("wishlist-update"));
  };

  const coverBg =
    COVER_BG[book.genre] || "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)";
  const genreColor = GENRE_COLORS[book.genre] || "#888";

  return (
    <Link
      to={`/books/${book.id}`}
      className="group block rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)",
        border: hovered
          ? "1px solid rgba(212,175,55,0.5)"
          : "1px solid rgba(212,175,55,0.12)",
        boxShadow: hovered
          ? "0 8px 32px rgba(212,175,55,0.15)"
          : isDark
            ? "0 4px 24px rgba(0,0,0,0.4)"
            : "0 4px 24px rgba(0,0,0,0.1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover */}
      <div
        className="relative h-48 overflow-hidden"
        style={{ background: coverBg }}
      >
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center px-4">
              <div
                className="text-3xl mb-1"
                style={{ color: "rgba(212,175,55,0.6)" }}
              >
                📖
              </div>
              <div
                className="text-xs font-medium"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {book.title}
              </div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleWishlist}
          className="absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200"
          style={{
            background: "rgba(0,0,0,0.5)",
            border: `1px solid ${wishlisted ? "#D4AF37" : "rgba(212,175,55,0.3)"}`,
          }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg
            className="w-3.5 h-3.5"
            fill={wishlisted ? "#D4AF37" : "none"}
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
        </button>
        {book.featured && (
          <div
            className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(212,175,55,0.9)", color: "#0a0a0a" }}
          >
            Featured
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="text-xs mb-1 font-medium" style={{ color: genreColor }}>
          {book.genre}
        </div>
        <h3
          className="font-semibold text-sm leading-tight mb-2 group-hover:text-amber-400 transition-colors"
          style={{
            fontFamily: "Playfair Display, serif",
            color: isDark ? "#f0ead6" : "#1a1a1a",
          }}
        >
          {book.title}
        </h3>
        <p
          className="text-xs line-clamp-2"
          style={{ color: isDark ? "#888" : "#666" }}
        >
          {book.description}
        </p>
      </div>
    </Link>
  );
}
