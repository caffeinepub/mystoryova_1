import { useEffect, useMemo, useState } from "react";
import type { Book } from "../backend.d";
import BookCard from "../components/BookCard";
import { SEED_BOOKS } from "../data/seedBooks";
import { useActor } from "../hooks/useActor";
import { useSEO } from "../hooks/useSEO";

interface Props {
  isDark: boolean;
}

export default function Books({ isDark }: Props) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [format, setFormat] = useState("All");
  const { actor } = useActor();

  useSEO({
    title: "Books — Mystoryova",
    description:
      "Browse all books by O. Chiddarwar — epic fantasies, heartfelt romances, and more.",
  });

  useEffect(() => {
    if (!actor) return;
    actor
      .getBooks()
      .then((b) => {
        setBooks(b.length > 0 ? b : SEED_BOOKS);
      })
      .catch(() => setBooks(SEED_BOOKS))
      .finally(() => setLoading(false));
  }, [actor]);

  const genres = useMemo(
    () => ["All", ...Array.from(new Set(books.map((b) => b.genre)))],
    [books],
  );

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        !search ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.description.toLowerCase().includes(search.toLowerCase());
      const matchGenre = genre === "All" || b.genre === genre;
      const matchFormat =
        format === "All" ||
        (format === "Kindle" &&
          b.formats.some((f) => f.__kind__ === "kindle")) ||
        (format === "Paperback" &&
          b.formats.some((f) => f.__kind__ === "paperback")) ||
        (format === "Audiobook" && !!b.audiobookLink);
      return matchSearch && matchGenre && matchFormat;
    });
  }, [books, search, genre, format]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <div
          className="text-xs tracking-[0.3em] uppercase mb-3"
          style={{ color: "#D4AF37" }}
        >
          Library
        </div>
        <h1
          className="text-4xl font-bold mb-4"
          style={{
            fontFamily: "Playfair Display, serif",
            color: isDark ? "#f0ead6" : "#1a1a1a",
          }}
        >
          All Books
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search books..."
          className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
          style={{
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
            border: "1px solid rgba(212,175,55,0.2)",
            color: isDark ? "#f0ead6" : "#1a1a1a",
          }}
        />
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="px-4 py-3 rounded-xl text-sm outline-none cursor-pointer"
          style={{
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
            border: "1px solid rgba(212,175,55,0.2)",
            color: isDark ? "#f0ead6" : "#1a1a1a",
          }}
        >
          {genres.map((g) => (
            <option
              key={g}
              value={g}
              style={{ background: isDark ? "#1a1a1a" : "#fff" }}
            >
              {g}
            </option>
          ))}
        </select>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="px-4 py-3 rounded-xl text-sm outline-none cursor-pointer"
          style={{
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
            border: "1px solid rgba(212,175,55,0.2)",
            color: isDark ? "#f0ead6" : "#1a1a1a",
          }}
        >
          {["All", "Kindle", "Paperback", "Audiobook"].map((f) => (
            <option
              key={f}
              value={f}
              style={{ background: isDark ? "#1a1a1a" : "#fff" }}
            >
              {f}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((key) => (
            <div
              key={key}
              className="rounded-xl h-64 skeleton-shimmer"
              style={{ border: "1px solid rgba(212,175,55,0.1)" }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-20"
          style={{ color: isDark ? "#666" : "#999" }}
        >
          No books found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((book) => (
            <BookCard key={book.id} book={book} isDark={isDark} />
          ))}
        </div>
      )}
    </div>
  );
}
