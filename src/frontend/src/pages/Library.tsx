import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AUDIOBOOKS } from "../data/seedStore";

interface Props {
  isDark: boolean;
}

const LIBRARY_KEY = "mystoryova_library";

function getUnlocked(): string[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function setUnlocked(ids: string[]) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(ids));
}

export default function Library({ isDark }: Props) {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  useEffect(() => {
    setUnlockedIds(getUnlocked());
  }, []);

  const fg = isDark ? "#f0ead6" : "#1a1a1a";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const cardBorder = isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.3)";
  const mutedColor = isDark ? "#888" : "#666";

  function handleUnlock(id: string) {
    const next = [...unlockedIds, id];
    setUnlocked(next);
    setUnlockedIds(next);
  }

  const hasAny = unlockedIds.length > 0;

  return (
    <div
      className="min-h-screen py-16 px-4"
      style={{ backgroundColor: isDark ? "#0a0a0a" : "#f8f4f0", color: fg }}
    >
      <div className="max-w-5xl mx-auto">
        <h1
          className="text-4xl md:text-5xl font-bold mb-3"
          style={{ fontFamily: "Playfair Display, serif", color: "#D4AF37" }}
        >
          My Library
        </h1>
        <p className="text-sm mb-2" style={{ color: mutedColor }}>
          Your purchased audiobooks appear here after payment confirmation.
        </p>
        <p
          className="text-xs mb-10 px-4 py-3 rounded-lg"
          style={{
            background: isDark
              ? "rgba(212,175,55,0.06)"
              : "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.2)",
            color: mutedColor,
          }}
        >
          💡 After completing payment via Razorpay, click{" "}
          <strong style={{ color: "#D4AF37" }}>"Unlock Audiobook"</strong> below
          to add it to your library manually.
        </p>

        {!hasAny && (
          <div
            data-ocid="library.empty_state"
            className="text-center py-12 mb-10 rounded-2xl"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div className="text-6xl mb-4">🎧</div>
            <p
              className="text-lg mb-2"
              style={{
                fontFamily: "Playfair Display, serif",
                color: mutedColor,
              }}
            >
              No audiobooks unlocked yet.
            </p>
            <p className="text-sm mb-6" style={{ color: mutedColor }}>
              Purchase from the Store to unlock your audiobooks.
            </p>
            <Button
              asChild
              data-ocid="library.primary_button"
              style={{
                background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                color: "#0a0a0a",
                fontWeight: 700,
              }}
            >
              <Link to="/store">Browse the Store</Link>
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {AUDIOBOOKS.map((book, i) => {
            const unlocked = unlockedIds.includes(book.id);
            return (
              <div
                key={book.id}
                data-ocid={`library.item.${i + 1}`}
                className="rounded-2xl p-6 flex flex-col gap-4 transition-transform duration-200 hover:-translate-y-1"
                style={{
                  background: cardBg,
                  border: `1px solid ${unlocked ? "rgba(212,175,55,0.4)" : cardBorder}`,
                  backdropFilter: "blur(12px)",
                  opacity: unlocked ? 1 : 0.7,
                }}
              >
                <div className="text-5xl text-center py-2">
                  {book.coverEmoji}
                </div>
                <div>
                  <h3
                    className="text-xl font-bold mb-1"
                    style={{
                      fontFamily: "Playfair Display, serif",
                      color: unlocked ? "#D4AF37" : fg,
                    }}
                  >
                    {book.name}
                  </h3>
                  <p className="text-xs mb-1" style={{ color: mutedColor }}>
                    🎙️ {book.narrator}
                  </p>
                  <p className="text-xs" style={{ color: mutedColor }}>
                    ⏱️ {book.duration}
                  </p>
                </div>

                <div className="mt-auto">
                  {unlocked ? (
                    <div className="flex flex-col gap-2">
                      <Badge
                        className="self-start text-xs"
                        style={{
                          background: "rgba(212,175,55,0.15)",
                          color: "#D4AF37",
                          border: "1px solid rgba(212,175,55,0.3)",
                        }}
                      >
                        ✓ Unlocked
                      </Badge>
                      <Button
                        data-ocid={`library.primary_button.${i + 1}`}
                        size="sm"
                        style={{
                          background:
                            "linear-gradient(135deg, #D4AF37, #F0D060)",
                          color: "#0a0a0a",
                          fontWeight: 700,
                        }}
                      >
                        🎧 Listen Now
                      </Button>
                    </div>
                  ) : (
                    <Button
                      data-ocid={`library.secondary_button.${i + 1}`}
                      size="sm"
                      variant="outline"
                      className="w-full"
                      style={{
                        borderColor: "rgba(212,175,55,0.3)",
                        color: "#D4AF37",
                      }}
                      onClick={() => handleUnlock(book.id)}
                    >
                      🔓 Unlock Audiobook
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
