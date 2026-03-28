import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Props {
  isDark: boolean;
}

const STEPS = [
  { label: "Order Received", icon: "📋", status: "done" },
  { label: "Payment Confirmed", icon: "💳", status: "done" },
  { label: "Processing", icon: "⚙️", status: "active" },
  { label: "Shipped", icon: "🚚", status: "pending" },
  { label: "Delivered", icon: "📦", status: "pending" },
] as const;

export default function OrderTracking({ isDark }: Props) {
  const [orderId, setOrderId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [tracked, setTracked] = useState("");

  const fg = isDark ? "#f0ead6" : "#1a1a1a";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const cardBorder = isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.3)";
  const mutedColor = isDark ? "#888" : "#666";

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (orderId.trim()) {
      setTracked(orderId.trim());
      setSubmitted(true);
    }
  }

  return (
    <div
      className="min-h-screen py-16 px-4"
      style={{ backgroundColor: isDark ? "#0a0a0a" : "#f8f4f0", color: fg }}
    >
      <div className="max-w-2xl mx-auto">
        <h1
          className="text-4xl md:text-5xl font-bold mb-3"
          style={{ fontFamily: "Playfair Display, serif", color: "#D4AF37" }}
        >
          Track Your Order
        </h1>
        <p className="text-sm mb-10" style={{ color: mutedColor }}>
          Enter your order ID to see the current status of your delivery.
        </p>

        <form
          onSubmit={handleTrack}
          className="flex gap-3 mb-10"
          data-ocid="order_tracking.panel"
        >
          <Input
            data-ocid="order_tracking.input"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. MYS-2024-0001"
            className="flex-1"
            style={{
              background: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.05)",
              border: `1px solid ${cardBorder}`,
              color: fg,
            }}
          />
          <Button
            type="submit"
            data-ocid="order_tracking.submit_button"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #F0D060)",
              color: "#0a0a0a",
              fontWeight: 700,
            }}
          >
            Track Order
          </Button>
        </form>

        {submitted && (
          <div
            data-ocid="order_tracking.success_state"
            className="rounded-2xl p-8"
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              backdropFilter: "blur(12px)",
            }}
          >
            <p className="text-sm mb-6" style={{ color: mutedColor }}>
              Status for order{" "}
              <strong style={{ color: "#D4AF37" }}>{tracked}</strong>
            </p>

            {/* Timeline */}
            <div className="relative">
              {STEPS.map((step, i) => (
                <div key={step.label} className="flex gap-5 relative">
                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div
                      className="absolute left-5 top-10 w-px h-8"
                      style={{
                        background:
                          step.status === "done"
                            ? "#D4AF37"
                            : "rgba(212,175,55,0.2)",
                      }}
                    />
                  )}

                  {/* Circle */}
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold z-10"
                    style={{
                      background:
                        step.status === "done"
                          ? "linear-gradient(135deg, #D4AF37, #F0D060)"
                          : step.status === "active"
                            ? "rgba(212,175,55,0.15)"
                            : "transparent",
                      border:
                        step.status === "pending"
                          ? "1px solid rgba(212,175,55,0.2)"
                          : step.status === "active"
                            ? "1px solid #D4AF37"
                            : "none",
                      color:
                        step.status === "done"
                          ? "#0a0a0a"
                          : step.status === "active"
                            ? "#D4AF37"
                            : mutedColor,
                    }}
                  >
                    {step.status === "done" ? "✓" : step.icon}
                  </div>

                  <div className="pb-8">
                    <p
                      className="font-semibold text-sm"
                      style={{
                        color:
                          step.status === "pending"
                            ? mutedColor
                            : step.status === "done"
                              ? fg
                              : "#D4AF37",
                      }}
                    >
                      {step.label}
                      {step.status === "done" && " ✓"}
                      {step.status === "active" && (
                        <span
                          className="ml-2 inline-block w-3 h-3 rounded-full animate-spin border-2 border-transparent"
                          style={{ borderTopColor: "#D4AF37" }}
                        />
                      )}
                    </p>
                    {step.status === "active" && (
                      <p className="text-xs mt-1" style={{ color: mutedColor }}>
                        Your order is being prepared.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs mt-4" style={{ color: mutedColor }}>
              For real-time updates, contact{" "}
              <a
                href="mailto:mystoryova@gmail.com"
                style={{ color: "#D4AF37" }}
              >
                mystoryova@gmail.com
              </a>{" "}
              with your order ID.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
