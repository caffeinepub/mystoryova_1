import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Edit2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AUDIOBOOK_PAYMENT_LINKS,
  MERCH_PAYMENT_LINKS,
  RAZORPAY_KEY_ID,
} from "../config/razorpayLinks";
import { useActor } from "../hooks/useActor";

const DEFAULT_SETTINGS = [
  {
    key: "razorpayKeyId",
    label: "Razorpay Key ID",
    placeholder: "rzp_live_...",
  },
  {
    key: "contactEmail",
    label: "Contact Email",
    placeholder: "mystoryova@gmail.com",
  },
  {
    key: "instagramUrl",
    label: "Instagram URL",
    placeholder: "https://instagram.com/...",
  },
  {
    key: "facebookUrl",
    label: "Facebook URL",
    placeholder: "https://facebook.com/...",
  },
  {
    key: "amazonUrl",
    label: "Amazon Author URL",
    placeholder: "https://amazon.com/author/...",
  },
  {
    key: "siteTagline",
    label: "Site Tagline",
    placeholder: "Stories That Stay With You",
  },
  {
    key: "shippingINR",
    label: "Shipping Charge – India (₹)",
    placeholder: "e.g. 99",
    group: "Shipping Charges",
  },
  {
    key: "shippingInternational",
    label: "Shipping Charge – International ($)",
    placeholder: "e.g. 9.99",
    group: "Shipping Charges",
  },
];

export default function AdminSettings() {
  const { actor } = useActor();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [activeEdit, setActiveEdit] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!actor) return;
    actor.getAllSettings().then((all) => {
      const map: Record<string, string> = {};
      for (const s of all) map[s.key] = s.value;
      setSettings(map);
      setEditing(map);
    });
  }, [actor]);

  async function saveSetting(key: string) {
    if (!actor) return;
    setSaving(key);
    try {
      await actor.updateSetting({ key, value: editing[key] ?? "" });
      setSettings((p) => ({ ...p, [key]: editing[key] ?? "" }));
      setActiveEdit(null);
      toast.success("Setting saved");
    } catch {
      toast.error("Save failed");
    }
    setSaving(null);
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(212,175,55,0.12)",
  };
  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(212,175,55,0.2)",
    color: "#f0ead6",
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Site settings */}
      <div>
        <h3
          className="font-bold text-base mb-4"
          style={{ fontFamily: "Playfair Display, serif", color: "#D4AF37" }}
        >
          Site Settings
        </h3>
        <div className="rounded-xl overflow-hidden" style={cardStyle}>
          {DEFAULT_SETTINGS.map((def, i) => (
            <div key={def.key}>
              {def.group &&
                (i === 0 || DEFAULT_SETTINGS[i - 1].group !== def.group) && (
                  <div
                    className="px-5 pt-5 pb-2"
                    style={{ borderTop: "1px solid rgba(212,175,55,0.15)" }}
                  >
                    <span
                      className="text-xs font-bold tracking-widest uppercase"
                      style={{ color: "#D4AF37" }}
                    >
                      {def.group}
                    </span>
                  </div>
                )}
              <div
                data-ocid={`admin.settings.row.${i + 1}`}
                className="flex items-center gap-4 px-5 py-4"
                style={{
                  borderBottom:
                    i < DEFAULT_SETTINGS.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                }}
              >
                <div className="flex-1 min-w-0">
                  <Label
                    className="block text-xs mb-1"
                    style={{ color: "#666" }}
                  >
                    {def.label}
                  </Label>
                  {activeEdit === def.key ? (
                    <Input
                      data-ocid="admin.settings.input"
                      value={editing[def.key] ?? ""}
                      onChange={(e) =>
                        setEditing((p) => ({ ...p, [def.key]: e.target.value }))
                      }
                      placeholder={def.placeholder}
                      style={inputStyle}
                      autoFocus
                    />
                  ) : (
                    <p
                      className="text-sm truncate"
                      style={{ color: settings[def.key] ? "#f0ead6" : "#444" }}
                    >
                      {settings[def.key] || (
                        <span style={{ color: "#444" }}>Not set</span>
                      )}
                    </p>
                  )}
                </div>
                {activeEdit === def.key ? (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      data-ocid="admin.settings.cancel_button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveEdit(null);
                        setEditing((p) => ({
                          ...p,
                          [def.key]: settings[def.key] ?? "",
                        }));
                      }}
                      style={{
                        borderColor: "rgba(212,175,55,0.2)",
                        color: "#888",
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      data-ocid="admin.settings.save_button"
                      size="sm"
                      disabled={saving === def.key}
                      onClick={() => saveSetting(def.key)}
                      style={{
                        background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                        color: "#0a0a0a",
                      }}
                    >
                      <Check size={14} className="mr-1" />
                      {saving === def.key ? "Saving..." : "Save"}
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    data-ocid="admin.settings.edit_button"
                    onClick={() => setActiveEdit(def.key)}
                    className="shrink-0 p-1.5 rounded"
                    style={{
                      color: "#D4AF37",
                      background: "rgba(212,175,55,0.08)",
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Razorpay reference */}
      <div>
        <h3
          className="font-bold text-base mb-1"
          style={{ fontFamily: "Playfair Display, serif", color: "#D4AF37" }}
        >
          Razorpay Price Reference
        </h3>
        <p className="text-xs mb-4" style={{ color: "#555" }}>
          Current prices from{" "}
          <code style={{ color: "rgba(212,175,55,0.6)" }}>
            razorpayLinks.ts
          </code>{" "}
          (read-only reference)
        </p>
        <div className="rounded-xl p-5" style={cardStyle}>
          <p className="text-xs mb-2" style={{ color: "#888" }}>
            Active Key:{" "}
            <span style={{ color: "#D4AF37", fontFamily: "monospace" }}>
              {RAZORPAY_KEY_ID}
            </span>
          </p>
          <div className="mb-4">
            <p
              className="text-xs uppercase tracking-widest mb-2"
              style={{ color: "#555" }}
            >
              Audiobooks
            </p>
            {AUDIOBOOK_PAYMENT_LINKS.map((p) => (
              <div
                key={p.productId}
                className="flex justify-between text-xs py-1.5"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  color: "#888",
                }}
              >
                <span>{p.name}</span>
                <span style={{ color: "#D4AF37" }}>
                  ₹{p.price / 100} / ${p.priceUSD / 100}
                </span>
              </div>
            ))}
          </div>
          <div>
            <p
              className="text-xs uppercase tracking-widest mb-2"
              style={{ color: "#555" }}
            >
              Merchandise
            </p>
            {MERCH_PAYMENT_LINKS.map((p) => (
              <div
                key={p.productId}
                className="flex justify-between text-xs py-1.5"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  color: "#888",
                }}
              >
                <span>{p.name}</span>
                <span style={{ color: "#D4AF37" }}>
                  ₹{p.price / 100} / ${p.priceUSD / 100}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
