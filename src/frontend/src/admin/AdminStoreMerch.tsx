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
import { Edit2, Plus, Trash2, Upload, X } from "lucide-react";
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

interface ColorEntry {
  name: string;
  hex: string;
  stock: string;
}

export interface ColorVariantImages {
  colorName: string;
  colorHex: string;
  stock: number;
  frontImage: string;
  backImage: string;
  lifestyleImage: string;
}

export interface ProductImages {
  primaryImage: string;
  alternateImage: string;
  lifestyleImage?: string;
}

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
  colorStock: ColorEntry[];
  colorImages: ColorVariantImages[];
  productImages: ProductImages;
}

const EMPTY_SIZE_STOCK: SizeStock = {
  XS: "",
  S: "",
  M: "",
  L: "",
  XL: "",
  XXL: "",
};

const EMPTY_PRODUCT_IMAGES: ProductImages = {
  primaryImage: "",
  alternateImage: "",
  lifestyleImage: "",
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
  colorStock: [],
  colorImages: [],
  productImages: { ...EMPTY_PRODUCT_IMAGES },
};

function icErrMsg(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message.match(/with message:\s*'([^']+)'/s);
    return m ? m[1].slice(0, 120) : err.message.slice(0, 120);
  }
  return String(err).slice(0, 120);
}

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

function compressImage(file: File): Promise<string> {
  // Cap at 300px to keep each base64 image well under 100KB (ICP 2MB message limit)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 300;
        const scaleW = img.width > maxDim ? maxDim / img.width : 1;
        const scaleH = img.height > maxDim ? maxDim / img.height : 1;
        const scale = Math.min(scaleW, scaleH);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas
          .getContext("2d")
          ?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.4));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function merchToForm(
  m: MerchItem,
  freeShipping: boolean,
  sizeStockMap: Record<string, Record<string, number>>,
  colorStockMap: Record<
    string,
    Array<{ name: string; hex: string; stock: number }>
  >,
  colorImagesMap: Record<string, ColorVariantImages[]>,
  productImagesMap: Record<string, ProductImages>,
): FormState {
  const ss = sizeStockMap[m.id];
  const cs = colorStockMap[m.id] ?? [];
  const ci = colorImagesMap[m.id] ?? [];
  const pi = productImagesMap[m.id] ?? { ...EMPTY_PRODUCT_IMAGES };
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
    colorStock: cs.map((c) => ({ ...c, stock: String(c.stock) })),
    colorImages: ci,
    productImages: pi,
  };
}

const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(212,175,55,0.2)",
  color: "#f0ead6",
};

