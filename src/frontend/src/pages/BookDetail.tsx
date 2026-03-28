import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Book, Review } from "../backend.d";
import BookCard from "../components/BookCard";
import StarRating from "../components/StarRating";
import { SEED_BOOKS } from "../data/seedBooks";
import { useActor } from "../hooks/useActor";
import { isInWishlist, toggleWishlist } from "../utils/wishlist";

interface Props {
  isDark: boolean;
}

export default function BookDetail({ isDark }: Props) {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: "",
    email: "",
    rating: 5,
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { actor } = useActor();

  useEffect(() => {
    if (!id || !actor) return;
    actor
      .getBook(id)
      .then((b) => {
        setBook(b);
        setWishlisted(isInWishlist(b.id));
        document.title = `${b.title} \u2014 Mystoryova`;
        actor
          .getBooks()
          .then((all) => {
            const allBooks = all.length > 0 ? all : SEED_BOOKS;
            setRelatedBooks(
              allBooks
                .filter((bk) => bk.id !== id && bk.genre === b.genre)
                .slice(0, 3),
            );
          })
          .catch(() => setRelatedBooks([]));
      })
      .catch(() => {
        const seed = SEED_BOOKS.find((b) => b.id === id);
        if (seed) {
          setBook(seed);
          setWishlisted(isInWishlist(seed.id));
          document.title = `${seed.title} \u2014 Mystoryova`;
          setRelatedBooks(
            SEED_BOOKS.filter(
              (b) => b.id !== id && b.genre === seed.genre,
            ).slice(0, 3),
          );
        }
      });
    actor
      .getReviews(id)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [id, actor]);

  const handleWishlist = () => {
    if (!book) return;
    const next = toggleWishlist(book.id);
    setWishlisted(next);
    window.dispatchEvent(new Event("wishlist-update"));
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !id) return;
    setSubmitting(true);
    try {
      await actor.addReview({
        bookId: id,
        reviewerName: reviewForm.name,
        email: reviewForm.email,
        rating: BigInt(reviewForm.rating),
        comment: reviewForm.comment,
      });
      setSubmitted(true);
      const updated = await actor.getReviews(id);
      setReviews(updated);
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  };

  if (!book)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ color: "#D4AF37" }}>Loading...</div>
      </div>
    );

  const kindle = book.formats.find((f) => f.__kind__ === "kindle");
  const paperback = book.formats.find((f) => f.__kind__ === "paperback");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link
        to="/books"
        className="text-sm mb-8 inline-flex items-center gap-1"
        style={{ color: "#D4AF37" }}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          role="img"
          aria-label="Back"
        >
          <title>Back</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Books
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-6">
        <div>
          <div
            className="w-full aspect-[2/3] rounded-xl flex items-center justify-center"
            style={{
              background: book.coverImageUrl
                ? undefined
                : "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
              border: "1px solid rgba(212,175,55,0.2)",
              boxShadow: "0 8px 40px rgba(212,175,55,0.1)",
            }}
          >
            {book.coverImageUrl ? (
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="text-center">
                <div
                  style={{ fontSize: "4rem", color: "rgba(212,175,55,0.4)" }}
                >
                  📖
                </div>
                <div
                  className="text-xs mt-2 px-4"
                  style={{ color: "rgba(212,175,55,0.6)" }}
                >
                  {book.title}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleWishlist}
            className="mt-4 w-full py-3 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              border: `1px solid ${wishlisted ? "#D4AF37" : "rgba(212,175,55,0.3)"}`,
              color: wishlisted ? "#D4AF37" : isDark ? "#888" : "#666",
              background: wishlisted ? "rgba(212,175,55,0.1)" : "transparent",
            }}
          >
            {wishlisted ? "\u2665 In Wishlist" : "\u2661 Add to Wishlist"}
          </button>
        </div>

        <div className="md:col-span-2">
          <div className="text-sm mb-2" style={{ color: "#D4AF37" }}>
            {book.genre}
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{
              fontFamily: "Playfair Display, serif",
              color: isDark ? "#f0ead6" : "#1a1a1a",
            }}
          >
            {book.title}
          </h1>
          <p
            className="text-base leading-relaxed mb-8"
            style={{ color: isDark ? "#aaa" : "#555" }}
          >
            {book.description}
          </p>
          <div className="mb-6">
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "#D4AF37" }}
            >
              Available Formats
            </h3>
            <div className="flex flex-wrap gap-3">
              {kindle && kindle.__kind__ === "kindle" && kindle.kindle && (
                <a
                  href={kindle.kindle}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium"
                  style={{
                    background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                    color: "#0a0a0a",
                  }}
                >
                  \ud83d\udcf1 Kindle Edition
                </a>
              )}
              {paperback &&
                paperback.__kind__ === "paperback" &&
                paperback.paperback && (
                  <FormatLink
                    href={paperback.paperback}
                    label="\ud83d\udcd6 Paperback"
                  />
                )}
              {book.audiobookLink && (
                <a
                  href={book.audiobookLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium"
                  style={{
                    border: "1px solid rgba(212,175,55,0.3)",
                    color: isDark ? "#ccc" : "#555",
                    background: "transparent",
                  }}
                >
                  \ud83c\udfa7 Audiobook
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2
          className="text-2xl font-bold mb-8"
          style={{
            fontFamily: "Playfair Display, serif",
            color: isDark ? "#f0ead6" : "#1a1a1a",
          }}
        >
          Reader Reviews
        </h2>
        {reviews.length === 0 && (
          <p
            className="text-sm mb-8"
            style={{ color: isDark ? "#666" : "#999" }}
          >
            No reviews yet. Be the first!
          </p>
        )}
        <div className="space-y-4 mb-10">
          {reviews.map((r) => (
            <div
              key={`${r.reviewerName}-${r.email}`}
              className="p-5 rounded-xl"
              style={{
                background: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.03)",
                border: "1px solid rgba(212,175,55,0.1)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="font-medium text-sm"
                  style={{ color: isDark ? "#f0ead6" : "#1a1a1a" }}
                >
                  {r.reviewerName}
                </span>
                <StarRating rating={Number(r.rating)} size={16} />
              </div>
              <p
                className="text-sm"
                style={{ color: isDark ? "#888" : "#666" }}
              >
                {r.comment}
              </p>
            </div>
          ))}
        </div>
        {!submitted ? (
          <div
            className="p-6 rounded-xl"
            style={{
              background: isDark
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.02)",
              border: "1px solid rgba(212,175,55,0.15)",
            }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: isDark ? "#f0ead6" : "#1a1a1a" }}
            >
              Leave a Review
            </h3>
            <form onSubmit={handleReview} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Your name"
                  value={reviewForm.name}
                  onChange={(e) =>
                    setReviewForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                  className="px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.05)",
                    border: "1px solid rgba(212,175,55,0.2)",
                    color: isDark ? "#f0ead6" : "#1a1a1a",
                  }}
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={reviewForm.email}
                  onChange={(e) =>
                    setReviewForm((p) => ({ ...p, email: e.target.value }))
                  }
                  required
                  className="px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.05)",
                    border: "1px solid rgba(212,175,55,0.2)",
                    color: isDark ? "#f0ead6" : "#1a1a1a",
                  }}
                />
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-sm"
                  style={{ color: isDark ? "#888" : "#666" }}
                >
                  Rating:
                </span>
                <StarRating
                  rating={reviewForm.rating}
                  onChange={(r) => setReviewForm((p) => ({ ...p, rating: r }))}
                />
              </div>
              <textarea
                placeholder="Share your thoughts..."
                value={reviewForm.comment}
                onChange={(e) =>
                  setReviewForm((p) => ({ ...p, comment: e.target.value }))
                }
                required
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{
                  background: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)",
                  border: "1px solid rgba(212,175,55,0.2)",
                  color: isDark ? "#f0ead6" : "#1a1a1a",
                }}
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-xl text-sm font-semibold"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                  color: "#0a0a0a",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "#D4AF37" }}>
            \u2713 Review submitted. Thank you!
          </p>
        )}
      </div>

      {relatedBooks.length > 0 && (
        <div className="mt-16">
          <h2
            className="text-2xl font-bold mb-8"
            style={{
              fontFamily: "Playfair Display, serif",
              color: isDark ? "#f0ead6" : "#1a1a1a",
            }}
          >
            You May Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedBooks.map((b) => (
              <BookCard key={b.id} book={b} isDark={isDark} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FormatLink({ href, label }: { href: string; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
      style={{
        border: "1px solid #D4AF37",
        color: "#D4AF37",
        background: hovered ? "rgba(212,175,55,0.1)" : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </a>
  );
}
