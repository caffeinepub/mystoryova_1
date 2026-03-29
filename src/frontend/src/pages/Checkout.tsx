import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Order, OrderItem } from "../backend.d";
import {
  MERCH_PAYMENT_LINKS,
  openRazorpayCheckout,
} from "../config/razorpayLinks";
import { useActor } from "../hooks/useActor";
import { useSEO } from "../hooks/useSEO";
import { type CartItem, getCart } from "../utils/cart";

type Currency = "INR" | "USD";

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

interface Props {
  isDark: boolean;
}

export default function Checkout({ isDark }: Props) {
  const { actor } = useActor();
  useSEO({
    title: "Checkout — Mystoryova",
    description: "Complete your order at Mystoryova.",
  });
  const [allItems, setAllItems] = useState<CartItem[]>([]);
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());
  const [currency, setCurrency] = useState<Currency>("INR");
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
  });
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponApplied, setCouponApplied] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [region, setRegion] = useState<"india" | "international">("india");
  const [shippingINR, setShippingINR] = useState(0);
  const [shippingIntl, setShippingIntl] = useState(0);
  // Map of itemId -> true if free shipping
  const [freeShippingMap, setFreeShippingMap] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const cart = getCart();
    setAllItems(cart);
    const firstMerch = cart.find((i) => i.type === "merch");
    if (firstMerch?.currency) {
      const cur = firstMerch.currency as Currency;
      setCurrency(cur);
      if (cur === "USD") setRegion("international");
    }
  }, []);

  useEffect(() => {
    if (!actor) return;
    actor.getAllSettings().then((all) => {
      const map: Record<string, string> = {};
      for (const s of all) map[s.key] = s.value;
      setShippingINR(Number(map.shippingINR) || 0);
      setShippingIntl(Number(map.shippingInternational) || 0);
      const freeMap: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(map)) {
        if (k.startsWith("shippingFree_")) {
          freeMap[k.replace("shippingFree_", "")] = v === "true";
        }
      }
      setFreeShippingMap(freeMap);
    });
  }, [actor]);

  const fg = isDark ? "#f0ead6" : "#1a1a1a";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const cardBorder = isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.3)";
  const mutedColor = isDark ? "#888" : "#666";
  const inputStyle = {
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
    border: `1px solid ${cardBorder}`,
    color: fg,
  };

  const items = allItems.filter((i) => i.type === "merch");
  const hasFilteredAudiobooks = allItems.some((i) => i.type === "audiobook");
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const discountedTotal = Math.max(0, subtotal - discount);

  function getItemShipping(item: CartItem): number {
    if (freeShippingMap[item.id]) return 0;
    return region === "india" ? shippingINR : shippingIntl;
  }

  function getDisplayPrice(item: CartItem): string {
    return currency === "INR"
      ? `₹${item.price * item.quantity}`
      : `$${(item.price * item.quantity).toFixed(2)}`;
  }

  // Total shipping across all items
  const totalShipping = items.reduce(
    (sum, item) => sum + getItemShipping(item),
    0,
  );
  const totalWithShipping = Math.max(0, discountedTotal + totalShipping);

  async function applyCoupon() {
    if (!actor || !couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponMsg("");
    try {
      const coupon = await actor.validateCoupon(
        couponCode.trim().toUpperCase(),
      );
      if (!coupon) {
        setCouponMsg("Invalid or expired coupon.");
        setDiscount(0);
        setApplyingCoupon(false);
        return;
      }
      let discountAmt = 0;
      if (coupon.discountType === "percentage") {
        discountAmt = (subtotal * (Number(coupon.discountValue) / 100)) / 100;
      } else {
        discountAmt = Number(coupon.discountValue) / 100;
      }
      setDiscount(discountAmt);
      setCouponApplied(couponCode.trim().toUpperCase());
      setCouponMsg(
        `Coupon applied! You save ${currency === "INR" ? "₹" : "$"}${discountAmt.toFixed(2)}`,
      );
    } catch {
      setCouponMsg("Failed to validate coupon.");
    }
    setApplyingCoupon(false);
  }

  async function handlePay(item: CartItem) {
    if (!customer.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!customer.email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    const link = MERCH_PAYMENT_LINKS.find((p) => p.productId === item.id);
    if (!link) return;
    const itemAmt =
      currency === "INR"
        ? link.price * item.quantity
        : link.priceUSD * item.quantity;
    const itemShipping = getItemShipping(item);
    const shippingAmt =
      region === "india" ? itemShipping * 100 : Math.round(itemShipping * 100);
    const amount = itemAmt + shippingAmt;

    openRazorpayCheckout({
      name: link.name,
      description: `${item.name} × ${item.quantity}`,
      amount,
      currency,
      email: customer.email,
      contact: customer.phone,
      onSuccess: async (response) => {
        setPaidIds((prev) => new Set(prev).add(item.id));
        if (actor) {
          try {
            const orderItem: OrderItem = {
              productId: item.id,
              name: item.name,
              quantity: BigInt(item.quantity),
              price: BigInt(link.price),
              currency,
            };
            const order: Order = {
              id: `order_${Date.now()}`,
              razorpayPaymentId: response.razorpay_payment_id ?? "",
              customerName: customer.name,
              customerEmail: customer.email,
              customerPhone: customer.phone,
              status: "Pending",
              currency,
              totalAmount: BigInt(amount),
              createdAt: BigInt(Date.now() * 1_000_000),
              notes: couponApplied ? `Coupon: ${couponApplied}` : "",
              items: [orderItem],
            };
            await actor.createOrder(order);
            if (couponApplied) await actor.incrementCouponUsage(couponApplied);
            toast.success("Order saved! Check your email for confirmation.");
          } catch {
            toast.error(
              "Payment successful but order record failed to save. Contact support.",
            );
          }
        }
      },
    });
  }

  const subtotalDisplay =
    currency === "INR" ? `₹${subtotal}` : `$${subtotal.toFixed(2)}`;
  const totalDisplay =
    currency === "INR"
      ? `₹${totalWithShipping.toFixed(0)}`
      : `$${totalWithShipping.toFixed(2)}`;

  return (
    <div
      className="min-h-screen py-16 px-4"
      style={{ backgroundColor: isDark ? "#0a0a0a" : "#f8f4f0", color: fg }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-4xl md:text-5xl font-bold mb-2"
              style={{
                fontFamily: "Playfair Display, serif",
                color: "#D4AF37",
              }}
            >
              Checkout
            </h1>
            <p className="text-sm" style={{ color: mutedColor }}>
              Complete your merchandise purchase securely via Razorpay.
            </p>
          </div>

          {/* Currency toggle */}
          <div className="flex items-center gap-3 shrink-0">
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
                data-ocid="checkout.currency.toggle"
                className="px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200"
                style={{
                  background:
                    currency === "INR"
                      ? "linear-gradient(135deg, #D4AF37, #F0D060)"
                      : "transparent",
                  color: currency === "INR" ? "#0a0a0a" : mutedColor,
                }}
                onClick={() => {
                  setCurrency("INR");
                  setRegion("india");
                }}
              >
                🇮🇳 ₹ INR
              </button>
              <button
                type="button"
                data-ocid="checkout.currency.toggle"
                className="px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200"
                style={{
                  background:
                    currency === "USD"
                      ? "linear-gradient(135deg, #D4AF37, #F0D060)"
                      : "transparent",
                  color: currency === "USD" ? "#0a0a0a" : mutedColor,
                  borderLeft: `1px solid ${cardBorder}`,
                }}
                onClick={() => {
                  setCurrency("USD");
                  setRegion("international");
                }}
              >
                🌍 $ USD
              </button>
            </div>
          </div>
        </div>

        {hasFilteredAudiobooks && (
          <div
            className="rounded-xl px-4 py-3 mb-6 text-xs flex items-center gap-2"
            style={{
              background: isDark
                ? "rgba(212,175,55,0.06)"
                : "rgba(212,175,55,0.1)",
              border: "1px solid rgba(212,175,55,0.2)",
              color: mutedColor,
            }}
          >
            <span style={{ color: "#D4AF37" }}>🎧</span>
            <span>
              Audiobooks are purchased directly via{" "}
              <strong style={{ color: "#D4AF37" }}>Buy Now</strong> on the store
              page.
            </span>
          </div>
        )}

        {items.length === 0 ? (
          <div data-ocid="checkout.empty_state" className="text-center py-20">
            <div className="text-7xl mb-4">🛍️</div>
            <p className="text-lg mb-2" style={{ color: mutedColor }}>
              No merchandise in your cart.
            </p>
            <Button
              asChild
              style={{
                background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                color: "#0a0a0a",
                fontWeight: 700,
              }}
            >
              <Link to="/store">Browse the Store</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Customer Info */}
            <div
              className="rounded-2xl p-6 mb-6"
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                backdropFilter: "blur(12px)",
              }}
            >
              <h2
                className="text-lg font-bold mb-4"
                style={{
                  fontFamily: "Playfair Display, serif",
                  color: "#D4AF37",
                }}
              >
                Your Details
              </h2>
              {/* Region selector */}
              <div className="flex flex-col gap-2 mb-4">
                <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                  Shipping Region
                </Label>
                <div
                  className="flex gap-0 border rounded-xl overflow-hidden w-fit"
                  style={{ borderColor: cardBorder }}
                >
                  <button
                    type="button"
                    data-ocid="checkout.region.toggle"
                    className="px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200"
                    style={{
                      background:
                        region === "india"
                          ? "linear-gradient(135deg, #D4AF37, #F0D060)"
                          : "transparent",
                      color: region === "india" ? "#0a0a0a" : mutedColor,
                    }}
                    onClick={() => setRegion("india")}
                  >
                    🇮🇳 India
                  </button>
                  <button
                    type="button"
                    data-ocid="checkout.region.toggle"
                    className="px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200"
                    style={{
                      background:
                        region === "international"
                          ? "linear-gradient(135deg, #D4AF37, #F0D060)"
                          : "transparent",
                      color:
                        region === "international" ? "#0a0a0a" : mutedColor,
                      borderLeft: `1px solid ${cardBorder}`,
                    }}
                    onClick={() => setRegion("international")}
                  >
                    🌍 International
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                    Full Name *
                  </Label>
                  <Input
                    data-ocid="checkout.input"
                    value={customer.name}
                    onChange={(e) =>
                      setCustomer((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Your name"
                    style={inputStyle}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                    Email *
                  </Label>
                  <Input
                    data-ocid="checkout.input"
                    type="email"
                    value={customer.email}
                    onChange={(e) =>
                      setCustomer((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="you@email.com"
                    style={inputStyle}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                    Phone
                  </Label>
                  <Input
                    data-ocid="checkout.input"
                    value={customer.phone}
                    onChange={(e) =>
                      setCustomer((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+91 ..."
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Coupon code */}
            <div
              className="rounded-2xl p-5 mb-6"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <h2
                className="text-sm font-bold mb-3"
                style={{ color: "#D4AF37" }}
              >
                Have a Coupon?
              </h2>
              <div className="flex gap-2">
                <Input
                  data-ocid="checkout.input"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  disabled={!!couponApplied}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <Button
                  data-ocid="checkout.secondary_button"
                  variant="outline"
                  size="sm"
                  disabled={applyingCoupon || !!couponApplied}
                  onClick={applyCoupon}
                  style={{
                    borderColor: "rgba(212,175,55,0.3)",
                    color: "#D4AF37",
                  }}
                >
                  {applyingCoupon
                    ? "Checking..."
                    : couponApplied
                      ? "Applied ✓"
                      : "Apply"}
                </Button>
              </div>
              {couponMsg && (
                <p
                  className="text-xs mt-2"
                  style={{ color: couponApplied ? "#22C55E" : "#EF4444" }}
                >
                  {couponMsg}
                </p>
              )}
            </div>

            {/* Order summary */}
            <div
              className="rounded-2xl p-6 mb-8"
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                backdropFilter: "blur(12px)",
              }}
              data-ocid="checkout.panel"
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
              <div className="flex flex-col gap-4">
                {items.map((item, i) => {
                  const paid = paidIds.has(item.id);
                  const itemShipping = getItemShipping(item);
                  const isFreeShipping = freeShippingMap[item.id] === true;
                  return (
                    <div
                      key={item.id}
                      data-ocid={`checkout.item.${i + 1}`}
                      className="flex flex-col gap-3 pb-4"
                      style={{ borderBottom: `1px solid ${cardBorder}` }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-semibold"
                              style={{ color: fg }}
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
                            {isFreeShipping ? (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{
                                  background: "rgba(34,197,94,0.12)",
                                  color: "#22C55E",
                                }}
                              >
                                📦 Free Shipping
                              </span>
                            ) : (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: "rgba(212,175,55,0.08)",
                                  color: "#D4AF37",
                                }}
                              >
                                + Shipping
                              </span>
                            )}
                          </div>
                          <p
                            className="text-xs mt-1"
                            style={{ color: mutedColor }}
                          >
                            Qty: {item.quantity} · {getDisplayPrice(item)}
                          </p>
                        </div>
                        {paid ? (
                          <div
                            data-ocid={`checkout.success_state.${i + 1}`}
                            className="flex items-center gap-2 text-sm font-semibold"
                            style={{ color: "#22c55e" }}
                          >
                            ✅ Payment Initiated
                          </div>
                        ) : (
                          <Button
                            data-ocid={`checkout.primary_button.${i + 1}`}
                            size="sm"
                            style={{
                              background:
                                "linear-gradient(135deg, #D4AF37, #F0D060)",
                              color: "#0a0a0a",
                              fontWeight: 700,
                            }}
                            onClick={() => handlePay(item)}
                          >
                            Pay {getDisplayPrice(item)} via Razorpay
                          </Button>
                        )}
                      </div>
                      {/* Per-item shipping line */}
                      <div
                        className="flex justify-between text-xs rounded-lg px-3 py-2"
                        style={{
                          background: isFreeShipping
                            ? "rgba(34,197,94,0.06)"
                            : "rgba(212,175,55,0.05)",
                          border: isFreeShipping
                            ? "1px solid rgba(34,197,94,0.2)"
                            : "1px solid rgba(212,175,55,0.15)",
                        }}
                      >
                        <span style={{ color: mutedColor }}>
                          Shipping (
                          {region === "india" ? "India 🇮🇳" : "International 🌍"}
                          )
                        </span>
                        <span
                          style={{
                            color: isFreeShipping ? "#22C55E" : fg,
                            fontWeight: 600,
                          }}
                        >
                          {isFreeShipping
                            ? "FREE"
                            : currency === "INR"
                              ? `₹${itemShipping.toFixed(0)}`
                              : `$${itemShipping.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="mt-4 flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span style={{ color: mutedColor }}>Subtotal</span>
                  <span style={{ color: fg }}>{subtotalDisplay}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "#22C55E" }}>
                      Discount ({couponApplied})
                    </span>
                    <span style={{ color: "#22C55E" }}>
                      -{currency === "INR" ? "₹" : "$"}
                      {discount.toFixed(2)}
                    </span>
                  </div>
                )}
                {totalShipping > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: mutedColor }}>Total Shipping</span>
                    <span style={{ color: fg }}>
                      {currency === "INR"
                        ? `₹${totalShipping.toFixed(0)}`
                        : `$${totalShipping.toFixed(2)}`}
                    </span>
                  </div>
                )}
                {totalShipping === 0 &&
                  items.every((i) => freeShippingMap[i.id]) && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: mutedColor }}>Shipping</span>
                      <span style={{ color: "#22C55E", fontWeight: 600 }}>
                        FREE
                      </span>
                    </div>
                  )}
                <div
                  className="flex justify-between font-bold text-lg mt-2 pt-2"
                  style={{ borderTop: `1px solid ${cardBorder}` }}
                >
                  <span style={{ color: fg }}>Total</span>
                  <span style={{ color: "#D4AF37" }}>{totalDisplay}</span>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-4 mb-6 text-sm"
              style={{
                background: isDark
                  ? "rgba(212,175,55,0.06)"
                  : "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.2)",
                color: mutedColor,
              }}
            >
              <p>
                📦 <strong style={{ color: "#D4AF37" }}>Merchandise:</strong>{" "}
                You'll receive a confirmation email within 24 hours. Dispatched
                via Printrove in 3–7 business days.
              </p>
            </div>

            <div
              className="rounded-xl p-5 mb-6"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
              data-ocid="checkout.section"
            >
              <p className="text-sm font-semibold mb-2" style={{ color: fg }}>
                Already paid? Track your order.
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                data-ocid="checkout.secondary_button"
                style={{
                  borderColor: "rgba(212,175,55,0.3)",
                  color: "#D4AF37",
                }}
              >
                <Link to="/order-tracking">Enter Order ID → Track Order</Link>
              </Button>
            </div>

            <div className="text-xs text-center" style={{ color: mutedColor }}>
              🔒 Razorpay payments are processed securely. For support, contact{" "}
              <a
                href="mailto:mystoryova@gmail.com"
                style={{ color: "#D4AF37" }}
              >
                mystoryova@gmail.com
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