// Image upload slot component
function ImageSlot({
  label,
  required,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label style={{ color: "#888", fontSize: "0.7rem" }}>
        {label}
        {required && <span style={{ color: "#EF4444" }}> *</span>}
      </Label>
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          border: `1px solid ${value ? "rgba(212,175,55,0.4)" : "rgba(212,175,55,0.15)"}`,
          background: "rgba(255,255,255,0.03)",
          aspectRatio: "1",
        }}
      >
        {value ? (
          <>
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 rounded-full p-0.5"
              style={{ background: "rgba(0,0,0,0.7)", color: "#EF4444" }}
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <label
            className="flex flex-col items-center justify-center w-full h-full cursor-pointer gap-1"
            style={{ color: "#555" }}
          >
            <Upload size={16} />
            <span
              style={{
                fontSize: "0.65rem",
                textAlign: "center",
                padding: "0 4px",
              }}
            >
              Upload
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const compressed = await compressImage(file);
                onChange(compressed);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
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
  const [colorStockMap, setColorStockMap] = useState<
    Record<string, Array<{ name: string; hex: string; stock: number }>>
  >({});
  const [colorImagesMap, setColorImagesMap] = useState<
    Record<string, ColorVariantImages[]>
  >({});
  const [productImagesMap, setProductImagesMap] = useState<
    Record<string, ProductImages>
  >({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MerchItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeColorImageIdx, setActiveColorImageIdx] = useState(0);

  async function load() {
    if (!actor) return;
    try {
      const [data, allSettings] = await Promise.all([
        actor.getMerchItems(),
        actor.getAllSettings(),
      ]);
      setItems([...data].reverse());
      const shippingMap: Record<string, boolean> = {};
      const ssMap: Record<string, Record<string, number>> = {};
      const csMap: Record<
        string,
        Array<{ name: string; hex: string; stock: number }>
      > = {};
      const ciMap: Record<string, ColorVariantImages[]> = {};
      const piMap: Record<string, ProductImages> = {};
      for (const s of allSettings) {
        if (s.key.startsWith("shippingFree_")) {
          shippingMap[s.key.replace("shippingFree_", "")] = s.value === "true";
        } else if (s.key.startsWith("sizeStock_")) {
          const id = s.key.replace("sizeStock_", "");
          try {
            ssMap[id] = JSON.parse(s.value);
          } catch {
            /* ignore */
          }
        } else if (s.key.startsWith("colorStock_")) {
          const id = s.key.replace("colorStock_", "");
          try {
            csMap[id] = JSON.parse(s.value);
          } catch {
            /* ignore */
          }
        } else if (s.key.startsWith("colorImages_")) {
          // Legacy single-blob format — still parse for backward compat
          const id = s.key.replace("colorImages_", "");
          if (!ciMap[id]) {
            try {
              ciMap[id] = JSON.parse(s.value);
            } catch {
              /* ignore */
            }
          }
        } else if (s.key.startsWith("colorImg_")) {
          // New per-color format: colorImg_{itemId}_{colorIdx}
          const withoutPrefix = s.key.replace("colorImg_", "");
          const lastUnderscore = withoutPrefix.lastIndexOf("_");
          const id = withoutPrefix.substring(0, lastUnderscore);
          const idx = Number.parseInt(
            withoutPrefix.substring(lastUnderscore + 1),
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
      setFreeShippingMap(shippingMap);
      setSizeStockMap(ssMap);
      setColorStockMap(csMap);
      setColorImagesMap(ciMap);
      setProductImagesMap(piMap);
    } catch {
      // error ignored
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable
  useEffect(() => {
    if (actor) load();
  }, [actor]);

  function openAdd() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setActiveColorImageIdx(0);
    setShowForm(true);
  }

  function openEdit(m: MerchItem) {
    setEditItem(m);
    setForm(
      merchToForm(
        m,
        freeShippingMap[m.id] ?? false,
        sizeStockMap,
        colorStockMap,
        colorImagesMap,
        productImagesMap,
      ),
    );
    setActiveColorImageIdx(0);
    setShowForm(true);
  }

  // Sync colorImages when colorStock changes (add/remove colors)
  function syncColorImages(
    colorStock: ColorEntry[],
    currentColorImages: ColorVariantImages[],
  ): ColorVariantImages[] {
    return colorStock.map((c) => {
      const existing = currentColorImages.find(
        (ci) => ci.colorName === c.name && ci.colorHex === c.hex,
      );
      return (
        existing ?? {
          colorName: c.name,
          colorHex: c.hex,
          stock: Number(c.stock) || 0,
          frontImage: "",
          backImage: "",
          lifestyleImage: "",
        }
      );
    });
  }

  async function handleSave() {
    if (!actor) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    // Validate images
    if (form.category === "Clothing" && form.colorStock.length > 0) {
      const synced = syncColorImages(form.colorStock, form.colorImages);
      const missing = synced.some(
        (ci) => !ci.frontImage || !ci.backImage || !ci.lifestyleImage,
      );
      if (missing) {
        toast.error(
          "Each color must have Front, Back, and Lifestyle photos before saving.",
        );
        return;
      }
    } else if (form.category !== "Clothing") {
      if (
        !form.productImages.primaryImage ||
        !form.productImages.alternateImage
      ) {
        toast.error("Primary and Alternate images are required before saving.");
        return;
      }
    }

    setSaving(true);
    // Step 1: Save the core merch item
    let item: ReturnType<typeof formToMerch>;
    try {
      item = formToMerch(form);
      if (editItem) {
        await actor.updateMerchItem(item);
      } else {
        await actor.createMerchItem(item);
      }
    } catch (err) {
      console.error("Admin save error (item):", err);
      toast.error(`Failed to save item: ${icErrMsg(err)}`);
      setSaving(false);
      return;
    }

    // Step 2: Save settings (shipping, sizes, colors, images)
    try {
      await actor.updateSetting({
        key: `shippingFree_${item.id}`,
        value: form.freeShipping ? "true" : "false",
      });
      if (form.category === "Clothing") {
        const numericStock = Object.fromEntries(
          Object.entries(form.sizeStock).map(([k, v]) => [k, Number(v) || 0]),
        );
        await actor.updateSetting({
          key: `sizeStock_${item.id}`,
          value: JSON.stringify(numericStock),
        });
      }
      const numericColors = form.colorStock.map((c) => ({
        ...c,
        stock: Number(c.stock) || 0,
      }));
      await actor.updateSetting({
        key: `colorStock_${item.id}`,
        value: JSON.stringify(numericColors),
      });
      if (form.category === "Clothing") {
        const synced = syncColorImages(form.colorStock, form.colorImages);
        // Save each color's images separately to stay under ICP 2MB message limit
        for (let ci = 0; ci < synced.length; ci++) {
          await actor.updateSetting({
            key: `colorImg_${item.id}_${ci}`,
            value: JSON.stringify(synced[ci]),
          });
        }
        // Clear the old legacy single-blob key if it existed
        await actor.updateSetting({ key: `colorImages_${item.id}`, value: "" });
      } else {
        await actor.updateSetting({
          key: `productImages_${item.id}`,
          value: JSON.stringify(form.productImages),
        });
      }
    } catch (err) {
      console.error("Admin save error (settings):", err);
      toast.error(`Item saved but settings failed: ${icErrMsg(err)}`);
      setSaving(false);
      await load();
      return;
    }

    toast.success(
      editItem ? "Updated successfully" : "Item added successfully",
    );
    setShowForm(false);
    setSaving(false);
    await load();
  }

  async function handleDelete() {
    if (!actor || !deleteId) return;
    const idToDelete = deleteId;
    try {
      await actor.deleteMerchItem(idToDelete);
      await Promise.all([
        actor.updateSetting({ key: `shippingFree_${idToDelete}`, value: "" }),
        actor.updateSetting({ key: `sizeStock_${idToDelete}`, value: "" }),
        actor.updateSetting({ key: `colorStock_${idToDelete}`, value: "" }),
        actor.updateSetting({ key: `colorImages_${idToDelete}`, value: "" }),
        actor.updateSetting({ key: `productImages_${idToDelete}`, value: "" }),
        // Clear per-color image keys (up to 20 colors)
        ...Array.from({ length: 20 }, (_, i) =>
          actor.updateSetting({
            key: `colorImg_${idToDelete}_${i}`,
            value: "",
          }),
        ),
      ]);
      toast.success("Deleted");
      setDeleteId(null);
    } catch (err) {
      console.error("Admin save error:", err);
      toast.error(`Delete failed: ${icErrMsg(err)}`);
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
          description: m.description ?? "",
          coverEmoji: m.coverEmoji ?? "🛍️",
          category: m.category ?? "Lifestyle",
          priceINR: BigInt(Math.round((m.price ?? 0) * 100)),
          priceUSD: BigInt(Math.round((m.priceUSD ?? 0) * 100)),
          razorpayUrl: "",
          isActive: true,
        });
      }
      toast.success("Seeded default merch items");
    } catch (err) {
      toast.error(`Seed failed: ${icErrMsg(err)}`);
    } finally {
      setSaving(false);
      await load();
    }
  }

  function addColorEntry() {
    setForm((p) => ({
      ...p,
      colorStock: [...p.colorStock, { name: "", hex: "#000000", stock: "0" }],
    }));
  }

  function removeColorEntry(idx: number) {
    setForm((p) => ({
      ...p,
      colorStock: p.colorStock.filter((_, i) => i !== idx),
    }));
    if (activeColorImageIdx >= form.colorStock.length - 1) {
      setActiveColorImageIdx(Math.max(0, form.colorStock.length - 2));
    }
  }

  function updateColorEntry(
    idx: number,
    field: keyof ColorEntry,
    value: string,
  ) {
    setForm((p) => ({
      ...p,
      colorStock: p.colorStock.map((c, i) =>
        i === idx ? { ...c, [field]: value } : c,
      ),
    }));
  }

  function updateColorImage(
    colorIdx: number,
    field: keyof Omit<ColorVariantImages, "colorName" | "colorHex" | "stock">,
    value: string,
  ) {
    setForm((p) => {
      const synced = syncColorImages(p.colorStock, p.colorImages);
      const updated = synced.map((ci, i) =>
        i === colorIdx ? { ...ci, [field]: value } : ci,
      );
      return { ...p, colorImages: updated };
    });
  }

  // Get current synced color images for display
  const syncedColorImages = syncColorImages(form.colorStock, form.colorImages);
  const activeColorData = form.colorStock[activeColorImageIdx];
  const activeColorImages = syncedColorImages[activeColorImageIdx];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "Playfair Display, serif", color: "#D4AF37" }}
        >
          Merchandise
        </h2>
        <div className="flex gap-2 flex-wrap">
          <Button
            data-ocid="admin.merch.secondary_button"
            variant="outline"
            size="sm"
            onClick={seedDefaults}
            disabled={saving}
            style={{
              borderColor: "rgba(212,175,55,0.2)",
              color: "#888",
              fontSize: "0.75rem",
            }}
          >
            Seed Defaults
          </Button>
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
            <Plus size={14} className="mr-1" /> Add Item
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          data-ocid="admin.merch.empty_state"
          className="text-center py-16"
          style={{ color: "#444" }}
        >
          No merch items yet. Add your first item or seed defaults.
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-xl"
          style={{ border: "1px solid rgba(212,175,55,0.1)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
                {[
                  "Item",
                  "Category",
                  "Sizes",
                  "Colors",
                  "Shipping",
                  "₹ Price",
                  "$ Price",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 px-4 text-left font-medium"
                    style={{
                      color: "#555",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                    }}
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
                    className="py-3 px-4 font-medium"
                    style={{ color: "#f0ead6", maxWidth: 180 }}
                  >
                    <div className="flex items-center gap-2">
                      {item.coverEmoji &&
                      (item.coverEmoji.startsWith("data:") ||
                        item.coverEmoji.startsWith("http")) ? (
                        <img
                          src={item.coverEmoji}
                          alt={item.name}
                          className="rounded object-cover flex-shrink-0"
                          style={{ width: 28, height: 28 }}
                        />
                      ) : (
                        <span className="mr-1">{item.coverEmoji}</span>
                      )}
                      {item.name}
                    </div>
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
                    {colorStockMap[item.id]?.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {colorStockMap[item.id].slice(0, 4).map((c) => (
                          <span
                            key={c.hex + c.name}
                            title={`${c.name} (${c.stock})`}
                            style={{
                              display: "inline-block",
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: c.hex,
                              border: "1px solid rgba(255,255,255,0.2)",
                            }}
                          />
                        ))}
                        {colorStockMap[item.id].length > 4 && (
                          <span style={{ color: "#555", fontSize: "0.7rem" }}>
                            +{colorStockMap[item.id].length - 4}
                          </span>
                        )}
                      </div>
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
                        color: freeShippingMap[item.id] ? "#22C55E" : "#D4AF37",
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
            className="w-full max-w-2xl rounded-2xl p-6 flex flex-col gap-4 my-auto"
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

              {/* Cover Emoji/Fallback */}
              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Cover Image / Emoji (fallback)
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
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const compressed = await compressImage(file);
                        setForm((p) => ({ ...p, coverEmoji: compressed }));
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
                      Upload
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

              {/* Color Stock */}
              <div
                className="col-span-2 rounded-xl p-4 flex flex-col gap-3"
                style={{
                  background: "rgba(212,175,55,0.04)",
                  border: "1px solid rgba(212,175,55,0.15)",
                }}
              >
                <div className="flex items-center justify-between">
                  <Label style={{ color: "#D4AF37", fontSize: "0.75rem" }}>
                    🎨 Color Stock (define colors and their stock)
                  </Label>
                  <button
                    type="button"
                    onClick={addColorEntry}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: "rgba(212,175,55,0.12)",
                      border: "1px solid rgba(212,175,55,0.3)",
                      color: "#D4AF37",
                    }}
                  >
                    <Plus size={12} /> Add Color
                  </button>
                </div>
                {form.colorStock.length === 0 ? (
                  <p className="text-xs" style={{ color: "#444" }}>
                    No colors defined. Click "Add Color" to add color variants.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {form.colorStock.map((entry, idx) => (
                      <div
                        key={`${entry.hex}-${idx}`}
                        className="flex items-center gap-2"
                      >
                        <div className="relative flex-shrink-0">
                          <input
                            type="color"
                            value={entry.hex}
                            onChange={(e) =>
                              updateColorEntry(idx, "hex", e.target.value)
                            }
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              border: "1px solid rgba(212,175,55,0.3)",
                              background: "transparent",
                              cursor: "pointer",
                              padding: 2,
                            }}
                            title="Pick color"
                          />
                        </div>
                        <Input
                          value={entry.name}
                          onChange={(e) =>
                            updateColorEntry(idx, "name", e.target.value)
                          }
                          placeholder="Color name (e.g. Black)"
                          style={{ ...inputStyle, flex: 1, fontSize: "0.8rem" }}
                        />
                        <Input
                          type="number"
                          min="0"
                          value={entry.stock}
                          onChange={(e) =>
                            updateColorEntry(idx, "stock", e.target.value)
                          }
                          placeholder="0"
                          style={{
                            ...inputStyle,
                            width: 70,
                            textAlign: "center",
                            fontSize: "0.8rem",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeColorEntry(idx)}
                          className="p-1.5 rounded flex-shrink-0"
                          style={{
                            color: "#EF4444",
                            background: "rgba(239,68,68,0.08)",
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Per-Color Images — Clothing only */}
              {form.category === "Clothing" && form.colorStock.length > 0 && (
                <div
                  className="col-span-2 rounded-xl p-4 flex flex-col gap-4"
                  style={{
                    background: "rgba(212,175,55,0.04)",
                    border: "1px solid rgba(212,175,55,0.2)",
                  }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Label style={{ color: "#D4AF37", fontSize: "0.75rem" }}>
                      📸 Product Photos (per color — Front, Back, Lifestyle
                      required)
                    </Label>
                  </div>
                  {/* Color tabs */}
                  <div className="flex flex-wrap gap-2">
                    {form.colorStock.map((c, idx) => {
                      const ci = syncedColorImages[idx];
                      const complete =
                        ci?.frontImage && ci?.backImage && ci?.lifestyleImage;
                      return (
                        <button
                          key={`${c.hex}-${idx}`}
                          type="button"
                          onClick={() => setActiveColorImageIdx(idx)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background:
                              activeColorImageIdx === idx
                                ? "rgba(212,175,55,0.2)"
                                : "rgba(255,255,255,0.04)",
                            border:
                              activeColorImageIdx === idx
                                ? "1px solid rgba(212,175,55,0.5)"
                                : "1px solid rgba(255,255,255,0.08)",
                            color:
                              activeColorImageIdx === idx ? "#D4AF37" : "#888",
                          }}
                        >
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: c.hex,
                              display: "inline-block",
                              border: "1px solid rgba(255,255,255,0.2)",
                            }}
                          />
                          {c.name || "Unnamed"}
                          {complete ? (
                            <span style={{ color: "#22C55E" }}>✓</span>
                          ) : (
                            <span style={{ color: "#EF4444" }}>!</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Image upload slots for active color */}
                  {activeColorData && activeColorImages && (
                    <div>
                      <p className="text-xs mb-3" style={{ color: "#888" }}>
                        Uploading photos for:{" "}
                        <strong
                          style={{
                            color:
                              activeColorData.hex !== "#000000"
                                ? activeColorData.hex
                                : "#f0ead6",
                          }}
                        >
                          {activeColorData.name || "this color"}
                        </strong>
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <ImageSlot
                          label="Front Photo"
                          required
                          value={activeColorImages.frontImage}
                          onChange={(v) =>
                            updateColorImage(
                              activeColorImageIdx,
                              "frontImage",
                              v,
                            )
                          }
                        />
                        <ImageSlot
                          label="Back Photo"
                          required
                          value={activeColorImages.backImage}
                          onChange={(v) =>
                            updateColorImage(
                              activeColorImageIdx,
                              "backImage",
                              v,
                            )
                          }
                        />
                        <ImageSlot
                          label="Lifestyle Photo"
                          required
                          value={activeColorImages.lifestyleImage}
                          onChange={(v) =>
                            updateColorImage(
                              activeColorImageIdx,
                              "lifestyleImage",
                              v,
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Non-clothing product images */}
              {form.category !== "Clothing" && (
                <div
                  className="col-span-2 rounded-xl p-4 flex flex-col gap-4"
                  style={{
                    background: "rgba(212,175,55,0.04)",
                    border: "1px solid rgba(212,175,55,0.2)",
                  }}
                >
                  <Label style={{ color: "#D4AF37", fontSize: "0.75rem" }}>
                    📸 Product Photos (Primary & Alternate required)
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    <ImageSlot
                      label="Primary Image"
                      required
                      value={form.productImages.primaryImage}
                      onChange={(v) =>
                        setForm((p) => ({
                          ...p,
                          productImages: {
                            ...p.productImages,
                            primaryImage: v,
                          },
                        }))
                      }
                    />
                    <ImageSlot
                      label="Alternate Image"
                      required
                      value={form.productImages.alternateImage}
                      onChange={(v) =>
                        setForm((p) => ({
                          ...p,
                          productImages: {
                            ...p.productImages,
                            alternateImage: v,
                          },
                        }))
                      }
                    />
                    <ImageSlot
                      label="Lifestyle Image"
                      value={form.productImages.lifestyleImage ?? ""}
                      onChange={(v) =>
                        setForm((p) => ({
                          ...p,
                          productImages: {
                            ...p.productImages,
                            lifestyleImage: v,
                          },
                        }))
                      }
                    />
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
