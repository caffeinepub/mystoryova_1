import { useState } from "react";
import { Link } from "react-router-dom";
import type { BlogPost } from "../backend.d";

interface Props {
  post: BlogPost;
  isDark: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Writing: "#D4AF37",
  Storytelling: "#9B8AC4",
  Ideas: "#7ABFBF",
};

export default function BlogCard({ post, isDark }: Props) {
  const [hovered, setHovered] = useState(false);

  const dateStr = new Date(
    Number(post.publishedAt) / 1_000_000,
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const catColor = CATEGORY_COLORS[post.category] || "#D4AF37";

  return (
    <Link
      to={`/blog/${post.id}`}
      className="group block rounded-xl overflow-hidden"
      style={{
        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)",
        border: hovered
          ? "1px solid rgba(212,175,55,0.5)"
          : "1px solid rgba(212,175,55,0.15)",
        boxShadow: hovered
          ? "0 12px 40px rgba(212,175,55,0.25)"
          : isDark
            ? "0 2px 12px rgba(0,0,0,0.3)"
            : "0 2px 12px rgba(0,0,0,0.1)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition:
          "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {post.coverImageUrl && (
        <div className="h-40 overflow-hidden">
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      {!post.coverImageUrl && (
        <div
          className="h-32 flex items-center justify-center"
          style={{
            background: isDark
              ? "rgba(212,175,55,0.06)"
              : "rgba(212,175,55,0.1)",
          }}
        >
          <span style={{ color: "rgba(212,175,55,0.4)", fontSize: "2rem" }}>
            ✍️
          </span>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: `${catColor}20`, color: catColor }}
          >
            {post.category}
          </span>
          <span className="text-xs" style={{ color: isDark ? "#666" : "#888" }}>
            {dateStr}
          </span>
        </div>
        <h3
          className="font-semibold mb-2 group-hover:text-amber-400 transition-colors leading-tight"
          style={{
            fontFamily: "Playfair Display, serif",
            color: isDark ? "#f0ead6" : "#1a1a1a",
          }}
        >
          {post.title}
        </h3>
        <p
          className="text-sm line-clamp-2"
          style={{ color: isDark ? "#888" : "#666" }}
        >
          {post.excerpt}
        </p>
      </div>
    </Link>
  );
}
