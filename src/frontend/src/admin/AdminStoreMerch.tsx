import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { MerchItem } from "../backend.d";
import { MERCH_ITEMS } from "../data/seedStore";
import { useActor } from "../hooks/useActor";

const CATEGORIES = [
  "Lifestyle",
  "Stationery",
  "Art",
  "Accessories",
  "Clothing",
  "Other",
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
type SizeKey = (typeof SIZES)[number];
type SizeStock = Record<SizeKey, string>;

interface FormState {
  id: string;
  name: string;
  description: string;
  coverEmoji: string;
  category: string;
  priceINR: string;
  priceUSD: string;
  razorpayUrl: string;
  isActive: boolean;
  freeShipping: boolean;
  sizeStock: SizeStock;
}

const EMPTY_SIZE_STOCK: SizeStock = {
  XS: "",
  S: "",
  M: "",
  L: "",
  XL: "",
  XXL: "",
};

const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  description: "",
  coverEmoji: "🛍️",
  category: "Lifestyle",
  priceINR: "",
  priceUSD: "",
  razorpayUrl: "",
  isActive: true,
  freeShipping: false,
  sizeStock: { ...EMPTY_SIZE_STOCK },
};

function formToMerch(f: FormState): MerchItem {
  return {
    id: f.id || `merch-${Date.now()}`,
    name: f.name,
    description: f.description,
    coverEmoji: f.coverEmoji,
    category: f.category,
    priceINR: BigInt(Math.round(Number(f.priceINR) * 100)),
    priceUSD: BigInt(Math.round(Number(f.priceUSD) * 100)),
    razorpayUrl: f.razorpayUrl,
    isActive: f.isActive,
  };
}

function merchToForm(
  m: MerchItem,
  freeShipping: boolean,
  sizeStockMap: Record<string, Record<string, number>>,
): FormState {
  const ss = sizeStockMap[m.id];
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    coverEmoji: m.coverEmoji,
    category: m.category,
    priceINR: (Number(m.priceINR) / 100).toString(),
    priceUSD: (Number(m.priceUSD) / 100).toString(),
    razorpayUrl: m.razorpayUrl,
    isActive: m.isActive,
    freeShipping,
    sizeStock: ss
      ? (Object.fromEntries(
          Object.entries(ss).map(([k, v]) => [k, String(v)]),
        ) as SizeStock)
      : { ...EMPTY_SIZE_STOCK },
  };
}

