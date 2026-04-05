import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type {
  CustomerAddress,
  Order,
  OrderItem,
  ShippingAddress,
} from "../backend.d";
import {
  MERCH_PAYMENT_LINKS,
  openRazorpayCheckout,
} from "../config/razorpayLinks";
import { useActor } from "../hooks/useActor";
import { useCustomerAuth } from "../hooks/useCustomerAuth";
import { useSEO } from "../hooks/useSEO";
import { type CartItem, clearCart, getCart } from "../utils/cart";

type Currency = "INR" | "USD";

interface AddressFields {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

const blankAddress = (): AddressFields => ({
  fullName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
});

interface Props {
  isDark: boolean;
}

export default function Checkout({ isDark }: Props) {
  const { actor } = useActor();
  const { customer, isLoggedIn, login } = useCustomerAuth();
  useSEO({
    title: "Checkout — Mystoryova",
    description: "Complete your order at Mystoryova.",
  });

  const [allItems, setAllItems] = useState<CartItem[]>([]);
  const [orderComplete, setOrderComplete] = useState(false);
  const [currency, setCurrency] = useState<Currency>("INR");
  const [address, setAddress] = useState<AddressFields>(blankAddress);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponApplied, setCouponApplied] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [region, setRegion] = useState<"india" | "international">("india");
  const [shippingINR, setShippingINR] = useState(0);
  const [shippingIntl, setShippingIntl] = useState(0);
  const [freeShippingMap, setFreeShippingMap] = useState<
    Record<string, boolean>
  >({});

  // Auth section state
  const [authSection, setAuthSection] = useState<"none" | "login" | "guest">(
    "none",
  );
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");

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

  useEffect(() => {
    if (!actor || !customer) return;
    actor
      .getCustomerAddresses(customer.id)
      .then((addrs) => {
        setSavedAddresses(addrs);
        const def = addrs.find((a) => a.isDefault);
        if (def) {
          setSelectedAddressId(def.id);
          setAddress({
            fullName: def.fullName,
            email: customer.email,
            phone: def.phone,
            line1: def.line1,
            line2: def.line2,
            city: def.city,
            state: def.state,
            pincode: def.pincode,
            country: def.country,
          });
        }
      })
      .catch(() => {});
  }, [actor, customer]);

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

  function getDisplayPrice(item: CartItem): string {
    return currency === "INR"
      ? `₹${item.price * item.quantity}`
      : `$${(item.price * item.quantity).toFixed(2)}`;
  }

  // Flat shipping: free only if ALL items are free shipping, otherwise one charge for the whole order
  const allFreeShipping =
    items.length > 0 &&
    items.every((item) => freeShippingMap[item.productId ?? item.id]);
  const totalShipping = allFreeShipping
    ? 0
    : items.length > 0
      ? region === "india"
        ? shippingINR
        : shippingIntl
      : 0;

  const totalWithShipping = Math.max(0, discountedTotal + totalShipping);
  const subtotalDisplay =
    currency === "INR" ? `₹${subtotal}` : `$${subtotal.toFixed(2)}`;
  const totalDisplay =
    currency === "INR"
      ? `₹${totalWithShipping.toFixed(0)}`
      : `$${totalWithShipping.toFixed(2)}`;

