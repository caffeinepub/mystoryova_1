import { useEffect, useState } from "react";
import { useActor } from "../hooks/useActor";

interface Props {
  isDark: boolean;
}

const DEFAULT_BIO = `O. Chiddarwar is the creative force behind Mystoryova \u2014 a literary universe built on stories that resonate, challenge, and endure.

With a passion for crafting narratives that transcend the ordinary, O. Chiddarwar has penned tales spanning literary fiction, fantasy, romance, thriller, and poetry. Each work is a testament to the belief that great stories don't just entertain \u2014 they transform.

Born with an insatiable curiosity and a deep love for the written word, the author draws inspiration from the complexities of human emotion, the beauty of the natural world, and the endless possibilities of the imagination.

From debut novel "The Long Climb" to the sweeping fantasy "The Ember Prophecy," every book in the Mystoryova catalog reflects a commitment to quality, depth, and the power of storytelling.

"I write because I believe every person deserves to find themselves in a story \u2014 to feel seen, understood, and less alone in this vast and beautiful world." \u2014 O. Chiddarwar`;

export default function About({ isDark }: Props) {
  const [bio, setBio] = useState(DEFAULT_BIO);
  const { actor } = useActor();

  useEffect(() => {
    document.title = "About \u2014 Mystoryova";
  }, []);

  useEffect(() => {
    if (!actor) return;
    actor
      .getAuthorBio()
      .then((b) => {
        if (b?.trim()) setBio(b);
      })
      .catch(() => {});
  }, [actor]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <div
          className="text-xs tracking-[0.3em] uppercase mb-3"
          style={{ color: "#D4AF37" }}
        >
          The Author
        </div>
        <h1
          className="text-4xl sm:text-5xl font-bold mb-4"
          style={{
            fontFamily: "Playfair Display, serif",
            color: isDark ? "#f0ead6" : "#1a1a1a",
          }}
        >
          O. Chiddarwar
        </h1>
        <div
          className="w-16 h-0.5 mx-auto"
          style={{
            background:
              "linear-gradient(90deg, transparent, #D4AF37, transparent)",
          }}
        />
      </div>

      <div
        className="rounded-2xl p-8 sm:p-12"
        style={{
          background: isDark
            ? "rgba(255,255,255,0.03)"
            : "rgba(255,255,255,0.9)",
          border: "1px solid rgba(212,175,55,0.15)",
          boxShadow: "0 8px 40px rgba(212,175,55,0.05)",
        }}
      >
        <div
          className="text-base sm:text-lg leading-relaxed whitespace-pre-line"
          style={{ color: isDark ? "#c0b89a" : "#3a3530" }}
        >
          {bio}
        </div>
      </div>

      <div className="mt-12 text-center">
        <h3
          className="text-sm font-semibold mb-6"
          style={{ color: isDark ? "#888" : "#666" }}
        >
          Connect with O. Chiddarwar
        </h3>
        <div className="flex justify-center gap-4 flex-wrap">
          {[
            {
              label: "Instagram",
              url: "https://www.instagram.com/mystoryova?igsh=MW9zZjdscWtodXpwNg==",
            },
            {
              label: "Facebook",
              url: "https://www.facebook.com/share/18R1ypxq4q/",
            },
            {
              label: "Amazon",
              url: "https://www.amazon.com/author/o.chiddarwar",
            },
          ].map(({ label, url }) => (
            <SocialLink key={label} label={label} url={url} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SocialLink({ label, url }: { label: string; url: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
      style={{
        border: "1px solid rgba(212,175,55,0.3)",
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
