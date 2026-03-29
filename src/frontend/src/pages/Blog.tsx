import { useEffect, useState } from "react";
import type { BlogPost } from "../backend.d";
import BlogCard from "../components/BlogCard";
import { useActor } from "../hooks/useActor";
import { useSEO } from "../hooks/useSEO";
import { useScrollReveal } from "../hooks/useScrollReveal";

interface Props {
  isDark: boolean;
}

const CATEGORIES = ["All", "Writing", "Storytelling", "Ideas"];

const SEED_POSTS: BlogPost[] = [
  {
    id: "post-1",
    title: "The Art of the First Sentence",
    excerpt:
      "How the opening line of a story can define its entire universe. Exploring what makes a first sentence unforgettable.",
    content: "Every story begins with a promise...",
    category: "Writing",
    coverImageUrl: "",
    publishedAt: BigInt(Date.now() * 1_000_000),
  },
  {
    id: "post-2",
    title: "Why Stories Are Our Greatest Technology",
    excerpt:
      "Long before computers and smartphones, humans wielded the most powerful tool ever created: the story.",
    content: "Stories predate written language...",
    category: "Storytelling",
    coverImageUrl: "",
    publishedAt: BigInt((Date.now() - 7 * 86400000) * 1_000_000),
  },
  {
    id: "post-3",
    title: "Where Do Ideas Come From?",
    excerpt:
      "The mysterious alchemy of creativity — how a chance encounter, a dream, or a single word can spark an entire novel.",
    content: "Ideas are everywhere...",
    category: "Ideas",
    coverImageUrl: "",
    publishedAt: BigInt((Date.now() - 14 * 86400000) * 1_000_000),
  },
];

export default function Blog({ isDark }: Props) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const { actor } = useActor();
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal();

  useSEO({
    title: "Blog — Mystoryova",
    description: "Stories, insights, and writing from O. Chiddarwar.",
  });

  useEffect(() => {
    if (!actor) return;
    actor
      .getBlogPosts()
      .then((p) => {
        setPosts(p.length > 0 ? p : SEED_POSTS);
      })
      .catch(() => setPosts(SEED_POSTS))
      .finally(() => setLoading(false));
  }, [actor]);

  const filtered =
    category === "All" ? posts : posts.filter((p) => p.category === category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <div
          className="text-xs tracking-[0.3em] uppercase mb-3"
          style={{ color: "#D4AF37" }}
        >
          Insights
        </div>
        <h1
          className="text-4xl font-bold"
          style={{
            fontFamily: "Playfair Display, serif",
            color: isDark ? "#f0ead6" : "#1a1a1a",
          }}
        >
          The Author&apos;s Voice
        </h1>
      </div>
      <div className="flex gap-2 flex-wrap justify-center mb-10">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200"
            style={{
              background:
                category === cat
                  ? "linear-gradient(135deg, #D4AF37, #F0D060)"
                  : "transparent",
              color: category === cat ? "#0a0a0a" : isDark ? "#888" : "#666",
              border: `1px solid ${
                category === cat ? "#D4AF37" : "rgba(212,175,55,0.2)"
              }`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }, (_, i) => `skeleton-${i}`).map((key) => (
            <div
              key={key}
              className="rounded-xl h-48 skeleton-shimmer"
              style={{ border: "1px solid rgba(212,175,55,0.1)" }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-20"
          style={{ color: isDark ? "#666" : "#999" }}
        >
          No posts in this category yet.
        </div>
      ) : (
        <div
          ref={gridRef}
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 scroll-reveal${
            gridVisible ? " visible" : ""
          }`}
        >
          {filtered.map((post) => (
            <BlogCard key={post.id} post={post} isDark={isDark} />
          ))}
        </div>
      )}
    </div>
  );
}
