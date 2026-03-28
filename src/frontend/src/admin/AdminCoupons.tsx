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
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Coupon } from "../backend.d";
import { useActor } from "../hooks/useActor";

interface FormState {
  code: string;
  discountType: string;
  discountValue: string;
  currency: string;
  maxUsages: string;
  expiryDate: string;
}

const EMPTY_FORM: FormState = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  currency: "INR",
  maxUsages: "100",
  expiryDate: "",
};

function getCouponStatus(c: Coupon): {
  label: string;
  bg: string;
  color: string;
} {
  const now = BigInt(Date.now() * 1_000_000);
  if (!c.isActive)
    return {
      label: "Inactive",
      bg: "rgba(107,114,128,0.15)",
      color: "#6B7280",
    };
  if (c.expiryDate < now)
    return { label: "Expired", bg: "rgba(239,68,68,0.15)", color: "#EF4444" };
  if (c.usageCount >= c.maxUsages)
    return {
      label: "Maxed Out",
      bg: "rgba(249,115,22,0.15)",
      color: "#F97316",
    };
  return { label: "Active", bg: "rgba(34,197,94,0.15)", color: "#22C55E" };
}

export default function AdminCoupons() {
  const { actor } = useActor();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteCode, setDeleteCode] = useState<string | null>(null);

  async function load() {
    if (!actor) return;
    const data = await actor.getCoupons();
    setCoupons([...data].reverse());
    setLoading(false);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable
  useEffect(() => {
    if (actor) load();
  }, [actor]);

  async function handleCreate() {
    if (!actor) return;
    if (!form.code.trim()) {
      toast.error("Code is required");
      return;
    }
    if (!form.discountValue) {
      toast.error("Discount value required");
      return;
    }
    if (!form.expiryDate) {
      toast.error("Expiry date required");
      return;
    }
    setSaving(true);
    try {
      const coupon: Coupon = {
        code: form.code.toUpperCase().replace(/\s/g, ""),
        discountType: form.discountType,
        discountValue: BigInt(Math.round(Number(form.discountValue) * 100)),
        currency: form.currency,
        maxUsages: BigInt(Number(form.maxUsages)),
        expiryDate: BigInt(new Date(form.expiryDate).getTime() * 1_000_000),
        usageCount: BigInt(0),
        isActive: true,
      };
      await actor.createCoupon(coupon);
      toast.success("Coupon created");
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch {
      toast.error("Failed to create coupon");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!actor || !deleteCode) return;
    try {
      await actor.deleteCoupon(deleteCode);
      toast.success("Coupon deleted");
      setDeleteCode(null);
      await load();
    } catch {
      toast.error("Delete failed");
    }
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
          Create and manage discount coupons.
        </p>
        <Button
          data-ocid="admin.coupons.primary_button"
          size="sm"
          onClick={() => setShowForm(true)}
          style={{
            background: "linear-gradient(135deg, #D4AF37, #F0D060)",
            color: "#0a0a0a",
            fontWeight: 700,
          }}
        >
          <Plus size={15} className="mr-1" /> New Coupon
        </Button>
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
        ) : coupons.length === 0 ? (
          <div
            data-ocid="admin.coupons.empty_state"
            className="p-10 text-center"
            style={{ color: "#555" }}
          >
            No coupons yet.
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
                    "Code",
                    "Type",
                    "Value",
                    "Currency",
                    "Usage",
                    "Expires",
                    "Status",
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
                {coupons.map((c, i) => {
                  const status = getCouponStatus(c);
                  return (
                    <tr
                      key={c.code}
                      data-ocid={`admin.coupons.row.${i + 1}`}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                      }}
                    >
                      <td
                        className="py-3 px-4 font-mono font-bold"
                        style={{ color: "#D4AF37" }}
                      >
                        {c.code}
                      </td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>
                        {c.discountType}
                      </td>
                      <td className="py-3 px-4" style={{ color: "#f0ead6" }}>
                        {c.discountType === "percentage"
                          ? `${Number(c.discountValue) / 100}%`
                          : `${c.currency === "INR" ? "₹" : "$"}${Number(c.discountValue) / 100}`}
                      </td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>
                        {c.currency}
                      </td>
                      <td className="py-3 px-4" style={{ color: "#888" }}>
                        {Number(c.usageCount)} / {Number(c.maxUsages)}
                      </td>
                      <td
                        className="py-3 px-4 text-xs"
                        style={{ color: "#888" }}
                      >
                        {new Date(
                          Number(c.expiryDate) / 1_000_000,
                        ).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: status.bg, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          data-ocid={`admin.coupons.delete_button.${i + 1}`}
                          onClick={() => setDeleteCode(c.code)}
                          className="p-1.5 rounded"
                          style={{
                            color: "#EF4444",
                            background: "rgba(239,68,68,0.08)",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
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
            data-ocid="admin.coupons.modal"
            className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-4"
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
              Create Coupon
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Code (uppercase, no spaces)
                </Label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      code: e.target.value.toUpperCase().replace(/\s/g, ""),
                    }))
                  }
                  placeholder="SAVE20"
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Discount Type
                </Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, discountType: v }))
                  }
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
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Discount Value
                </Label>
                <Input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, discountValue: e.target.value }))
                  }
                  placeholder={form.discountType === "percentage" ? "20" : "50"}
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Currency
                </Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}
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
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Max Usages
                </Label>
                <Input
                  type="number"
                  value={form.maxUsages}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, maxUsages: e.target.value }))
                  }
                  placeholder="100"
                  style={inputStyle}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Expiry Date
                </Label>
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, expiryDate: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <Button
                data-ocid="admin.coupons.cancel_button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
                style={{ borderColor: "rgba(212,175,55,0.2)", color: "#888" }}
              >
                Cancel
              </Button>
              <Button
                data-ocid="admin.coupons.save_button"
                className="flex-1 font-bold"
                disabled={saving}
                onClick={handleCreate}
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                  color: "#0a0a0a",
                }}
              >
                {saving ? "Creating..." : "Create Coupon"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        open={!!deleteCode}
        onOpenChange={(o) => !o && setDeleteCode(null)}
      >
        <AlertDialogContent
          style={{
            background: "#111",
            border: "1px solid rgba(212,175,55,0.2)",
            color: "#f0ead6",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon {deleteCode}?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "#666" }}>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.coupons.cancel_button"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#888",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.coupons.delete_button"
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
