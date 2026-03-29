import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  BookText,
  Headphones,
  Mail,
  Package,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Order } from "../backend.d";
import { useActor } from "../hooks/useActor";

const STATUS_COLORS: Record<string, string> = {
  Pending: "#EAB308",
  Processing: "#3B82F6",
  Shipped: "#A855F7",
  Delivered: "#22C55E",
  Cancelled: "#EF4444",
};

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(212,175,55,0.12)",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: "#666" }}
        >
          {label}
        </span>
        <Icon size={16} style={{ color: "rgba(212,175,55,0.5)" }} />
      </div>
      {loading ? (
        <Skeleton
          className="h-8 w-16"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
      ) : (
        <span className="text-3xl font-bold" style={{ color: "#D4AF37" }}>
          {value}
        </span>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { actor } = useActor();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    books: 0,
    blogs: 0,
    subscribers: 0,
    orders: 0,
    activeCoupons: 0,
    audiobooks: 0,
    merch: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (!actor) return;
    (async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          actor.getBooks(),
          actor.getBlogPosts(),
          actor.getSubscribers(),
          actor.getOrders(),
          actor.getCoupons(),
          actor.getAudiobooks(),
          actor.getMerchItems(),
        ]);
        const books = results[0].status === "fulfilled" ? results[0].value : [];
        const blogs = results[1].status === "fulfilled" ? results[1].value : [];
        const subs = results[2].status === "fulfilled" ? results[2].value : [];
        const orders =
          results[3].status === "fulfilled" ? results[3].value : [];
        const coupons =
          results[4].status === "fulfilled" ? results[4].value : [];
        const audiobooks =
          results[5].status === "fulfilled" ? results[5].value : [];
        const merch = results[6].status === "fulfilled" ? results[6].value : [];

        const now = BigInt(Date.now() * 1_000_000);
        const activeCoupons = coupons.filter(
          (c) => c.isActive && c.expiryDate > now,
        ).length;
        const breakdown: Record<string, number> = {};
        for (const o of orders) {
          breakdown[o.status] = (breakdown[o.status] ?? 0) + 1;
        }
        setStats({
          books: books.length,
          blogs: blogs.length,
          subscribers: subs.length,
          orders: orders.length,
          activeCoupons,
          audiobooks: audiobooks.length,
          merch: merch.length,
        });
        setStatusBreakdown(breakdown);
        setRecentOrders([...orders].reverse().slice(0, 5));
      } catch (_e) {
        // individual failures already handled via allSettled; this catches unexpected errors
      } finally {
        setLoading(false);
      }
    })();
  }, [actor]);

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "Playfair Display, serif", color: "#f0ead6" }}
        >
          Welcome back
        </h2>
        <p className="text-sm mt-1" style={{ color: "#555" }}>
          Here's what's happening with Mystoryova today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Books"
          value={stats.books}
          icon={BookOpen}
          loading={loading}
        />
        <StatCard
          label="Blog Posts"
          value={stats.blogs}
          icon={BookText}
          loading={loading}
        />
        <StatCard
          label="Subscribers"
          value={stats.subscribers}
          icon={Mail}
          loading={loading}
        />
        <StatCard
          label="Total Orders"
          value={stats.orders}
          icon={ShoppingBag}
          loading={loading}
        />
        <StatCard
          label="Active Coupons"
          value={stats.activeCoupons}
          icon={Tag}
          loading={loading}
        />
        <StatCard
          label="Audiobooks"
          value={stats.audiobooks}
          icon={Headphones}
          loading={loading}
        />
        <StatCard
          label="Merch Items"
          value={stats.merch}
          icon={Package}
          loading={loading}
        />
      </div>

      {/* Order status breakdown */}
      {!loading && Object.keys(statusBreakdown).length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(212,175,55,0.12)",
          }}
        >
          <h3
            className="font-bold mb-4 text-sm uppercase tracking-widest"
            style={{ color: "#888" }}
          >
            Orders by Status
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                style={{
                  background: `${STATUS_COLORS[status] ?? "#888"}15`,
                  border: `1px solid ${STATUS_COLORS[status] ?? "#888"}40`,
                  color: STATUS_COLORS[status] ?? "#888",
                }}
              >
                <span className="font-bold">{count}</span> {status}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(212,175,55,0.12)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="font-bold text-sm uppercase tracking-widest"
            style={{ color: "#888" }}
          >
            Recent Orders
          </h3>
          <Link
            to="/admin/orders"
            className="text-xs"
            style={{ color: "#D4AF37" }}
          >
            View All →
          </Link>
        </div>
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-10"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-sm" style={{ color: "#555" }}>
            No orders yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
                  {["Order ID", "Customer", "Amount", "Status", "Date"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-2 pr-4 text-xs uppercase tracking-wider"
                        style={{ color: "#555" }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    <td
                      className="py-2.5 pr-4 font-mono text-xs"
                      style={{ color: "#D4AF37" }}
                    >
                      {order.id.slice(0, 14)}...
                    </td>
                    <td className="py-2.5 pr-4" style={{ color: "#f0ead6" }}>
                      {order.customerName}
                    </td>
                    <td className="py-2.5 pr-4" style={{ color: "#f0ead6" }}>
                      {order.currency === "INR" ? "₹" : "$"}
                      {(Number(order.totalAmount) / 100).toFixed(2)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: `${STATUS_COLORS[order.status] ?? "#888"}20`,
                          color: STATUS_COLORS[order.status] ?? "#888",
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2.5" style={{ color: "#555" }}>
                      {new Date(
                        Number(order.createdAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(212,175,55,0.12)",
        }}
      >
        <h3
          className="font-bold text-sm uppercase tracking-widest mb-4"
          style={{ color: "#888" }}
        >
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "+ Add Book", to: "/admin/books" },
            { label: "+ Add Blog Post", to: "/admin/blog" },
            { label: "View Orders", to: "/admin/orders" },
            { label: "Manage Coupons", to: "/admin/coupons" },
          ].map((a) => (
            <Link
              key={a.to}
              to={a.to}
              data-ocid="admin.dashboard.button"
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
              style={{
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.2)",
                color: "#D4AF37",
              }}
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