  function applyAddressFromSaved(addr: CustomerAddress) {
    setAddress({
      fullName: addr.fullName,
      email: customer?.email ?? "",
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
    });
  }

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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;
    setLoginError("");
    setLoginLoading(true);
    const result = await login(actor, loginEmail, loginPassword);
    if (!result.success) setLoginError(result.error ?? "Login failed.");
    setLoginLoading(false);
  }

  async function handlePayAll() {
    if (!address.fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!address.email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!address.line1.trim()) {
      toast.error("Please enter address line 1");
      return;
    }
    if (!address.city.trim()) {
      toast.error("Please enter city");
      return;
    }
    if (!address.pincode.trim()) {
      toast.error("Please enter PIN code");
      return;
    }
    if (items.length === 0) return;

    const razorpayAmount = Math.round(totalWithShipping * 100);
    const description = items.map((i) => `${i.name} ×${i.quantity}`).join(", ");

    const shippingAddress: ShippingAddress = {
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
    };

    openRazorpayCheckout({
      name: "Mystoryova",
      description,
      amount: razorpayAmount,
      currency,
      email: address.email,
      contact: address.phone,
      onSuccess: async (response) => {
        setOrderComplete(true);
        if (actor) {
          try {
            const orderItems: OrderItem[] = items.map((item) => {
              const link = MERCH_PAYMENT_LINKS.find(
                (p) => p.productId === (item.productId ?? item.id),
              );
              return {
                productId: item.productId ?? item.id,
                name: item.name,
                quantity: BigInt(item.quantity),
                price: BigInt(
                  currency === "INR"
                    ? link
                      ? link.price
                      : Math.round(item.price * 100)
                    : link
                      ? link.priceUSD
                      : Math.round(item.price * 100),
                ),
                currency,
              };
            });
            const order: Order = {
              id: `order_${Date.now()}`,
              razorpayPaymentId: response.razorpay_payment_id ?? "",
              customerName: address.fullName,
              customerEmail: address.email,
              customerPhone: address.phone,
              status: "Pending",
              currency,
              totalAmount: BigInt(razorpayAmount),
              createdAt: BigInt(Date.now() * 1_000_000),
              notes: couponApplied ? `Coupon: ${couponApplied}` : "",
              items: orderItems,
              shippingAddress,
              customerId: customer?.id,
            };
            await actor.createOrder(order);
            if (couponApplied) await actor.incrementCouponUsage(couponApplied);
            clearCart();
            toast.success("Order saved! You'll receive a confirmation email.");
          } catch {
            toast.error(
              "Payment successful but order record failed. Contact support.",
            );
          }
        }
      },
    });
  }

  const GOLD_GRAD = "linear-gradient(135deg, #D4AF37, #F0D060)";

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
                  background: currency === "INR" ? GOLD_GRAD : "transparent",
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
                  background: currency === "USD" ? GOLD_GRAD : "transparent",
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
                background: GOLD_GRAD,
                color: "#0a0a0a",
                fontWeight: 700,
              }}
            >
              <Link to="/store">Browse the Store</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* ── LOGIN / GUEST SECTION ── */}
            <div
              className="rounded-2xl p-5 mb-6"
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                backdropFilter: "blur(12px)",
              }}
            >
              {isLoggedIn && customer ? (
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: GOLD_GRAD, color: "#0a0a0a" }}
                  >
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: fg }}>
                      Welcome back, {customer.name}!
                    </p>
                    <p className="text-xs" style={{ color: mutedColor }}>
                      Signed in as {customer.email}
                    </p>
                  </div>
                  <Link
                    to="/account"
                    className="ml-auto text-xs"
                    style={{ color: "#D4AF37" }}
                  >
                    My Account
                  </Link>
                </div>
              ) : (
                <>
                  <h2
                    className="text-sm font-bold mb-3"
                    style={{ color: "#D4AF37" }}
                  >
                    How would you like to checkout?
                  </h2>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      data-ocid="checkout.toggle"
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background:
                          authSection === "login" ? GOLD_GRAD : "transparent",
                        color: authSection === "login" ? "#0a0a0a" : mutedColor,
                        border: `1px solid ${cardBorder}`,
                      }}
                      onClick={() =>
                        setAuthSection(
                          authSection === "login" ? "none" : "login",
                        )
                      }
                    >
                      🔑 Login to my account
                    </button>
                    <button
                      type="button"
                      data-ocid="checkout.toggle"
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background:
                          authSection === "guest" ? GOLD_GRAD : "transparent",
                        color: authSection === "guest" ? "#0a0a0a" : mutedColor,
                        border: `1px solid ${cardBorder}`,
                      }}
                      onClick={() =>
                        setAuthSection(
                          authSection === "guest" ? "none" : "guest",
                        )
                      }
                    >
                      👤 Continue as Guest
                    </button>
                  </div>

                  <AnimatePresence>
                    {authSection === "login" && (
                      <motion.form
                        key="login-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleLogin}
                        data-ocid="checkout.modal"
                        className="mt-4 flex flex-col gap-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <Label
                              style={{ color: mutedColor, fontSize: "0.75rem" }}
                            >
                              Email
                            </Label>
                            <Input
                              data-ocid="checkout.input"
                              type="email"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              placeholder="you@email.com"
                              style={inputStyle}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label
                              style={{ color: mutedColor, fontSize: "0.75rem" }}
                            >
                              Password
                            </Label>
                            <Input
                              data-ocid="checkout.input"
                              type="password"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              placeholder="••••••••"
                              style={inputStyle}
                            />
                          </div>
                        </div>
                        {loginError && (
                          <p
                            data-ocid="checkout.error_state"
                            className="text-xs"
                            style={{ color: "#EF4444" }}
                          >
                            {loginError}
                          </p>
                        )}
                        <div className="flex items-center gap-3">
                          <Button
                            data-ocid="checkout.submit_button"
                            type="submit"
                            size="sm"
                            disabled={loginLoading}
                            style={{ background: GOLD_GRAD, color: "#0a0a0a" }}
                          >
                            {loginLoading ? "Signing in..." : "Sign In"}
                          </Button>
                          <Link
                            to="/account"
                            className="text-xs"
                            style={{ color: "#D4AF37" }}
                          >
                            Create account
                          </Link>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* ── SHIPPING ADDRESS ── */}
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
                Shipping Address
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
                        region === "india" ? GOLD_GRAD : "transparent",
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
                        region === "international" ? GOLD_GRAD : "transparent",
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

              {/* Saved addresses for logged-in users */}
              {isLoggedIn && savedAddresses.length > 0 && (
                <div className="mb-4">
                  <p
                    className="text-xs font-semibold mb-2"
                    style={{ color: mutedColor }}
                  >
                    Select a saved address:
                  </p>
                  <div className="flex flex-col gap-2">
                    {savedAddresses.map((addr) => (
                      <label
                        key={addr.id}
                        data-ocid="checkout.radio"
                        className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
                        style={{
                          border: `1px solid ${selectedAddressId === addr.id ? "rgba(212,175,55,0.5)" : cardBorder}`,
                          background:
                            selectedAddressId === addr.id
                              ? "rgba(212,175,55,0.06)"
                              : "transparent",
                        }}
                      >
                        <input
                          type="radio"
                          name="savedAddress"
                          value={addr.id}
                          checked={selectedAddressId === addr.id}
                          onChange={() => {
                            setSelectedAddressId(addr.id);
                            applyAddressFromSaved(addr);
                          }}
                          className="mt-1 accent-amber-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-semibold"
                              style={{ color: fg }}
                            >
                              {addr.addressLabel || "Address"}
                            </span>
                            {addr.isDefault && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: "rgba(212,175,55,0.15)",
                                  color: "#D4AF37",
                                }}
                              >
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs" style={{ color: mutedColor }}>
                            {addr.fullName} · {addr.line1}, {addr.city},{" "}
                            {addr.state} {addr.pincode}
                          </p>
                        </div>
                      </label>
                    ))}
                    <label
                      data-ocid="checkout.radio"
                      className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
                      style={{
                        border: `1px solid ${selectedAddressId === "new" ? "rgba(212,175,55,0.5)" : cardBorder}`,
                        background:
                          selectedAddressId === "new"
                            ? "rgba(212,175,55,0.06)"
                            : "transparent",
                      }}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        value="new"
                        checked={selectedAddressId === "new"}
                        onChange={() => {
                          setSelectedAddressId("new");
                          setAddress(blankAddress());
                        }}
                        className="accent-amber-500"
                      />
                      <span className="text-sm" style={{ color: mutedColor }}>
                        + Use a new address
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Address form — show for guest OR when "new" selected */}
              {(!isLoggedIn || selectedAddressId === "new") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                      Full Name *
                    </Label>
                    <Input
                      data-ocid="checkout.input"
                      value={address.fullName}
                      onChange={(e) =>
                        setAddress((p) => ({ ...p, fullName: e.target.value }))
                      }
                      placeholder="Full name"
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
                      value={address.email}
                      onChange={(e) =>
                        setAddress((p) => ({ ...p, email: e.target.value }))
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
                      value={address.phone}
                      onChange={(e) =>
                        setAddress((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="+91 ..."
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                      Address Line 1 *
                    </Label>
                    <Input
                      data-ocid="checkout.input"
                      value={address.line1}
                      onChange={(e) =>
                        setAddress((p) => ({ ...p, line1: e.target.value }))
                      }
                      placeholder="Street, apartment, building"
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                      Address Line 2
                    </Label>
                    <Input
                      data-ocid="checkout.input"
                      value={address.line2}
                      onChange={(e) =>
                        setAddress((p) => ({ ...p, line2: e.target.value }))
                      }
                      placeholder="Area, landmark (optional)"
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                      City *
                    </Label>
                    <Input
                      data-ocid="checkout.input"
                      value={address.city}
                      onChange={(e) =>
                        setAddress((p) => ({ ...p, city: e.target.value }))
                      }
                      placeholder="City"
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                      State
                    </Label>
                    <Input
                      data-ocid="checkout.input"
                      value={address.state}
                      onChange={(e) =>
                        setAddress((p) => ({ ...p, state: e.target.value }))
                      }
                      placeholder="State"
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                      PIN Code *
                    </Label>
                    <Input
                      data-ocid="checkout.input"
                      value={address.pincode}
                      onChange={(e) =>
                        setAddress((p) => ({ ...p, pincode: e.target.value }))
                      }
                      placeholder="PIN / ZIP"
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                      Country
                    </Label>
                    <Input
                      data-ocid="checkout.input"
                      value={address.country}
                      onChange={(e) =>
                        setAddress((p) => ({ ...p, country: e.target.value }))
                      }
                      placeholder="Country"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}
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
              className="rounded-2xl p-6 mb-6"
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
                  const isFreeShipping =
                    freeShippingMap[item.productId ?? item.id] === true;
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
                      </div>
                    </div>
                  );
                })}
              </div>

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
                    <span style={{ color: mutedColor }}>Delivery Charge</span>
                    <span style={{ color: fg }}>
                      {currency === "INR"
                        ? `₹${totalShipping.toFixed(0)}`
                        : `$${totalShipping.toFixed(2)}`}
                    </span>
                  </div>
                )}
                {totalShipping === 0 && allFreeShipping && items.length > 0 && (
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

            {/* Pay button */}
            <div className="mb-6">
              {!orderComplete ? (
                <Button
                  data-ocid="checkout.primary_button"
                  onClick={handlePayAll}
                  className="w-full py-4 text-lg font-bold tracking-wide"
                  style={{ background: GOLD_GRAD, color: "#0a0a0a" }}
                >
                  Pay {totalDisplay} via Razorpay
                </Button>
              ) : (
                <div
                  data-ocid="checkout.success_state"
                  className="rounded-2xl p-8 text-center"
                  style={{
                    background: "rgba(34,197,94,0.08)",
                    border: "1px solid rgba(34,197,94,0.3)",
                  }}
                >
                  <div className="text-4xl mb-3">✅</div>
                  <h3
                    className="text-xl font-bold mb-1"
                    style={{ color: "#22C55E" }}
                  >
                    Payment Successful!
                  </h3>
                  <p className="text-sm" style={{ color: "#888" }}>
                    Your order has been placed. Check your email for
                    confirmation.
                  </p>
                  {isLoggedIn && (
                    <Link to="/account">
                      <Button
                        size="sm"
                        className="mt-4"
                        style={{
                          background:
                            "linear-gradient(135deg, #D4AF37, #F0D060)",
                          color: "#0a0a0a",
                        }}
                      >
                        View My Orders
                      </Button>
                    </Link>
                  )}
                </div>
              )}
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
