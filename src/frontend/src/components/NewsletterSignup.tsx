import { useState } from "react";
import { useActor } from "../hooks/useActor";

interface Props {
  isDark: boolean;
}

export default function NewsletterSignup({ isDark }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const { actor } = useActor();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !actor) return;
    setStatus("loading");
    try {
      await actor.addSubscriber(email.trim());
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      className="rounded-2xl p-8 text-center"
      style={{
        background: isDark ? "rgba(212,175,55,0.06)" : "rgba(212,175,55,0.08)",
        border: "1px solid rgba(212,175,55,0.2)",
      }}
    >
      <h3
        className="text-2xl font-bold mb-2"
        style={{ fontFamily: "Playfair Display, serif", color: "#D4AF37" }}
      >
        Stay in the Story
      </h3>
      <p className="text-sm mb-6" style={{ color: isDark ? "#888" : "#666" }}>
        Get updates on new releases, exclusive excerpts, and literary insights
        from O. Chiddarwar.
      </p>
      {status === "success" ? (
        <p className="text-sm font-medium" style={{ color: "#D4AF37" }}>
          ✓ You&apos;re subscribed! Welcome to the Mystoryova family.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.05)",
              border: "1px solid rgba(212,175,55,0.2)",
              color: isDark ? "#f0ead6" : "#1a1a1a",
            }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #F0D060)",
              color: "#0a0a0a",
              opacity: status === "loading" ? 0.7 : 1,
            }}
          >
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="mt-3 text-xs" style={{ color: "#e88" }}>
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
