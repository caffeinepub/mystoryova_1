import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSEO } from "../hooks/useSEO";
import {
  type CartItem,
  clearCart,
  getCart,
  removeFromCart,
  updateQuantity,
} from "../utils/cart";

interface Props {
  isDark: boolean;
}

export default function Cart({ isDark }: Props) {
  const [allItems, setAllItems] = useState<CartItem[]>([]);

  useSEO({
    title: "Cart — Mystoryova",
    description: "Your shopping cart at Mystoryova.",
  });

  useEffect(() => {
    const refresh = () => setAllItems(getCart());
    refresh();
    window.addEventListener("cart-update", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("cart-update", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Audiobooks are purchased directly via Buy Now — filter them out
  const items = allItems.filter((i) => i.type !== "audiobook");

  const fg = isDark ? "#f0ead6" : "#1a1a1a";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const cardBorder = isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.3)";
  const mutedColor = isDark ? "#888" : "#666";

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <div
      className="min-h-screen py-16 px-4"
      style={{ backgroundColor: isDark ? "#0a0a0a" : "#f8f4f0", color: fg }}
    >
      <div className="max-w-6xl mx-auto">
        <h1
          className="text-4xl md:text-5xl font-bold mb-10"
          style={{ fontFamily: "Playfair Display, serif", color: "#D4AF37" }}
        >
          Your Cart
        </h1>

        {items.length === 0 ? (
          <div data-ocid="cart.empty_state" className="text-center py-24">
            <div className="text-8xl mb-6">🛒</div>
            <p
              className="text-xl mb-2"
              style={{
                fontFamily: "Playfair Display, serif",
                color: mutedColor,
              }}
            >
              Your cart is empty
            </p>
            <p className="text-sm mb-8" style={{ color: mutedColor }}>
              Add merchandise from the store, or use{" "}
              <Link to="/store" style={{ color: "#D4AF37" }}>
                Buy Now
              </Link>{" "}
              on audiobooks for instant purchase.
            </p>
            <Button
              data-ocid="cart.primary_button"
              asChild
              style={{
                background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                color: "#0a0a0a",
                fontWeight: 700,
              }}
            >
              <Link to="/store">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Items */}
            <div className="flex-1 flex flex-col gap-4">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  data-ocid={`cart.item.${i + 1}`}
                  className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-semibold"
                        style={{
                          fontFamily: "Playfair Display, serif",
                          color: fg,
                        }}
                      >
                        {item.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: "rgba(212,175,55,0.3)",
                          color: "#D4AF37",
                        }}
                      >
                        Merch
                      </Badge>
                    </div>
                    <p className="text-sm" style={{ color: "#D4AF37" }}>
                      ₹{item.price} each
                    </p>
                  </div>

                  {/* Qty stepper */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-ocid={`cart.toggle.${i + 1}`}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all"
                      style={{
                        border: `1px solid ${cardBorder}`,
                        color: "#D4AF37",
                        background: "transparent",
                      }}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span
                      className="w-6 text-center font-semibold"
                      style={{ color: fg }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      data-ocid={`cart.toggle.${i + 1}`}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all"
                      style={{
                        border: `1px solid ${cardBorder}`,
                        color: "#D4AF37",
                        background: "transparent",
                      }}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <p
                    className="text-lg font-bold min-w-[70px] text-right"
                    style={{ color: "#D4AF37" }}
                  >
                    ₹{item.price * item.quantity}
                  </p>

                  <button
                    type="button"
                    data-ocid={`cart.delete_button.${i + 1}`}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all hover:bg-red-500/20"
                    style={{
                      border: "1px solid rgba(255,100,100,0.3)",
                      color: "#ff6b6b",
                    }}
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                data-ocid="cart.delete_button"
                className="text-sm self-start mt-2 transition-colors hover:text-red-400"
                style={{ color: mutedColor, textDecoration: "underline" }}
                onClick={clearCart}
              >
                Clear Cart
              </button>
            </div>

            {/* Summary */}
            <div
              className="lg:w-80 rounded-2xl p-6 h-fit"
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                backdropFilter: "blur(12px)",
              }}
              data-ocid="cart.panel"
            >
              <h2
                className="text-xl font-bold mb-5"
                style={{
                  fontFamily: "Playfair Display, serif",
                  color: "#D4AF37",
                }}
              >
                Order Summary
              </h2>

              <div
                className="flex justify-between mb-3 text-sm"
                style={{ color: mutedColor }}
              >
                <span>Items ({items.reduce((s, c) => s + c.quantity, 0)})</span>
                <span style={{ color: fg }}>₹{subtotal}</span>
              </div>

              <Separator className="my-4" style={{ background: cardBorder }} />

              <div className="flex justify-between font-bold text-lg mb-4">
                <span style={{ color: fg }}>Total</span>
                <span style={{ color: "#D4AF37" }}>₹{subtotal}</span>
              </div>

              <p
                className="text-xs mb-6 leading-relaxed"
                style={{ color: mutedColor }}
              >
                📦 Merchandise fulfilled via Printrove (3–7 business days
                delivery after dispatch).
              </p>

              <Button
                data-ocid="cart.submit_button"
                asChild
                className="w-full font-bold"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                  color: "#0a0a0a",
                }}
              >
                <Link to="/checkout">Proceed to Checkout →</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
