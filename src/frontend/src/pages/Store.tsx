import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  ColorVariantImages,
  ProductImages,
} from "../admin/AdminStoreMerch";
import type { Audiobook, MerchItem } from "../backend.d";
import { ZoomImage } from "../components/ZoomImage";
import {
  AUDIOBOOK_PAYMENT_LINKS,
  MERCH_PAYMENT_LINKS,
  openRazorpayCheckout,
} from "../config/razorpayLinks";
import { AUDIOBOOKS, MERCH_ITEMS } from "../data/seedStore";
import { useActor } from "../hooks/useActor";
import { useSEO } from "../hooks/useSEO";
import { addToCart } from "../utils/cart";

type Currency = "INR" | "USD";

interface Props {
  isDark: boolean;
}

interface ColorVariant {
  name: string;
  hex: string;
  stock: number;
}

const SEED_AUDIOBOOKS: Audiobook[] = AUDIOBOOKS.map((a) => ({
  id: a.id,
  name: a.name,
  description: a.description,
  coverEmoji: a.coverEmoji,
  duration: a.duration,
  narrator: a.narrator,
  isActive: true,
  razorpayUrlINR: "",
  razorpayUrlUSD: "",
  priceINR: BigInt(Math.round(a.price * 100)),
  priceUSD: BigInt(Math.round(a.priceUSD * 100)),
}));

const SEED_MERCH: MerchItem[] = MERCH_ITEMS.map((m) => ({
  id: m.id,
  name: m.name,
  description: m.description,
  coverEmoji: m.coverEmoji,
  category: m.category,
  isActive: true,
  razorpayUrl: "",
  priceINR: BigInt(Math.round(m.price * 100)),
  priceUSD: BigInt(Math.round(m.priceUSD * 100)),
}));

const SIZE_CHART = [
  {
    size: "XS",
    chest: '32–33"',
    waist: '24–25"',
    hips: '34–35"',
    length: '26"',
  },
  {
    size: "S",
    chest: '34–35"',
    waist: '26–27"',
    hips: '36–37"',
    length: '27"',
  },
  {
    size: "M",
    chest: '36–37"',
    waist: '28–29"',
    hips: '38–39"',
    length: '28"',
  },
  {
    size: "L",
    chest: '38–40"',
    waist: '30–32"',
    hips: '40–42"',
    length: '29"',
  },
  {
    size: "XL",
    chest: '41–43"',
    waist: '33–35"',
    hips: '43–45"',
    length: '30"',
  },
  {
    size: "XXL",
    chest: '44–46"',
    waist: '36–38"',
    hips: '46–48"',
    length: '31"',
  },
];

