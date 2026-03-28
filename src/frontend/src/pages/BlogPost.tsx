import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { BlogPost as BlogPostType } from "../backend.d";
import { useActor } from "../hooks/useActor";

interface Props {
  isDark: boolean;
}

export default function BlogPost({ isDark }: Props) {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const { actor } = useActor();

  useEffect(() => {
    if (!id || !actor) return;
    actor
      .getBlogPost(id)
      .then((p) => {
        setPost(p);
        document.title = `${p.title} \u2014 Mystoryova`;
      })
      .catch(() => setPost(null));
  }, [id, actor]);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ color: "#D4AF37" }}>Loading...</div>
      </div>
    );
  }

  const dateStr = new Date(
    Number(post.publishedAt) / 1_000_000,
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link
        to="/blog"
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
        Back to Blog
      </Link>
      {post.coverImageUrl && (
        <img
          src={post.coverImageUrl}
          alt={post.title}
          className="w-full h-64 object-cover rounded-xl mb-8 mt-4"
        />
      )}
      <div className="flex items-center gap-3 mt-6 mb-4">
        <span
          className="text-xs font-medium px-3 py-1 rounded-full"
          style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}
        >
          {post.category}
        </span>
        <span className="text-xs" style={{ color: isDark ? "#666" : "#888" }}>
          {dateStr}
        </span>
      </div>
      <h1
        className="text-3xl sm:text-4xl font-bold mb-6"
        style={{
          fontFamily: "Playfair Display, serif",
          color: isDark ? "#f0ead6" : "#1a1a1a",
        }}
      >
        {post.title}
      </h1>
      <div
        className="text-base leading-relaxed whitespace-pre-line"
        style={{ color: isDark ? "#aaa" : "#444" }}
      >
        {post.content}
      </div>
    </div>
  );
}
