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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Eye, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Order } from "../backend.d";
import { useActor } from "../hooks/useActor";

const STATUSES = [
  "All",
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Pending: { bg: "rgba(234,179,8,0.15)", color: "#EAB308" },
  Processing: { bg: "rgba(59,130,246,0.15)", color: "#3B82F6" },
  Shipped: { bg: "rgba(168,85,247,0.15)", color: "#A855F7" },
  Delivered: { bg: "rgba(34,197,94,0.15)", color: "#22C55E" },
  Cancelled: { bg: "rgba(239,68,68,0.15)", color: "#EF4444" },
};

function exportCSV(orders: Order[]) {
  const headers = [
    "ID",
    "Customer",
    "Email",
    "Phone",
    "Status",
    "Amount",
    "Currency",
    "Payment ID",
    "Notes",
    "Date",
  ];
  const rows = orders.map((o) => [
    o.id,
    o.customerName,
    o.customerEmail,
    o.customerPhone,
    o.status,
    (Number(o.totalAmount) / 100).toFixed(2),
    o.currency,
    o.razorpayPaymentId,
    o.notes,
    new Date(Number(o.createdAt) / 1_000_000).toISOString(),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "orders.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminOrders() {
  const { actor } = useActor();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    if (!actor) return;
    try {
      const data = await actor.getOrders();
      setOrders([...data].reverse());
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

  async function handleStatusChange(orderId: string, status: string) {
    if (!actor) return;
    setUpdatingId(orderId);
    try {
      await actor.updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
      toast.success("Status updated");
    } catch {
      toast.error("Update failed");
    }
    setUpdatingId(null);
  }

  async function handleDelete() {
    if (!actor || !deleteId) return;
    try {
      await actor.deleteOrder(deleteId);
      toast.success("Order deleted");
      setDeleteId(null);
      await load();
    } catch {
      toast.error("Delete failed");
    }
  }

  const filtered = orders.filter((o) => {
    const matchStatus = filter === "All" || o.status === filter;
    const matchSearch =
      !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

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
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by ID, name, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          style={inputStyle}
        />
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              data-ocid="admin.orders.tab"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background:
                  filter === s
                    ? "rgba(212,175,55,0.15)"
                    : "rgba(255,255,255,0.03)",
                border: `1px solid ${filter === s ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: filter === s ? "#D4AF37" : "#888",
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV(filtered)}
            data-ocid="admin.orders.secondary_button"
            style={{ borderColor: "rgba(212,175,55,0.2)", color: "#D4AF37" }}
          >
            <Download size={14} className="mr-1" /> Export CSV
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
        ) : filtered.length === 0 ? (
          <div
            data-ocid="admin.orders.empty_state"
            className="p-10 text-center"
            style={{ color: "#555" }}
          >
            No orders found.
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
                    "Order ID",
                    "Customer",
                    "Amount",
                    "Status",
                    "Date",
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
                {filtered.map((order, i) => (
                  <tr
                    key={order.id}
                    data-ocid={`admin.orders.row.${i + 1}`}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    <td
                      className="py-3 px-4 font-mono text-xs"
                      style={{ color: "#D4AF37" }}
                    >
                      {order.id.slice(0, 16)}...
                    </td>
                    <td className="py-3 px-4">
                      <div style={{ color: "#f0ead6" }}>
                        {order.customerName}
                      </div>
                      <div className="text-xs" style={{ color: "#555" }}>
                        {order.customerEmail}
                      </div>
                    </td>
                    <td
                      className="py-3 px-4 font-semibold"
                      style={{ color: "#f0ead6" }}
                    >
                      {order.currency === "INR" ? "₹" : "$"}
                      {(Number(order.totalAmount) / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <Select
                        value={order.status}
                        onValueChange={(v) => handleStatusChange(order.id, v)}
                        disabled={updatingId === order.id}
                      >
                        <SelectTrigger
                          className="h-7 text-xs w-36"
                          style={{
                            background:
                              STATUS_COLORS[order.status]?.bg ??
                              "rgba(255,255,255,0.05)",
                            border: "none",
                            color: STATUS_COLORS[order.status]?.color ?? "#888",
                          }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                          style={{
                            background: "#1a1a1a",
                            border: "1px solid rgba(212,175,55,0.2)",
                          }}
                        >
                          {[
                            "Pending",
                            "Processing",
                            "Shipped",
                            "Delivered",
                            "Cancelled",
                          ].map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4 text-xs" style={{ color: "#555" }}>
                      {new Date(
                        Number(order.createdAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          data-ocid={`admin.orders.secondary_button.${i + 1}`}
                          onClick={() => setViewOrder(order)}
                          className="p-1.5 rounded"
                          style={{
                            color: "#D4AF37",
                            background: "rgba(212,175,55,0.08)",
                          }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          data-ocid={`admin.orders.delete_button.${i + 1}`}
                          onClick={() => setDeleteId(order.id)}
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

      {/* Order detail modal */}
      {viewOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-8"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewOrder(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setViewOrder(null);
          }}
          role="presentation"
        >
          <div
            data-ocid="admin.orders.modal"
            className="w-full max-w-lg rounded-2xl p-6 my-auto"
            style={{
              background: "#111",
              border: "1px solid rgba(212,175,55,0.2)",
              color: "#f0ead6",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3
                className="font-bold text-lg"
                style={{
                  fontFamily: "Playfair Display, serif",
                  color: "#D4AF37",
                }}
              >
                Order Details
              </h3>
              <button
                type="button"
                onClick={() => setViewOrder(null)}
                style={{ color: "#555" }}
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-3 text-sm">
              {[
                ["Order ID", viewOrder.id],
                ["Customer", viewOrder.customerName],
                ["Email", viewOrder.customerEmail],
                ["Phone", viewOrder.customerPhone],
                ["Status", viewOrder.status],
                ["Payment ID", viewOrder.razorpayPaymentId],
                ["Currency", viewOrder.currency],
                [
                  "Total",
                  `${viewOrder.currency === "INR" ? "₹" : "$"}${(Number(viewOrder.totalAmount) / 100).toFixed(2)}`,
                ],
                ["Notes", viewOrder.notes || "—"],
                [
                  "Date",
                  new Date(
                    Number(viewOrder.createdAt) / 1_000_000,
                  ).toLocaleString(),
                ],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between py-1.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <span style={{ color: "#666" }}>{k}</span>
                  <span
                    style={{
                      color: "#f0ead6",
                      maxWidth: "60%",
                      textAlign: "right",
                      wordBreak: "break-all",
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>
            {viewOrder.items.length > 0 && (
              <div className="mt-4">
                <p
                  className="text-xs uppercase tracking-widest mb-2"
                  style={{ color: "#555" }}
                >
                  Items
                </p>
                {viewOrder.items.map((item, idx) => (
                  <div
                    key={`${item.productId}-${idx}`}
                    className="flex justify-between text-sm py-1.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <span style={{ color: "#f0ead6" }}>
                      {item.name} × {Number(item.quantity)}
                    </span>
                    <span style={{ color: "#D4AF37" }}>
                      {item.currency === "INR" ? "₹" : "$"}
                      {(Number(item.price) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Button
              data-ocid="admin.orders.close_button"
              className="w-full mt-5"
              onClick={() => setViewOrder(null)}
              style={{
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.2)",
                color: "#D4AF37",
              }}
            >
              Close
            </Button>
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
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "#666" }}>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.orders.cancel_button"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#888",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.orders.delete_button"
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
