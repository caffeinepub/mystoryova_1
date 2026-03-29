import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Book } from "../backend.d";
import BookCard from "../components/BookCard";
import NewsletterSignup from "../components/NewsletterSignup";
import { SEED_BOOKS } from "../data/seedBooks";
import { useActor } from "../hooks/useActor";
import { useSEO } from "../hooks/useSEO";
import { useScrollReveal } from "../hooks/useScrollReveal";

interface Props {
  isDark: boolean;
}

function ParticleBackground() {
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

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.6 + 0.1,
        drift: (Math.random() - 0.5) * 0.5,
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

export default function Home({ isDark }: Props) {
  const [books, setBooks] = useState<Book[]>(SEED_BOOKS);
  const { actor } = useActor();
  const { ref: featuredRef, isVisible: featuredVisible } = useScrollReveal();
  const { ref: newsletterRef, isVisible: newsletterVisible } =
    useScrollReveal();

  useSEO({
    title: "Mystoryova — Stories That Stay With You",
    description:
      "Discover literary worlds by O. Chiddarwar. Premium audiobooks, signed merch, and stories that stay with you.",
  });

  useEffect(() => {
    if (!actor) return;
    actor
      .getBooks()
      .then((b) => {
        setBooks(b.length > 0 ? b : SEED_BOOKS);
      })
      .catch(() => setBooks(SEED_BOOKS));
  }, [actor]);

  const featuredBooks = (
    books.filter((b) => b.featured).length > 0
      ? books.filter((b) => b.featured)
      : books
  ).slice(0, 4);

  return (
    <div>
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: "#0a0a0a" }}
      >
        <ParticleBackground />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div
            className="text-sm font-medium tracking-[0.3em] mb-6 uppercase"
            style={{ color: "#D4AF37", opacity: 0.8 }}
          >
            O. Chiddarwar
          </div>
          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight"
            style={{
              fontFamily: "Playfair Display, serif",
              background:
                "linear-gradient(135deg, #ffffff 30%, #D4AF37 70%, #F0D060 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Stories That Stay With You
          </h1>
          <p
            className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(240,234,214,0.7)" }}
          >
            Discover literary worlds crafted with passion. From epic fantasies
            to heartfelt romances &mdash; every book a journey you won&apos;t
            forget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <HeroLink to="/books" variant="gold">
              Browse Books
            </HeroLink>
            <HeroLink to="/store" variant="outline">
              Visit Store
            </HeroLink>
          </div>
        </div>
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ color: "rgba(212,175,55,0.5)" }}
        >
          <span className="text-xs tracking-widest">SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-amber-500/50 to-transparent" />
        </div>
      </section>

      {featuredBooks.length > 0 && (
        <section className="py-20 px-4 max-w-7xl mx-auto">
          <div
            ref={featuredRef}
            className={`scroll-reveal${featuredVisible ? " visible" : ""}`}
          >
            <div className="text-center mb-12">
              <div
                className="text-xs tracking-[0.3em] uppercase mb-3"
                style={{ color: "#D4AF37" }}
              >
                Featured
              </div>
              <h2
                className="text-3xl sm:text-4xl font-bold"
                style={{
                  fontFamily: "Playfair Display, serif",
                  color: isDark ? "#f0ead6" : "#1a1a1a",
                }}
              >
                Latest from O. Chiddarwar
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredBooks.map((book) => (
                <BookCard key={book.id} book={book} isDark={isDark} />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                to="/books"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  border: "1px solid rgba(212,175,55,0.4)",
                  color: "#D4AF37",
                }}
              >
                View All Books
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="Arrow right"
                >
                  <title>Arrow right</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 px-4">
        <div
          ref={newsletterRef}
          className={`max-w-2xl mx-auto scroll-reveal${
            newsletterVisible ? " visible" : ""
          }`}
        >
          <NewsletterSignup isDark={isDark} />
        </div>
      </section>
    </div>
  );
}

function HeroLink({
  to,
  variant,
  children,
}: { to: string; variant: "gold" | "outline"; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  const goldStyle = {
    background: hovered
      ? "linear-gradient(135deg, #F0D060, #D4AF37)"
      : "linear-gradient(135deg, #D4AF37, #F0D060)",
    color: "#0a0a0a",
    boxShadow: hovered
      ? "0 8px 32px rgba(212,175,55,0.5)"
      : "0 4px 20px rgba(212,175,55,0.3)",
    transform: hovered ? "translateY(-2px)" : "translateY(0)",
  };
  const outlineStyle = {
    border: "1px solid #D4AF37",
    color: "#D4AF37",
    background: hovered ? "rgba(212,175,55,0.1)" : "transparent",
    transform: hovered ? "translateY(-2px)" : "translateY(0)",
  };
  return (
    <Link
      to={to}
      className="px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300"
      style={variant === "gold" ? goldStyle : outlineStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </Link>
  );
}