export default function AdminStoreMerch() {
  const { actor } = useActor();
  const [items, setItems] = useState<MerchItem[]>([]);
  const [freeShippingMap, setFreeShippingMap] = useState<
    Record<string, boolean>
  >({});
  const [sizeStockMap, setSizeStockMap] = useState<
    Record<string, Record<string, number>>
  >({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MerchItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    if (!actor) return;
    const [data, allSettings] = await Promise.all([
      actor.getMerchItems(),
      actor.getAllSettings(),
    ]);
    setItems([...data].reverse());
    const shippingMap: Record<string, boolean> = {};
    const ssMap: Record<string, Record<string, number>> = {};
    for (const s of allSettings) {
      if (s.key.startsWith("shippingFree_")) {
        shippingMap[s.key.replace("shippingFree_", "")] = s.value === "true";
      } else if (s.key.startsWith("sizeStock_")) {
        const id = s.key.replace("sizeStock_", "");
        try {
          ssMap[id] = JSON.parse(s.value);
        } catch {
          // ignore
        }
      }
    }
    setFreeShippingMap(shippingMap);
    setSizeStockMap(ssMap);
    setLoading(false);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable
  useEffect(() => {
    if (actor) load();
  }, [actor]);

  function openAdd() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }
  function openEdit(m: MerchItem) {
    setEditItem(m);
    setForm(merchToForm(m, freeShippingMap[m.id] ?? false, sizeStockMap));
    setShowForm(true);
  }

  async function handleSave() {
    if (!actor) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const item = formToMerch(form);
      if (editItem) {
        await actor.updateMerchItem(item);
        toast.success("Updated");
      } else {
        await actor.createMerchItem(item);
        toast.success("Merch item created");
      }
      // Save free shipping setting
      await actor.updateSetting({
        key: `shippingFree_${item.id}`,
        value: form.freeShipping ? "true" : "false",
      });
      // Save size stock if clothing
      if (form.category === "Clothing") {
        const numericStock = Object.fromEntries(
          Object.entries(form.sizeStock).map(([k, v]) => [k, Number(v) || 0]),
        );
        await actor.updateSetting({
          key: `sizeStock_${item.id}`,
          value: JSON.stringify(numericStock),
        });
      }
      setShowForm(false);
      await load();
    } catch {
      toast.error("Save failed");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!actor || !deleteId) return;
    const idToDelete = deleteId;
    try {
      await actor.deleteMerchItem(idToDelete);
      await actor.updateSetting({
        key: `shippingFree_${idToDelete}`,
        value: "",
      });
      await actor.updateSetting({ key: `sizeStock_${idToDelete}`, value: "" });
      toast.success("Deleted");
      setDeleteId(null);
    } catch {
      toast.error("Delete failed");
      return;
    }
    await load();
  }

  async function seedDefaults() {
    if (!actor) return;
    setSaving(true);
    try {
      for (const m of MERCH_ITEMS) {
        await actor.createMerchItem({
          id: m.id,
          name: m.name,
          description: m.description,
          coverEmoji: m.coverEmoji,
          category: m.category,
          priceINR: BigInt(m.price * 100),
          priceUSD: BigInt(Math.round(m.priceUSD * 100)),
          razorpayUrl: "",
          isActive: true,
        });
      }
      toast.success(`Seeded ${MERCH_ITEMS.length} merch items`);
      await load();
    } catch {
      toast.error("Seed failed");
    }
    setSaving(false);
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#555" }}>
          Manage merchandise listings in the store.
        </p>
        <div className="flex gap-2">
          {items.length === 0 && (
            <Button
              data-ocid="admin.merch.secondary_button"
              variant="outline"
              size="sm"
              onClick={seedDefaults}
              disabled={saving}
              style={{ borderColor: "rgba(212,175,55,0.2)", color: "#D4AF37" }}
            >
              Seed Defaults
            </Button>
          )}
          <Button
            data-ocid="admin.merch.primary_button"
            size="sm"
            onClick={openAdd}
            style={{
              background: "linear-gradient(135deg, #D4AF37, #F0D060)",
              color: "#0a0a0a",
              fontWeight: 700,
            }}
          >
            <Plus size={15} className="mr-1" /> Add Item
          </Button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        {loading ? (
          <div className="p-5 flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-14"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div
            data-ocid="admin.merch.empty_state"
            className="p-10 text-center"
            style={{ color: "#555" }}
          >
            No merch items yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(212,175,55,0.1)",
                    background: "rgba(0,0,0,0.2)",
                  }}
                >
                  {[
                    "Name",
                    "Category",
                    "Sizes",
                    "Shipping",
                    "Price INR",
                    "Price USD",
                    "Active",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 text-xs uppercase tracking-wider"
                      style={{ color: "#555" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr
                    key={item.id}
                    data-ocid={`admin.merch.row.${i + 1}`}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    <td
                      className="py-3 px-4 font-semibold"
                      style={{ color: "#f0ead6" }}
                    >
                      {item.coverEmoji &&
                      (item.coverEmoji.startsWith("data:") ||
                        item.coverEmoji.startsWith("http")) ? (
                        <img
                          src={item.coverEmoji}
                          alt={item.name}
                          className="inline-block rounded object-cover mr-2"
                          style={{
                            width: 32,
                            height: 32,
                            verticalAlign: "middle",
                          }}
                        />
                      ) : (
                        <span className="mr-1">{item.coverEmoji}</span>
                      )}
                      {item.name}
                    </td>
                    <td className="py-3 px-4" style={{ color: "#888" }}>
                      {item.category}
                    </td>
                    <td className="py-3 px-4">
                      {item.category === "Clothing" && sizeStockMap[item.id] ? (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(212,175,55,0.1)",
                            color: "#D4AF37",
                          }}
                        >
                          {SIZES.filter(
                            (s) => (sizeStockMap[item.id]?.[s] ?? 0) > 0,
                          ).join(", ") || "—"}
                        </span>
                      ) : (
                        <span style={{ color: "#444" }}>—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: freeShippingMap[item.id]
                            ? "rgba(34,197,94,0.12)"
                            : "rgba(212,175,55,0.1)",
                          color: freeShippingMap[item.id]
                            ? "#22C55E"
                            : "#D4AF37",
                        }}
                      >
                        {freeShippingMap[item.id] ? "Free" : "Paid"}
                      </span>
                    </td>
                    <td className="py-3 px-4" style={{ color: "#D4AF37" }}>
                      ₹{(Number(item.priceINR) / 100).toFixed(0)}
                    </td>
                    <td className="py-3 px-4" style={{ color: "#D4AF37" }}>
                      ${(Number(item.priceUSD) / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: item.isActive
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(239,68,68,0.1)",
                          color: item.isActive ? "#22C55E" : "#EF4444",
                        }}
                      >
                        {item.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          data-ocid={`admin.merch.edit_button.${i + 1}`}
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded"
                          style={{
                            color: "#D4AF37",
                            background: "rgba(212,175,55,0.08)",
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          data-ocid={`admin.merch.delete_button.${i + 1}`}
                          onClick={() => setDeleteId(item.id)}
                          className="p-1.5 rounded"
                          style={{
                            color: "#EF4444",
                            background: "rgba(239,68,68,0.08)",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowForm(false);
          }}
          role="presentation"
        >
          <div
            data-ocid="admin.merch.modal"
            className="w-full max-w-xl rounded-2xl p-6 flex flex-col gap-4 my-auto"
            style={{
              background: "#111",
              border: "1px solid rgba(212,175,55,0.2)",
            }}
          >
            <h3
              className="font-bold text-lg"
              style={{
                fontFamily: "Playfair Display, serif",
                color: "#D4AF37",
              }}
            >
              {editItem ? "Edit Merch Item" : "Add Merch Item"}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Name *
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Item name"
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Cover Image / Emoji
                </Label>
                <div className="flex items-center gap-3 flex-wrap">
                  {form.coverEmoji &&
                    (form.coverEmoji.startsWith("data:") ||
                      form.coverEmoji.startsWith("http")) && (
                      <img
                        src={form.coverEmoji}
                        alt="cover"
                        className="rounded object-cover"
                        style={{
                          width: 50,
                          height: 50,
                          border: "1px solid rgba(212,175,55,0.3)",
                        }}
                      />
                    )}
                  <label style={{ cursor: "pointer" }}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const img = new Image();
                          img.onload = () => {
                            const maxW = 800;
                            const scale =
                              img.width > maxW ? maxW / img.width : 1;
                            const canvas = document.createElement("canvas");
                            canvas.width = img.width * scale;
                            canvas.height = img.height * scale;
                            canvas
                              .getContext("2d")
                              ?.drawImage(
                                img,
                                0,
                                0,
                                canvas.width,
                                canvas.height,
                              );
                            setForm((p) => ({
                              ...p,
                              coverEmoji: canvas.toDataURL("image/jpeg", 0.7),
                            }));
                          };
                          img.src = ev.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                    <span
                      style={{
                        border: "1px solid rgba(212,175,55,0.3)",
                        color: "#D4AF37",
                        background: "rgba(212,175,55,0.06)",
                        borderRadius: 8,
                        padding: "4px 12px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      Upload from Device
                    </span>
                  </label>
                </div>
                {(!form.coverEmoji ||
                  (!form.coverEmoji.startsWith("data:") &&
                    !form.coverEmoji.startsWith("http"))) && (
                  <Input
                    value={form.coverEmoji}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, coverEmoji: e.target.value }))
                    }
                    placeholder="Or enter emoji e.g. 🛍️"
                    style={inputStyle}
                    className="mt-1"
                  />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Category
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
                >
                  <SelectTrigger style={inputStyle}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: "#1a1a1a",
                      border: "1px solid rgba(212,175,55,0.2)",
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Size Stock — only for Clothing */}
              {form.category === "Clothing" && (
                <div
                  className="col-span-2 rounded-xl p-4 flex flex-col gap-3"
                  style={{
                    background: "rgba(212,175,55,0.04)",
                    border: "1px solid rgba(212,175,55,0.15)",
                  }}
                >
                  <Label style={{ color: "#D4AF37", fontSize: "0.75rem" }}>
                    📏 Size Stock (units available per size)
                  </Label>
                  <div className="grid grid-cols-6 gap-2">
                    {SIZES.map((size) => (
                      <div
                        key={size}
                        className="flex flex-col gap-1 items-center"
                      >
                        <Label
                          style={{
                            color: "#888",
                            fontSize: "0.7rem",
                            textAlign: "center",
                          }}
                        >
                          {size}
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={form.sizeStock[size]}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              sizeStock: {
                                ...p.sizeStock,
                                [size]: e.target.value,
                              },
                            }))
                          }
                          placeholder="0"
                          style={{
                            ...inputStyle,
                            textAlign: "center",
                            padding: "4px 4px",
                            fontSize: "0.8rem",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="col-span-2 flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Description
                </Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                  placeholder="Item description"
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Price INR (₹)
                </Label>
                <Input
                  type="number"
                  value={form.priceINR}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, priceINR: e.target.value }))
                  }
                  placeholder="599"
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Price USD ($)
                </Label>
                <Input
                  type="number"
                  value={form.priceUSD}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, priceUSD: e.target.value }))
                  }
                  placeholder="7.99"
                  style={inputStyle}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Razorpay URL
                </Label>
                <Input
                  value={form.razorpayUrl}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, razorpayUrl: e.target.value }))
                  }
                  placeholder="https://rzp.io/..."
                  style={inputStyle}
                />
              </div>

              {/* Shipping Option */}
              <div
                className="col-span-2 rounded-xl p-4 flex flex-col gap-3"
                style={{
                  background: "rgba(212,175,55,0.04)",
                  border: "1px solid rgba(212,175,55,0.15)",
                }}
              >
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Shipping Charges
                </Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, freeShipping: true }))
                    }
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: form.freeShipping
                        ? "linear-gradient(135deg, #22C55E, #16A34A)"
                        : "rgba(255,255,255,0.04)",
                      border: form.freeShipping
                        ? "1px solid #22C55E"
                        : "1px solid rgba(255,255,255,0.1)",
                      color: form.freeShipping ? "#fff" : "#888",
                    }}
                  >
                    📦 Free Shipping
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, freeShipping: false }))
                    }
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: !form.freeShipping
                        ? "linear-gradient(135deg, #D4AF37, #F0D060)"
                        : "rgba(255,255,255,0.04)",
                      border: !form.freeShipping
                        ? "1px solid #D4AF37"
                        : "1px solid rgba(255,255,255,0.1)",
                      color: !form.freeShipping ? "#0a0a0a" : "#888",
                    }}
                  >
                    💳 Paid Shipping
                  </button>
                </div>
                {!form.freeShipping && (
                  <p className="text-xs" style={{ color: "#555" }}>
                    Shipping rates are set in Admin → Settings → Shipping
                    Charges.
                  </p>
                )}
              </div>

              <div className="col-span-2 flex items-center gap-3">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, isActive: v }))
                  }
                />
                <Label style={{ color: "#aaa" }}>
                  Active (visible in store)
                </Label>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <Button
                data-ocid="admin.merch.cancel_button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
                style={{ borderColor: "rgba(212,175,55,0.2)", color: "#888" }}
              >
                Cancel
              </Button>
              <Button
                data-ocid="admin.merch.save_button"
                className="flex-1 font-bold"
                disabled={saving}
                onClick={handleSave}
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                  color: "#0a0a0a",
                }}
              >
                {saving ? "Saving..." : editItem ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent
          style={{
            background: "#111",
            border: "1px solid rgba(212,175,55,0.2)",
            color: "#f0ead6",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "#666" }}>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.merch.cancel_button"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#888",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.merch.delete_button"
              onClick={handleDelete}
              style={{ background: "#EF4444", color: "#fff" }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
