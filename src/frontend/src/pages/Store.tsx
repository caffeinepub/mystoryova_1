import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AUDIOBOOK_PAYMENT_LINKS,
  openRazorpayCheckout,
} from "../config/razorpayLinks";
import {
  AUDIOBOOKS,
  type Audiobook,
  MERCH_ITEMS,
  type Merch,
} from "../data/seedStore";
import { useActor } from "../hooks/useActor";
import { addToCart } from "../utils/cart";

type Currency = "INR" | "USD";

interface Props {
  isDark: boolean;
}

function backendToLocalAudiobook(b: {
  id: string;
  name: string;
  description: string;
  coverEmoji: string;
  duration: string;
  narrator: string;
  priceINR: bigint;
  priceUSD: bigint;
  isActive: boolean;
}): Audiobook {
  return {
    id: b.id,
    name: b.name,
    description: b.description,
    coverEmoji: b.coverEmoji,
    duration: b.duration,
    narrator: b.narrator,
    price: Number(b.priceINR) / 100,
    priceUSD: Number(b.priceUSD) / 100,
  };
}

function backendToLocalMerch(m: {
  id: string;
  name: string;
  description: string;
  coverEmoji: string;
  category: string;
  priceINR: bigint;
  priceUSD: bigint;
  isActive: boolean;
}): Merch {
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    coverEmoji: m.coverEmoji,
    category: m.category,
    price: Number(m.priceINR) / 100,
    priceUSD: Number(m.priceUSD) / 100,
  };
}