export default function Store({ isDark }: Props) {
  const { actor } = useActor();
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [merch, setMerch] = useState<MerchItem[]>([]);
  const [sizeStockMap, setSizeStockMap] = useState<
    Record<string, Record<string, number>>
  >({});
  const [colorStockMap, setColorStockMap] = useState<
    Record<string, ColorVariant[]>
  >({});
  const [colorImagesMap, setColorImagesMap] = useState<
    Record<string, ColorVariantImages[]>
  >({});
  const [productImagesMap, setProductImagesMap] = useState<
    Record<string, ProductImages>
  >({});
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<Currency>("INR");
  const [activeTab, setActiveTab] = useState<"audiobooks" | "merch">(
    "audiobooks",
  );
  const [detailItem, setDetailItem] = useState<MerchItem | null>(null);

  useSEO({
    title: "Store \u2014 Mystoryova",
    description: "Shop audiobooks and exclusive merchandise by O. Chiddarwar.",
  });

  useEffect(() => {
    if (!actor) return;
    const loadProducts = async () => {
      const [abResult, mResult] = await Promise.allSettled([
        actor.getAudiobooks(),
        actor.getMerchItems(),
      ]);

      if (abResult.status === "fulfilled") {
        setAudiobooks(
          abResult.value.length > 0 ? abResult.value : SEED_AUDIOBOOKS,
        );
      } else {
        setAudiobooks(SEED_AUDIOBOOKS);
      }

      if (mResult.status === "fulfilled") {
        setMerch(mResult.value.length > 0 ? mResult.value : SEED_MERCH);
      } else {
        setMerch(SEED_MERCH);
      }

      try {
        const settings = await actor.getAllSettings();
        const ssMap: Record<string, Record<string, number>> = {};
        const csMap: Record<string, ColorVariant[]> = {};
        const ciMap: Record<string, ColorVariantImages[]> = {};
        const piMap: Record<string, ProductImages> = {};
        for (const s of settings) {
          if (s.key.startsWith("sizeStock_")) {
            const id = s.key.replace("sizeStock_", "");
            try {
              ssMap[id] = JSON.parse(s.value);
            } catch {
              /* ignore */
            }
          } else if (s.key.startsWith("colorStock_")) {
            const id = s.key.replace("colorStock_", "");
            try {
              const parsed = JSON.parse(s.value);
              if (Array.isArray(parsed) && parsed.length > 0)
                csMap[id] = parsed;
            } catch {
              /* ignore */
            }
          } else if (s.key.startsWith("colorImages_")) {
            const id = s.key.replace("colorImages_", "");
            try {
              const parsed = JSON.parse(s.value);
              if (Array.isArray(parsed) && parsed.length > 0)
                ciMap[id] = parsed;
            } catch {
              /* ignore */
            }
          } else if (s.key.startsWith("colorImg_")) {
            const withoutPrefix = s.key.replace("colorImg_", "");
            const lastUnderscore = withoutPrefix.lastIndexOf("_");
            const id = withoutPrefix.substring(0, lastUnderscore);
            const idx = Number.parseInt(
              withoutPrefix.substring(lastUnderscore + 1),
              10,
            );
            if (!Number.isNaN(idx) && id) {
              if (!ciMap[id]) ciMap[id] = [];
              try {
                ciMap[id][idx] = JSON.parse(s.value);
              } catch {
                /* ignore */
              }
            }
          } else if (s.key.startsWith("productImages_")) {
            const id = s.key.replace("productImages_", "");
            try {
              piMap[id] = JSON.parse(s.value);
            } catch {
              /* ignore */
            }
          }
        }
        setSizeStockMap(ssMap);
        setColorStockMap(csMap);
        setColorImagesMap(ciMap);
        setProductImagesMap(piMap);
      } catch {
        // Settings failed — products still show
      }

      setLoading(false);
    };
    loadProducts();
  }, [actor]);

  const fg = isDark ? "#f0ead6" : "#1a1a1a";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)";
  const cardBorder = "rgba(212,175,55,0.15)";
  const mutedColor = isDark ? "#888" : "#666";

  function handleBuyAudiobook(ab: Audiobook) {
    const link = AUDIOBOOK_PAYMENT_LINKS.find((l) => l.productId === ab.id);
    if (!link) {
      toast.error("Payment link not configured for this audiobook.");
      return;
    }
    const amount =
      currency === "INR" ? link.price : Math.round(link.priceUSD * 100);
    openRazorpayCheckout({
      name: ab.name,
      description: `Audiobook: ${ab.name}`,
      amount,
      currency,
      onSuccess: () => {
        toast.success("Purchase successful! Check your email.");
      },
    });
  }

  function handleAddToCart(
    item: MerchItem,
    selectedSize?: string,
    selectedColor?: string,
  ) {
    const link = MERCH_PAYMENT_LINKS.find((l) => l.productId === item.id);
    const price =
      currency === "INR"
        ? link
          ? link.price / 100
          : Number(item.priceINR) / 100
        : link
          ? link.priceUSD
          : Number(item.priceUSD) / 100;
    const name = `${item.name}${selectedSize ? ` (${selectedSize})` : ""}${selectedColor ? ` — ${selectedColor}` : ""}`;
    addToCart({
      id: item.id,
      name,
      price,
      quantity: 1,
      type: "merch",
      currency,
      selectedColor,
    });
    window.dispatchEvent(new Event("cart-update"));
    toast.success(`${name} added to cart!`);
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: isDark ? "#0a0a0a" : "#f8f4f0" }}
    >
      {/* Header */}
      <div
        className="relative py-20 px-4 text-center overflow-hidden"
        style={{ background: "#0a0a0a" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10">
          <div
            className="text-xs tracking-[0.3em] uppercase mb-3"
            style={{ color: "#D4AF37" }}
          >
            Official Store
          </div>
          <h1
            className="text-4xl sm:text-5xl font-bold mb-3"
            style={{
              fontFamily: "Playfair Display, serif",
              background:
                "linear-gradient(135deg, #ffffff 30%, #D4AF37 70%, #F0D060 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Mystoryova Store
          </h1>
          <p className="text-sm" style={{ color: "rgba(240,234,214,0.6)" }}>
            Audiobooks & exclusive merchandise by O. Chiddarwar
          </p>

          {/* Currency toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "rgba(212,175,55,0.6)" }}
            >
              Currency
            </span>
            <div
              className="flex gap-0 border rounded-xl overflow-hidden"
              style={{ borderColor: "rgba(212,175,55,0.3)" }}
            >
              <button
                type="button"
                data-ocid="store.currency.toggle"
                className="px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200"
                style={{
                  background:
                    currency === "INR"
                      ? "linear-gradient(135deg, #D4AF37, #F0D060)"
                      : "transparent",
                  color:
                    currency === "INR" ? "#0a0a0a" : "rgba(212,175,55,0.7)",
                }}
                onClick={() => setCurrency("INR")}
              >
                🇮🇳 ₹ INR
              </button>
              <button
                type="button"
                data-ocid="store.currency.toggle"
                className="px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200"
                style={{
                  background:
                    currency === "USD"
                      ? "linear-gradient(135deg, #D4AF37, #F0D060)"
                      : "transparent",
                  color:
                    currency === "USD" ? "#0a0a0a" : "rgba(212,175,55,0.7)",
                  borderLeft: "1px solid rgba(212,175,55,0.3)",
                }}
                onClick={() => setCurrency("USD")}
              >
                🌍 $ USD
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex gap-2 mb-8">
          {(["audiobooks", "merch"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              data-ocid={`store.${tab}.tab`}
              onClick={() => setActiveTab(tab)}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-200"
              style={{
                background:
                  activeTab === tab
                    ? "linear-gradient(135deg, #D4AF37, #F0D060)"
                    : "transparent",
                color: activeTab === tab ? "#0a0a0a" : isDark ? "#888" : "#666",
                border: `1px solid ${
                  activeTab === tab ? "#D4AF37" : "rgba(212,175,55,0.2)"
                }`,
              }}
            >
              {tab === "audiobooks" ? "🎧 Audiobooks" : "👕 Merchandise"}
            </button>
          ))}
        </div>

        {/* Audiobooks */}
        {activeTab === "audiobooks" && (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }, (_, i) => `sk-${i}`).map((key) => (
                  <div
                    key={key}
                    className="rounded-xl h-64 skeleton-shimmer"
                    style={{ border: "1px solid rgba(212,175,55,0.1)" }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {audiobooks.map((ab) => {
                  const link = AUDIOBOOK_PAYMENT_LINKS.find(
                    (l) => l.productId === ab.id,
                  );
                  const displayPrice =
                    currency === "INR"
                      ? link
                        ? `₹${(link.price / 100).toFixed(0)}`
                        : `₹${(Number(ab.priceINR) / 100).toFixed(0)}`
                      : link
                        ? `$${link.priceUSD.toFixed(2)}`
                        : `$${(Number(ab.priceUSD) / 100).toFixed(2)}`;
                  return (
                    <AudiobookCard
                      key={ab.id}
                      ab={ab}
                      fg={fg}
                      cardBg={cardBg}
                      cardBorder={cardBorder}
                      mutedColor={mutedColor}
                      displayPrice={displayPrice}
                      onBuy={() => handleBuyAudiobook(ab)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Merch */}
        {activeTab === "merch" && (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }, (_, i) => `sk-${i}`).map((key) => (
                  <div
                    key={key}
                    className="rounded-xl h-64 skeleton-shimmer"
                    style={{ border: "1px solid rgba(212,175,55,0.1)" }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {merch.map((item) => {
                  const link = MERCH_PAYMENT_LINKS.find(
                    (l) => l.productId === item.id,
                  );
                  const displayPrice =
                    currency === "INR"
                      ? link
                        ? `₹${(link.price / 100).toFixed(0)}`
                        : `₹${(Number(item.priceINR) / 100).toFixed(0)}`
                      : link
                        ? `$${link.priceUSD.toFixed(2)}`
                        : `$${(Number(item.priceUSD) / 100).toFixed(2)}`;
                  return (
                    <MerchCard
                      key={item.id}
                      item={item}
                      isDark={isDark}
                      fg={fg}
                      cardBg={cardBg}
                      cardBorder={cardBorder}
                      mutedColor={mutedColor}
                      displayPrice={displayPrice}
                      sizeStock={sizeStockMap[item.id]}
                      colorStock={colorStockMap[item.id]}
                      colorImages={colorImagesMap[item.id]}
                      productImages={productImagesMap[item.id]}
                      onAddToCart={(size) => handleAddToCart(item, size)}
                      onViewDetails={() => setDetailItem(item)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Merch Detail Modal */}
      {detailItem && (
        <MerchDetailModal
          item={detailItem}
          sizeStock={sizeStockMap[detailItem.id]}
          colorStock={colorStockMap[detailItem.id]}
          colorImages={colorImagesMap[detailItem.id]}
          productImages={productImagesMap[detailItem.id]}
          displayPrice={(() => {
            const link = MERCH_PAYMENT_LINKS.find(
              (l) => l.productId === detailItem.id,
            );
            return currency === "INR"
              ? link
                ? `₹${(link.price / 100).toFixed(0)}`
                : `₹${(Number(detailItem.priceINR) / 100).toFixed(0)}`
              : link
                ? `$${link.priceUSD.toFixed(2)}`
                : `$${(Number(detailItem.priceUSD) / 100).toFixed(2)}`;
          })()}
          onClose={() => setDetailItem(null)}
          onAddToCart={(size, color) => {
            handleAddToCart(detailItem, size, color);
            setDetailItem(null);
          }}
        />
      )}
    </div>
  );
}

// ─── AudiobookCard ─────────────────────────────────────────────────────────────

interface AudiobookCardProps {
  ab: Audiobook;
  fg: string;
  cardBg: string;
  cardBorder: string;
  mutedColor: string;
  displayPrice: string;
  onBuy: () => void;
}

function AudiobookCard({
  ab,
  fg,
  cardBg,
  cardBorder,
  mutedColor,
  displayPrice,
  onBuy,
}: AudiobookCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: cardBg,
        border: hovered
          ? "1px solid rgba(212,175,55,0.5)"
          : `1px solid ${cardBorder}`,
        boxShadow: hovered
          ? "0 12px 40px rgba(212,175,55,0.2)"
          : "0 4px 24px rgba(0,0,0,0.3)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition:
          "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="h-48 relative overflow-hidden flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #1a0e2e, #2d1a4a)" }}
      >
        <div className="text-center">
          <div style={{ fontSize: "3rem" }}>{ab.coverEmoji || "🎧"}</div>
          <div
            className="text-xs mt-2 px-4"
            style={{ color: "rgba(212,175,55,0.7)" }}
          >
            {ab.name}
          </div>
        </div>
      </div>
      <div className="p-5">
        <h3
          className="font-semibold mb-1 leading-tight"
          style={{ fontFamily: "Playfair Display, serif", color: fg }}
        >
          {ab.name}
        </h3>
        <p className="text-xs mb-3 line-clamp-2" style={{ color: mutedColor }}>
          {ab.description}
        </p>
        {ab.narrator && (
          <p className="text-xs mb-3" style={{ color: "#D4AF37" }}>
            Narrated by {ab.narrator}
          </p>
        )}
        {ab.duration && (
          <p className="text-xs mb-3" style={{ color: mutedColor }}>
            {ab.duration}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg font-bold" style={{ color: "#D4AF37" }}>
            {displayPrice}
          </span>
          <button
            type="button"
            data-ocid="store.audiobook.primary_button"
            onClick={onBuy}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #F0D060)",
              color: "#0a0a0a",
            }}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MerchCard ────────────────────────────────────────────────────────────────

interface MerchCardProps {
  item: MerchItem;
  isDark: boolean;
  fg: string;
  cardBg: string;
  cardBorder: string;
  mutedColor: string;
  displayPrice: string;
  sizeStock?: Record<string, number>;
  colorStock?: ColorVariant[];
  colorImages?: ColorVariantImages[];
  productImages?: ProductImages;
  onAddToCart: (size?: string) => void;
  onViewDetails: () => void;
}

function MerchCard({
  item,
  isDark,
  fg,
  cardBg,
  cardBorder,
  mutedColor,
  displayPrice,
  sizeStock,
  colorStock,
  colorImages,
  productImages,
  onAddToCart,
  onViewDetails,
}: MerchCardProps) {
  const [hovered, setHovered] = useState(false);
  const hasColors = colorStock && colorStock.length > 0;

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        background: cardBg,
        border: hovered
          ? "1px solid rgba(212,175,55,0.5)"
          : `1px solid ${cardBorder}`,
        boxShadow: hovered
          ? "0 12px 40px rgba(212,175,55,0.2)"
          : "0 4px 24px rgba(0,0,0,0.3)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition:
          "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="h-48 relative overflow-hidden flex items-center justify-center"
        style={{
          background: isDark ? "rgba(212,175,55,0.06)" : "rgba(212,175,55,0.1)",
        }}
      >
        {(() => {
          const thumbSrc =
            item.category === "Clothing" &&
            colorImages &&
            colorImages.length > 0
              ? colorImages[0].frontImage
              : item.category !== "Clothing" && productImages?.primaryImage
                ? productImages.primaryImage
                : item.coverEmoji &&
                    (item.coverEmoji.startsWith("data:") ||
                      item.coverEmoji.startsWith("http"))
                  ? item.coverEmoji
                  : null;
          return thumbSrc ? (
            <img
              src={thumbSrc}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <div style={{ fontSize: "3rem" }}>{item.coverEmoji || "👕"}</div>
              <div
                className="text-xs mt-2"
                style={{ color: "rgba(212,175,55,0.6)" }}
              >
                {item.name}
              </div>
            </div>
          );
        })()}
        {hasizes(item, sizeStock) && (
          <div
            className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(212,175,55,0.9)",
              color: "#0a0a0a",
              fontWeight: 700,
            }}
          >
            Sizes available
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            className="font-semibold leading-tight"
            style={{ fontFamily: "Playfair Display, serif", color: fg }}
          >
            {item.name}
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full shrink-0"
            style={{ background: "rgba(212,175,55,0.1)", color: "#D4AF37" }}
          >
            {item.category}
          </span>
        </div>
        <p className="text-xs mb-3 line-clamp-2" style={{ color: mutedColor }}>
          {item.description}
        </p>
        {hasColors && (
          <div className="flex items-center gap-1 mb-3">
            {colorStock.slice(0, 6).map((c) => (
              <span
                key={c.hex + c.name}
                title={c.name}
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: c.hex,
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              />
            ))}
            {colorStock.length > 6 && (
              <span style={{ color: "#666", fontSize: "0.7rem" }}>
                +{colorStock.length - 6}
              </span>
            )}
          </div>
        )}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold" style={{ color: "#D4AF37" }}>
              {displayPrice}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="store.merch.secondary_button"
              onClick={onViewDetails}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                color: "#0a0a0a",
              }}
            >
              View Details
            </button>
            {!hasizes(item, sizeStock) && !hasColors && (
              <button
                type="button"
                data-ocid="store.merch.primary_button"
                onClick={() => onAddToCart()}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  border: "1px solid rgba(212,175,55,0.5)",
                  color: "#D4AF37",
                  background: hovered ? "rgba(212,175,55,0.1)" : "transparent",
                }}
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function hasizes(item: MerchItem, sizeStock?: Record<string, number>): boolean {
  return (
    item.category === "Clothing" &&
    !!sizeStock &&
    Object.values(sizeStock).some((v) => v > 0)
  );
}

// ─── MerchDetailModal ─────────────────────────────────────────────────────────

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

interface MerchDetailModalProps {
  item: MerchItem;
  sizeStock?: Record<string, number>;
  colorStock?: ColorVariant[];
  colorImages?: ColorVariantImages[];
  productImages?: ProductImages;
  displayPrice: string;
  onClose: () => void;
  onAddToCart: (size?: string, color?: string) => void;
}

function MerchDetailModal({
  item,
  sizeStock,
  colorStock,
  colorImages,
  productImages,
  displayPrice,
  onClose,
  onAddToCart,
}: MerchDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showSizeChart, setShowSizeChart] = useState(false);

  const showSizes =
    item.category === "Clothing" &&
    sizeStock &&
    Object.values(sizeStock).some((v) => v > 0);
  const sizeRequired = !!showSizes;
  const colorRequired = !!(colorStock && colorStock.length > 0);
  const canAdd =
    (!sizeRequired || !!selectedSize) && (!colorRequired || !!selectedColor);

  const addLabel = (() => {
    if (selectedSize && selectedColor)
      return `Add to Cart — ${selectedSize} / ${selectedColor}`;
    if (selectedSize) return `Add to Cart — Size ${selectedSize}`;
    if (selectedColor) return `Add to Cart — ${selectedColor}`;
    return "Add to Cart";
  })();

  // Determine active image set
  const imageSet: Array<{ src: string; label: string }> = [];

  if (item.category === "Clothing" && colorImages && colorImages.length > 0) {
    // Find images for selected color
    const activeColorData = selectedColor
      ? colorImages.find((ci) => ci.colorName === selectedColor)
      : colorImages[0];
    if (activeColorData) {
      if (activeColorData.frontImage)
        imageSet.push({ src: activeColorData.frontImage, label: "Front" });
      if (activeColorData.backImage)
        imageSet.push({ src: activeColorData.backImage, label: "Back" });
      if (activeColorData.lifestyleImage)
        imageSet.push({
          src: activeColorData.lifestyleImage,
          label: "Lifestyle",
        });
    }
  } else if (item.category !== "Clothing" && productImages) {
    if (productImages.primaryImage)
      imageSet.push({ src: productImages.primaryImage, label: "Primary" });
    if (productImages.alternateImage)
      imageSet.push({ src: productImages.alternateImage, label: "Alternate" });
    if (productImages.lifestyleImage)
      imageSet.push({ src: productImages.lifestyleImage, label: "Lifestyle" });
  }

  // When color selection changes, reset to front image
  const handleColorSelect = (colorName: string) => {
    setSelectedColor(selectedColor === colorName ? null : colorName);
    setActiveImageIdx(0);
  };

  const clampedIdx = Math.min(activeImageIdx, Math.max(0, imageSet.length - 1));
  // activeImage reserved for future use
  const hasgallery = imageSet.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="presentation"
    >
      <div
        data-ocid="store.merch.modal"
        className="relative w-full max-w-lg rounded-2xl overflow-hidden my-auto"
        style={{
          background: "rgba(12,12,12,0.97)",
          border: "1px solid rgba(212,175,55,0.3)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        }}
      >
        {/* Close */}
        <button
          type="button"
          data-ocid="store.merch.close_button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full p-1.5 transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", color: "#888" }}
        >
          <X size={18} />
        </button>

        {/* Image Gallery or Cover Fallback */}
        {hasgallery ? (
          <div
            className="flex flex-col"
            style={{ background: "linear-gradient(135deg, #0a0a0a, #1a120a)" }}
          >
            {/* Main image with zoom */}
            <div
              className="relative"
              style={{ aspectRatio: "4/3", overflow: "hidden" }}
            >
              {imageSet.map((img, idx) => (
                <div
                  key={img.label}
                  className="absolute inset-0"
                  style={{
                    opacity: idx === clampedIdx ? 1 : 0,
                    transition: "opacity 0.3s ease",
                    pointerEvents: idx === clampedIdx ? "auto" : "none",
                  }}
                >
                  <ZoomImage
                    src={img.src}
                    alt={`${item.name} — ${img.label}`}
                    className="w-full h-full"
                  />
                </div>
              ))}
            </div>
            {/* Thumbnails */}
            {imageSet.length > 1 && (
              <div className="flex gap-2 p-3 justify-center">
                {imageSet.map((img, idx) => (
                  <button
                    key={img.label}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className="flex flex-col items-center gap-1 transition-all"
                    style={{
                      opacity: idx === clampedIdx ? 1 : 0.55,
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 8,
                        overflow: "hidden",
                        border:
                          idx === clampedIdx
                            ? "2px solid #D4AF37"
                            : "2px solid rgba(212,175,55,0.2)",
                        transition: "border-color 0.2s ease",
                      }}
                    >
                      <img
                        src={img.src}
                        alt={img.label}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "0.6rem",
                        color: idx === clampedIdx ? "#D4AF37" : "#555",
                      }}
                    >
                      {img.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Fallback cover */
          <div
            className="h-56 flex items-center justify-center relative"
            style={{ background: "linear-gradient(135deg, #0a0a0a, #1a120a)" }}
          >
            {item.coverEmoji &&
            (item.coverEmoji.startsWith("data:") ||
              item.coverEmoji.startsWith("http")) ? (
              <img
                src={item.coverEmoji}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <div style={{ fontSize: "5rem" }}>
                  {item.coverEmoji || "👕"}
                </div>
              </div>
            )}
            <div
              className="absolute bottom-0 left-0 right-0 h-16"
              style={{
                background:
                  "linear-gradient(to top, rgba(12,12,12,0.97), transparent)",
              }}
            />
          </div>
        )}

        <div className="p-6 flex flex-col gap-4">
          {/* Title & badge */}
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h2
                className="text-xl font-bold leading-tight"
                style={{
                  fontFamily: "Playfair Display, serif",
                  color: "#f0ead6",
                }}
              >
                {item.name}
              </h2>
              <span
                className="text-xs mt-1 inline-block px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(212,175,55,0.12)",
                  color: "#D4AF37",
                }}
              >
                {item.category}
              </span>
            </div>
            <span className="text-2xl font-bold" style={{ color: "#D4AF37" }}>
              {displayPrice}
            </span>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm leading-relaxed" style={{ color: "#aaa" }}>
              {item.description}
            </p>
          )}

          {/* Size Selector */}
          {showSizes && sizeStock && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-semibold tracking-wider uppercase"
                  style={{ color: "#888" }}
                >
                  Select Size
                </span>
                <button
                  type="button"
                  data-ocid="store.merch.secondary_button"
                  onClick={() => setShowSizeChart(true)}
                  className="text-xs underline transition-colors"
                  style={{ color: "#D4AF37" }}
                >
                  📏 Size Chart
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {SIZES.map((size) => {
                  const stock = sizeStock[size] ?? 0;
                  const isSelected = selectedSize === size;
                  const isDisabled = stock === 0;
                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setSelectedSize(isSelected ? null : size)}
                      className="flex flex-col items-center py-2 px-1 rounded-lg text-xs transition-all duration-200"
                      style={{
                        background: isSelected
                          ? "linear-gradient(135deg, #D4AF37, #F0D060)"
                          : isDisabled
                            ? "rgba(255,255,255,0.02)"
                            : "rgba(255,255,255,0.05)",
                        border: isSelected
                          ? "1px solid #D4AF37"
                          : isDisabled
                            ? "1px solid rgba(255,255,255,0.05)"
                            : "1px solid rgba(212,175,55,0.25)",
                        color: isSelected
                          ? "#0a0a0a"
                          : isDisabled
                            ? "#333"
                            : "#f0ead6",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        opacity: isDisabled ? 0.5 : 1,
                      }}
                    >
                      <span className="font-bold">{size}</span>
                      <span
                        className="text-[10px] mt-0.5"
                        style={{
                          color: isSelected
                            ? "#5a4000"
                            : isDisabled
                              ? "#333"
                              : "#666",
                        }}
                      >
                        {stock > 0 ? `${stock} left` : "Out"}
                      </span>
                    </button>
                  );
                })}
              </div>
              {sizeRequired && !selectedSize && (
                <p
                  className="text-xs"
                  style={{ color: "rgba(212,175,55,0.6)" }}
                >
                  Please select a size to continue.
                </p>
              )}
            </div>
          )}

          {/* Color Selector */}
          {colorRequired && colorStock && (
            <div className="flex flex-col gap-3">
              <span
                className="text-xs font-semibold tracking-wider uppercase"
                style={{ color: "#888" }}
              >
                Select Color
              </span>
              <div className="flex flex-wrap gap-3">
                {colorStock.map((c) => {
                  const isSelected = selectedColor === c.name;
                  const isDisabled = c.stock === 0;
                  return (
                    <button
                      key={c.hex + c.name}
                      type="button"
                      disabled={isDisabled}
                      title={`${c.name}${c.stock > 0 ? ` (${c.stock} left)` : " — Out of stock"}`}
                      onClick={() => handleColorSelect(c.name)}
                      className="relative transition-all duration-200"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: c.hex,
                        border: isSelected
                          ? "2px solid #D4AF37"
                          : "1px solid rgba(255,255,255,0.2)",
                        boxShadow: isSelected
                          ? "0 0 0 3px rgba(212,175,55,0.25)"
                          : "none",
                        opacity: isDisabled ? 0.35 : 1,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        outline: "none",
                      }}
                    />
                  );
                })}
              </div>
              {selectedColor ? (
                <p className="text-xs font-medium" style={{ color: "#D4AF37" }}>
                  {selectedColor}
                </p>
              ) : (
                <p
                  className="text-xs"
                  style={{ color: "rgba(212,175,55,0.6)" }}
                >
                  Select a color to continue.
                </p>
              )}
            </div>
          )}

          {/* Add to Cart */}
          <button
            type="button"
            data-ocid="store.merch.primary_button"
            disabled={!canAdd}
            onClick={() =>
              onAddToCart(selectedSize ?? undefined, selectedColor ?? undefined)
            }
            className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200"
            style={{
              background: canAdd
                ? "linear-gradient(135deg, #D4AF37, #F0D060)"
                : "rgba(212,175,55,0.15)",
              color: canAdd ? "#0a0a0a" : "#555",
              cursor: canAdd ? "pointer" : "not-allowed",
            }}
          >
            {addLabel}
          </button>
        </div>

        {/* Nested Size Chart Modal */}
        {showSizeChart && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.92)",
              backdropFilter: "blur(10px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSizeChart(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowSizeChart(false);
            }}
            role="presentation"
          >
            <div
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{
                background: "#0e0e0e",
                border: "1px solid rgba(212,175,55,0.3)",
              }}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid rgba(212,175,55,0.15)" }}
              >
                <h3
                  className="font-bold text-base"
                  style={{
                    fontFamily: "Playfair Display, serif",
                    color: "#D4AF37",
                  }}
                >
                  📏 Clothing Size Guide
                </h3>
                <button
                  type="button"
                  data-ocid="store.merch.close_button"
                  onClick={() => setShowSizeChart(false)}
                  className="rounded-full p-1.5"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "#888",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      style={{
                        background: "rgba(212,175,55,0.12)",
                        borderBottom: "1px solid rgba(212,175,55,0.2)",
                      }}
                    >
                      {["Size", "Chest", "Waist", "Hips", "Length"].map((h) => (
                        <th
                          key={h}
                          className="py-3 px-4 text-left text-xs uppercase tracking-wider"
                          style={{ color: "#D4AF37" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SIZE_CHART.map((row, idx) => (
                      <tr
                        key={row.size}
                        style={{
                          background:
                            idx % 2 === 0
                              ? "rgba(255,255,255,0.02)"
                              : "rgba(212,175,55,0.03)",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <td
                          className="py-2.5 px-4 font-bold"
                          style={{ color: "#D4AF37" }}
                        >
                          {row.size}
                        </td>
                        <td
                          className="py-2.5 px-4"
                          style={{ color: "#f0ead6" }}
                        >
                          {row.chest}
                        </td>
                        <td
                          className="py-2.5 px-4"
                          style={{ color: "#f0ead6" }}
                        >
                          {row.waist}
                        </td>
                        <td
                          className="py-2.5 px-4"
                          style={{ color: "#f0ead6" }}
                        >
                          {row.hips}
                        </td>
                        <td
                          className="py-2.5 px-4"
                          style={{ color: "#f0ead6" }}
                        >
                          {row.length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3">
                <p className="text-xs" style={{ color: "#555" }}>
                  All measurements are in inches. For a relaxed fit, size up.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
