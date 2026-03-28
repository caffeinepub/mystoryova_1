import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Book } from "../backend.d";
import BookCard from "../components/BookCard";
import { SEED_BOOKS } from "../data/seedBooks";
import { useActor } from "../hooks/useActor";
import { getWishlist, removeFromWishlist } from "../utils/wishlist";

interface Props {
  isDark: boolean;
}

export default function Wishlist({ isDark }: Props) {
  const [books, setBooks] = useState<Book[]>([]);
  const { actor } = useActor();

  useEffect(() => {
    document.title = "Wishlist — Mystoryova";
  }, []);

  const loadWishlist = useCallback(() => {
    const ids = getWishlist();
    if (!actor) {
      setBooks(SEED_BOOKS.filter((b) => ids.includes(b.id)));
      return;
    }
    actor
      .getBooks()
      .then((all) => {
        const allBooks = all.length > 0 ? all : SEED_BOOKS;
        setBooks(allBooks.filter((b) => ids.includes(b.id)));
      })
      .catch(() => {
        setBooks(SEED_BOOKS.filter((b) => ids.includes(b.id)));
      });
  }, [actor]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  useEffect(() => {
    window.addEventListener("wishlist-update", loadWishlist);
    return () => window.removeEventListener("wishlist-update", loadWishlist);
  }, [loadWishlist]);

  const handleRemove = (id: string) => {
    removeFromWishlist(id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
    window.dispatchEvent(new Event("wishlist-update"));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <div
          className="text-xs tracking-[0.3em] uppercase mb-3"
          style={{ color: "#D4AF37" }}
        >
          Saved
        </div>
        <h1
          className="text-4xl font-bold"
          style={{
            fontFamily: "Playfair Display, serif",
            color: isDark ? "#f0ead6" : "#1a1a1a",
          }}
        >
          Your Wishlist
        </h1>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-20">
          <p
            className="text-lg mb-6"
            style={{ color: isDark ? "#666" : "#999" }}
          >
            Your wishlist is empty.
          </p>
          <Link
            to="/books"
            className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #F0D060)",
              color: "#0a0a0a",
            }}
          >
            Browse Books
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <div key={book.id}>
              <BookCard book={book} isDark={isDark} />
              <button
                type="button"
                onClick={() => handleRemove(book.id)}
                className="mt-2 w-full py-2 rounded-lg text-xs transition-all duration-200"
                style={{
                  border: "1px solid rgba(255,80,80,0.3)",
                  color: "#e88",
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
