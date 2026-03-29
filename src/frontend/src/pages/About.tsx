import { useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";
import { useSEO } from "../hooks/useSEO";
import { useScrollReveal } from "../hooks/useScrollReveal";

interface Props {
  isDark: boolean;
}

const DEFAULT_BIO = `O. Chiddarwar is the creative force behind Mystoryova — a literary universe built on stories that resonate, challenge, and endure.

With a passion for crafting narratives that transcend the ordinary, O. Chiddarwar has penned tales spanning literary fiction, fantasy, romance, thriller, and poetry. Each work is a testament to the belief that great stories don't just entertain — they transform.

Born with an insatiable curiosity and a deep love for the written word, the author draws inspiration from the complexities of human emotion, the beauty of the natural world, and the endless possibilities of the imagination.

From debut novel "The Long Climb" to the sweeping fantasy "The Ember Prophecy," every book in the Mystoryova catalog reflects a commitment to quality, depth, and the power of storytelling.

"I write because I believe every person deserves to find themselves in a story — to feel seen, understood, and less alone in this vast and beautiful world." — O. Chiddarwar`;

function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      drift: number;
    }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.4 + 0.15,
        opacity: Math.random() * 0.5 + 0.1,
        drift: (Math.random() - 0.5) * 0.4,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`;
        ctx.fill();
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
      }
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
    />
  );
}

export default function About({ isDark }: Props) {
  const [bio, setBio] = useState(DEFAULT_BIO);
  const { actor } = useActor();
  const { ref: bioRef, isVisible: bioVisible } = useScrollReveal();

  useSEO({
    title: "About — Mystoryova",
    description: "Meet O. Chiddarwar, the author behind Mystoryova.",
  });

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
    <div>
      {/* Hero banner with particles */}
      <div
        className="relative py-24 px-4 overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #0a0a0a 0%, rgba(10,10,10,0.95) 100%)",
        }}
      >
        <HeroParticles />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 text-center">
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
              color: "#f0ead6",
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
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div
          ref={bioRef}
          className={`scroll-reveal${bioVisible ? " visible" : ""}`}
        >
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