export default function Store({ isDark }: Props) {
  const { actor } = useActor();
  const [activeTab, setActiveTab] = useState<"audiobooks" | "merch">(
    "audiobooks",
  );
  const [currency, setCurrency] = useState<Currency>("INR");
  const [previewBook, setPreviewBook] = useState<Audiobook | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>(AUDIOBOOKS);
  const [merchItems, setMerchItems] = useState<Merch[]>(MERCH_ITEMS);
  const [audioUrlMap, setAudioUrlMap] = useState<Record<string, string>>({});
  const [freeShippingMap, setFreeShippingMap] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!actor) return;
    Promise.all([
      actor.getAudiobooks(),
      actor.getMerchItems(),
      actor.getAllSettings(),
    ])
      .then(([abs, merch, settings]) => {
        const activeAbs = abs.filter((a) => a.isActive);
        const activeMerch = merch.filter((m) => m.isActive);
        if (activeAbs.length > 0)
          setAudiobooks(activeAbs.map(backendToLocalAudiobook));
        if (activeMerch.length > 0)
          setMerchItems(activeMerch.map(backendToLocalMerch));

        const audioUrls: Record<string, string> = {};
        const shippingFree: Record<string, boolean> = {};
        for (const s of settings) {
          if (s.key.startsWith("audioFile_") && s.value) {
            audioUrls[s.key.replace("audioFile_", "")] = s.value;
          }
          if (s.key.startsWith("shippingFree_")) {
            shippingFree[s.key.replace("shippingFree_", "")] =
              s.value === "true";
          }
        }
        setAudioUrlMap(audioUrls);
        setFreeShippingMap(shippingFree);
      })
      .catch(() => {
        // silently fall back to seed data
      });
  }, [actor]);

  const fg = isDark ? "#f0ead6" : "#1a1a1a";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const cardBorder = isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.3)";
  const mutedColor = isDark ? "#888" : "#666";

  function handleBuyNow(book: Audiobook) {
    const link = AUDIOBOOK_PAYMENT_LINKS.find((p) => p.productId === book.id);
    if (!link) return;
    const amount = currency === "INR" ? link.price : link.priceUSD;
    openRazorpayCheckout({
      name: link.name,
      description: book.description.slice(0, 100),
      amount,
      currency,
      onSuccess: () => {
        toast.success("Purchase successful! Enjoy your audiobook.");
      },
    });
  }

  function handleAddMerch(item: Merch) {
    const price = currency === "INR" ? item.price : item.priceUSD;
    addToCart({ id: item.id, name: item.name, price, type: "merch", currency });
    setAddedIds((prev) => new Set(prev).add(item.id));
    toast.success(`${item.name} added to cart`);
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 2000);
  }

  return (
    <div
      className="min-h-screen py-16 px-4"
      style={{ backgroundColor: isDark ? "#0a0a0a" : "#f8f4f0", color: fg }}
    >
      {/* Hero */}
      <div className="max-w-7xl mx-auto text-center mb-14">
        <h1
          className="text-5xl md:text-6xl font-bold mb-4"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          <span
            style={{
              background: "linear-gradient(135deg, #D4AF37, #F0D060)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            The Mystoryova Store
          </span>
        </h1>
        <p
          className="text-xl italic"
          style={{ color: mutedColor, fontFamily: "Playfair Display, serif" }}
        >
          Stories You Can Hold
        </p>
        <div
          className="w-24 h-px mx-auto mt-6"
          style={{
            background:
              "linear-gradient(90deg, transparent, #D4AF37, transparent)",
          }}
        />
      </div>

      {/* Tabs + Currency toggle row */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div
            className="flex gap-0 border rounded-xl overflow-hidden"
            style={{ borderColor: cardBorder }}
          >
            {(["audiobooks", "merch"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                data-ocid={`store.${tab}.tab`}
                className="px-8 py-3 text-sm font-semibold tracking-wide transition-all duration-200"
                style={{
                  background:
                    activeTab === tab
                      ? "linear-gradient(135deg, #D4AF37, #F0D060)"
                      : "transparent",
                  color: activeTab === tab ? "#0a0a0a" : mutedColor,
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "audiobooks" ? "🎧 Audiobooks" : "🛍️ Merchandise"}
              </button>
            ))}
          </div>

          {/* Currency toggle */}
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: mutedColor }}
            >
              Currency
            </span>
            <div
              className="flex gap-0 border rounded-xl overflow-hidden"
              style={{ borderColor: cardBorder }}
            >
              <button
                type="button"
                data-ocid="store.currency.toggle"
                className="px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5"
                style={{
                  background:
                    currency === "INR"
                      ? "linear-gradient(135deg, #D4AF37, #F0D060)"
                      : "transparent",
                  color: currency === "INR" ? "#0a0a0a" : mutedColor,
                }}
                onClick={() => setCurrency("INR")}
              >
                🇮🇳 ₹ INR
              </button>
              <button
                type="button"
                data-ocid="store.currency.toggle"
                className="px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5"
                style={{
                  background:
                    currency === "USD"
                      ? "linear-gradient(135deg, #D4AF37, #F0D060)"
                      : "transparent",
                  color: currency === "USD" ? "#0a0a0a" : mutedColor,
                  borderLeft: `1px solid ${cardBorder}`,
                }}
                onClick={() => setCurrency("USD")}
              >
                🌍 $ USD
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products grid */}
      <div className="max-w-7xl mx-auto">
        {activeTab === "audiobooks" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {audiobooks.map((book, i) => (
              <AudiobookCard
                key={book.id}
                book={book}
                index={i + 1}
                currency={currency}
                isDark={isDark}
                cardBg={cardBg}
                cardBorder={cardBorder}
                fg={fg}
                mutedColor={mutedColor}
                onBuyNow={() => handleBuyNow(book)}
                onPreview={() => setPreviewBook(book)}
                audioFileUrl={audioUrlMap[book.id]}
              />
            ))}
          </div>
        )}
        {activeTab === "merch" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {merchItems.map((item, i) => (
              <MerchCard
                key={item.id}
                item={item}
                index={i + 1}
                currency={currency}
                isDark={isDark}
                cardBg={cardBg}
                cardBorder={cardBorder}
                fg={fg}
                mutedColor={mutedColor}
                isAdded={addedIds.has(item.id)}
                onAdd={() => handleAddMerch(item)}
                isFreeShipping={freeShippingMap[item.id] ?? false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewBook} onOpenChange={() => setPreviewBook(null)}>
        <DialogContent
          className="max-w-lg"
          style={{
            background: isDark ? "#111" : "#fff",
            border: "1px solid rgba(212,175,55,0.3)",
            color: fg,
          }}
        >
          {previewBook && (
            <>
              <DialogHeader>
                <div className="text-5xl mb-3 text-center">
                  {previewBook.coverEmoji}
                </div>
                <DialogTitle
                  style={{
                    fontFamily: "Playfair Display, serif",
                    color: "#D4AF37",
                    fontSize: "1.5rem",
                  }}
                >
                  {previewBook.name}
                </DialogTitle>
                <DialogDescription style={{ color: mutedColor }}>
                  {previewBook.duration} · Narrated by {previewBook.narrator}
                </DialogDescription>
              </DialogHeader>
              <p
                className="mt-4 text-sm leading-relaxed"
                style={{ color: isDark ? "#ccc" : "#444" }}
              >
                {previewBook.description}
              </p>
              {audioUrlMap[previewBook.id] && (
                <div className="mt-4">
                  {/* biome-ignore lint/a11y/useMediaCaption: audio preview player */}
                  <audio
                    controls
                    src={audioUrlMap[previewBook.id]}
                    style={{ width: "100%", height: 32 }}
                  />
                </div>
              )}
              <div className="flex items-center justify-between mt-6">
                <span
                  className="text-2xl font-bold"
                  style={{ color: "#D4AF37" }}
                >
                  {currency === "INR"
                    ? `₹${previewBook.price}`
                    : `$${previewBook.priceUSD}`}
                </span>
                <Button
                  data-ocid="store.audiobook.primary_button"
                  onClick={() => {
                    handleBuyNow(previewBook);
                    setPreviewBook(null);
                  }}
                  style={{
                    background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                    color: "#0a0a0a",
                    fontWeight: 700,
                  }}
                >
                  Buy Now
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AudiobookCard({
  book,
  index,
  currency,
  isDark,
  cardBg,
  cardBorder,
  fg,
  mutedColor,
  onBuyNow,
  onPreview,
  audioFileUrl,
}: {
  book: Audiobook;
  index: number;
  currency: Currency;
  isDark: boolean;
  cardBg: string;
  cardBorder: string;
  fg: string;
  mutedColor: string;
  onBuyNow: () => void;
  onPreview: () => void;
  audioFileUrl?: string;
}) {
  return (
    <div
      data-ocid={`store.audiobook.item.${index}`}
      className="rounded-2xl p-6 flex flex-col gap-4 transition-transform duration-200 hover:-translate-y-1"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        color: fg,
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="text-6xl text-center py-4">{book.coverEmoji}</div>
      <div>
        <h3
          className="text-xl font-bold mb-1"
          style={{
            fontFamily: "Playfair Display, serif",
            color: isDark ? "#f0ead6" : "#1a1a1a",
          }}
        >
          {book.name}
        </h3>
        <p className="text-xs mb-1" style={{ color: mutedColor }}>
          🎤 {book.narrator}
        </p>
        <p className="text-xs" style={{ color: mutedColor }}>
          ⏱️ {book.duration}
        </p>
      </div>
      {audioFileUrl && (
        <div>
          <p
            className="text-xs font-semibold mb-1"
            style={{ color: mutedColor }}
          >
            🎧 Preview Sample
          </p>
          {/* biome-ignore lint/a11y/useMediaCaption: audio preview player */}
          <audio
            controls
            src={audioFileUrl}
            style={{ width: "100%", height: 32 }}
          />
        </div>
      )}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-xl font-bold" style={{ color: "#D4AF37" }}>
          {currency === "INR" ? `₹${book.price}` : `$${book.priceUSD}`}
        </span>
        <Badge
          variant="outline"
          className="text-xs"
          style={{ borderColor: "rgba(212,175,55,0.3)", color: mutedColor }}
        >
          Audiobook
        </Badge>
      </div>
      <div className="flex gap-2">
        <Button
          data-ocid={`store.audiobook.secondary_button.${index}`}
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          style={{ borderColor: "rgba(212,175,55,0.3)", color: "#D4AF37" }}
          onClick={onPreview}
        >
          Preview
        </Button>
        <Button
          data-ocid={`store.audiobook.primary_button.${index}`}
          size="sm"
          className="flex-1 text-xs font-bold"
          style={{
            background: "linear-gradient(135deg, #D4AF37, #F0D060)",
            color: "#0a0a0a",
          }}
          onClick={onBuyNow}
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}

function MerchCard({
  item,
  index,
  currency,
  isDark,
  cardBg,
  cardBorder,
  fg,
  mutedColor,
  isAdded,
  onAdd,
  isFreeShipping,
}: {
  item: Merch;
  index: number;
  currency: Currency;
  isDark: boolean;
  cardBg: string;
  cardBorder: string;
  fg: string;
  mutedColor: string;
  isAdded: boolean;
  onAdd: () => void;
  isFreeShipping?: boolean;
}) {
  return (
    <div
      data-ocid={`store.merch.item.${index}`}
      className="rounded-2xl p-6 flex flex-col gap-4 transition-transform duration-200 hover:-translate-y-1"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        color: fg,
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="text-5xl text-center py-3">{item.coverEmoji}</div>
      <div>
        <h3
          className="text-lg font-bold mb-1"
          style={{
            fontFamily: "Playfair Display, serif",
            color: isDark ? "#f0ead6" : "#1a1a1a",
          }}
        >
          {item.name}
        </h3>
        <Badge
          variant="outline"
          className="text-xs mb-2"
          style={{ borderColor: "rgba(212,175,55,0.3)", color: mutedColor }}
        >
          {item.category}
        </Badge>
        {isFreeShipping && (
          <div className="mt-1">
            <span
              className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(34,197,94,0.12)",
                color: "#22C55E",
                border: "1px solid rgba(34,197,94,0.25)",
              }}
            >
              📦 Free Shipping
            </span>
          </div>
        )}
        <p
          className="text-xs mt-2 leading-relaxed"
          style={{ color: mutedColor }}
        >
          {item.description.slice(0, 90)}…
        </p>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-xl font-bold" style={{ color: "#D4AF37" }}>
          {currency === "INR" ? `₹${item.price}` : `$${item.priceUSD}`}
        </span>
      </div>
      <Button
        data-ocid={`store.merch.primary_button.${index}`}
        size="sm"
        className="font-bold text-xs w-full"
        style={{
          background: isAdded
            ? "#22c55e"
            : "linear-gradient(135deg, #D4AF37, #F0D060)",
          color: "#0a0a0a",
        }}
        onClick={onAdd}
      >
        {isAdded ? "Added ✓" : "Add to Cart"}
      </Button>
    </div>
  );
}
