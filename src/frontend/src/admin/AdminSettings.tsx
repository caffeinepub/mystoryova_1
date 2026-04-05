import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Check, Edit2, Loader2, Package, RefreshCw } from "lucide-react";
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

interface QikinkProduct {
  id?: string;
  name?: string;
  sku?: string;
  [key: string]: unknown;
}

export default function AdminSettings() {
  const { actor } = useActor();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [activeEdit, setActiveEdit] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  // Qikink section state
  const [qikinkEnabled, setQikinkEnabled] = useState(false);
  const [qikinkApiKey, setQikinkApiKey] = useState(
    "e5ed89259ecdbf28715642580b0e933c7a7c7f37db45f5df8876e0c7381bf5bd",
  );
  const [savingQikink, setSavingQikink] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<QikinkProduct[]>([]);
  const [catalogCount, setCatalogCount] = useState<number | null>(null);

  useEffect(() => {
    if (!actor) return;
    actor
      .getAllSettings()
      .then((all) => {
        const map: Record<string, string> = {};
        for (const s of all) map[s.key] = s.value;
        setSettings(map);
        setEditing(map);
        // Load Qikink settings
        if (map.qikink_enabled !== undefined) {
          setQikinkEnabled(map.qikink_enabled === "true");
        }
        if (map.qikink_api_key) {
          setQikinkApiKey(map.qikink_api_key);
        }
      })
      .catch(() => {
        // error ignored
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

  async function saveQikinkSettings() {
    if (!actor) return;
    setSavingQikink(true);
    try {
      await Promise.all([
        actor.updateSetting({
          key: "qikink_enabled",
          value: qikinkEnabled ? "true" : "false",
        }),
        actor.updateSetting({ key: "qikink_api_key", value: qikinkApiKey }),
      ]);
      toast.success("Qikink settings saved");
    } catch {
      toast.error("Failed to save Qikink settings");
    }
    setSavingQikink(false);
  }

  async function syncCatalog() {
    if (!actor) return;
    setSyncing(true);
    try {
      const result = await actor.syncQikinkCatalog();
      toast.success(result || "Catalog synced successfully");
      // Fetch the catalog to display
      const catalogJson = await actor.getQikinkCatalog();
      if (catalogJson) {
        try {
          const parsed = JSON.parse(catalogJson);
          if (Array.isArray(parsed)) {
            setCatalogProducts(parsed as QikinkProduct[]);
            setCatalogCount(parsed.length);
          } else if (parsed && typeof parsed === "object") {
            // Might be wrapped in a data/products key
            const arr =
              (parsed as Record<string, unknown>).products ||
              (parsed as Record<string, unknown>).data ||
              (parsed as Record<string, unknown>).items;
            if (Array.isArray(arr)) {
              setCatalogProducts(arr as QikinkProduct[]);
              setCatalogCount((arr as QikinkProduct[]).length);
            } else {
              setCatalogCount(0);
              setCatalogProducts([]);
            }
          }
        } catch {
          setCatalogCount(null);
          setCatalogProducts([]);
        }
      }
    } catch (err) {
      toast.error(
        `Sync failed: ${
          err instanceof Error ? err.message.slice(0, 80) : String(err)
        }`,
      );
    }
    setSyncing(false);
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

      {/* Qikink Integration */}
      <div>
        <h3
          className="font-bold text-base mb-1 flex items-center gap-2"
          style={{ fontFamily: "Playfair Display, serif", color: "#D4AF37" }}
        >
          <Package size={16} />
          Print-on-Demand Integration
        </h3>
        <p className="text-xs mb-4" style={{ color: "#555" }}>
          Manage fulfillment settings for merchandise orders.
        </p>
        <div
          className="rounded-xl p-5 flex flex-col gap-5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(212,175,55,0.18)",
          }}
        >
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label
                className="block text-sm font-semibold"
                style={{ color: "#f0ead6" }}
              >
                Enable Fulfillment Integration
              </Label>
              <p className="text-xs mt-0.5" style={{ color: "#555" }}>
                When enabled, merchandise orders can be fulfilled automatically
              </p>
            </div>
            <Switch
              data-ocid="admin.settings.switch"
              checked={qikinkEnabled}
              onCheckedChange={setQikinkEnabled}
            />
          </div>

          {/* API key field */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs" style={{ color: "#666" }}>
              API Key
            </Label>
            <Input
              data-ocid="admin.settings.input"
              type="password"
              value={qikinkApiKey}
              onChange={(e) => setQikinkApiKey(e.target.value)}
              placeholder="Fulfillment provider API key"
              style={inputStyle}
            />
          </div>

          {/* Save button */}
          <div className="flex gap-3">
            <Button
              data-ocid="admin.settings.save_button"
              disabled={savingQikink}
              onClick={saveQikinkSettings}
              style={{
                background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                color: "#0a0a0a",
                fontWeight: 600,
              }}
            >
              {savingQikink ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : (
                <Check size={14} className="mr-2" />
              )}
              {savingQikink ? "Saving..." : "Save Integration Settings"}
            </Button>

            {/* Sync catalog button */}
            <Button
              data-ocid="admin.settings.secondary_button"
              variant="outline"
              disabled={syncing || !qikinkEnabled}
              onClick={syncCatalog}
              title={
                !qikinkEnabled
                  ? "Enable integration first"
                  : "Sync product catalog"
              }
              style={{
                borderColor: "rgba(212,175,55,0.3)",
                color: qikinkEnabled ? "#D4AF37" : "#444",
                opacity: !qikinkEnabled ? 0.5 : 1,
              }}
            >
              {syncing ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : (
                <RefreshCw size={14} className="mr-2" />
              )}
              {syncing ? "Syncing..." : "Sync Catalog"}
            </Button>
          </div>

          {/* Catalog results */}
          {catalogCount !== null && (
            <div
              className="rounded-lg p-4"
              style={{
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(212,175,55,0.1)",
              }}
            >
              <p
                className="text-xs font-semibold mb-3"
                style={{ color: "#D4AF37" }}
              >
                <Package size={12} className="inline mr-1" />
                {catalogProducts.length > 0
                  ? `${catalogCount} products synced`
                  : "No products found in catalog"}
              </p>
              {catalogProducts.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(212,175,55,0.1)",
                        }}
                      >
                        {["Product Name", "Product ID / SKU"].map((h) => (
                          <th
                            key={h}
                            className="text-left py-2 px-3 uppercase tracking-wider"
                            style={{ color: "#555" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {catalogProducts.slice(0, 20).map((p, i) => (
                        <tr
                          key={`${p.id ?? i}`}
                          data-ocid={`admin.settings.row.${i + 1}`}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                          }}
                        >
                          <td
                            className="py-2 px-3"
                            style={{ color: "#f0ead6" }}
                          >
                            {p.name ?? "—"}
                          </td>
                          <td
                            className="py-2 px-3 font-mono"
                            style={{ color: "#D4AF37" }}
                          >
                            {p.id ?? p.sku ?? "—"}
                          </td>
                        </tr>
                      ))}
                      {catalogProducts.length > 20 && (
                        <tr>
                          <td
                            colSpan={2}
                            className="py-2 px-3 text-center"
                            style={{ color: "#555" }}
                          >
                            +{catalogProducts.length - 20} more products
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
