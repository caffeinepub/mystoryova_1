import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { BlogPost, Book } from "../backend.d";
import BlogCard from "../components/BlogCard";
import BookCard from "../components/BookCard";
import { SEED_BOOKS } from "../data/seedBooks";
import { useActor } from "../hooks/useActor";

interface Props {
  isDark: boolean;
}

export default function SearchPage({ isDark }: Props) {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [books, setBooks] = useState<Book[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const { actor } = useActor();

  useEffect(() => {
    document.title = `Search: ${q} — Mystoryova`;
  }, [q]);

  useEffect(() => {
    if (!actor || !q) return;
    const lower = q.toLowerCase();
    actor
      .getBooks()
      .then((b) => {
        const all = b.length > 0 ? b : SEED_BOOKS;
        setBooks(
          all.filter(
            (bk) =>
              bk.title.toLowerCase().includes(lower) ||
              bk.description.toLowerCase().includes(lower) ||
              bk.genre.toLowerCase().includes(lower),
          ),
        );
      })
      .catch(() => {
        setBooks(
          SEED_BOOKS.filter(
            (bk) =>
              bk.title.toLowerCase().includes(lower) ||
              bk.description.toLowerCase().includes(lower),
          ),
        );
      });
    actor
      .getBlogPosts()
      .then((p) => {
        setPosts(
          p.filter(
            (post) =>
              post.title.toLowerCase().includes(lower) ||
              post.excerpt.toLowerCase().includes(lower),
          ),
        );
      })
      .catch(() => setPosts([]));
  }, [actor, q]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12">
        <div
          className="text-xs tracking-[0.3em] uppercase mb-3"
          style={{ color: "#D4AF37" }}
        >
          Search Results
        </div>
        <h1
          className="text-3xl font-bold"
          style={{
            fontFamily: "Playfair Display, serif",
            color: isDark ? "#f0ead6" : "#1a1a1a",
          }}
        >
          {q ? `Results for “${q}”` : "Search"}
        </h1>
      </div>

      {books.length > 0 && (
        <div className="mb-12">
          <h2
            className="text-lg font-semibold mb-6"
            style={{ color: isDark ? "#f0ead6" : "#1a1a1a" }}
          >
            Books ({books.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.map((b) => (
              <BookCard key={b.id} book={b} isDark={isDark} />
            ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div>
          <h2
            className="text-lg font-semibold mb-6"
            style={{ color: isDark ? "#f0ead6" : "#1a1a1a" }}
          >
            Blog Posts ({posts.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => (
              <BlogCard key={p.id} post={p} isDark={isDark} />
            ))}
          </div>
        </div>
      )}

      {books.length === 0 && posts.length === 0 && q && (
        <div
          className="text-center py-20"
          style={{ color: isDark ? "#666" : "#999" }}
        >
          No results found for &ldquo;{q}&rdquo;
        </div>
      )}
    </div>
  );
}
