import {
  BookOpen,
  BookText,
  ChevronRight,
  Headphones,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Tag,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Books", path: "/admin/books", icon: BookOpen },
  { label: "Blog Posts", path: "/admin/blog", icon: BookText },
  {
    label: "Store",
    icon: ShoppingBag,
    children: [
      {
        label: "Audiobooks",
        path: "/admin/store/audiobooks",
        icon: Headphones,
      },
      { label: "Merchandise", path: "/admin/store/merch", icon: Package },
    ],
  },
  { label: "Orders", path: "/admin/orders", icon: Tag },
  { label: "Newsletter", path: "/admin/newsletter", icon: Mail },
  { label: "Coupons", path: "/admin/coupons", icon: Tag },
  { label: "Author Bio", path: "/admin/bio", icon: User },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children, onLogout }: Props) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storeExpanded, setStoreExpanded] = useState(
    location.pathname.startsWith("/admin/store"),
  );

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  // Get current page title
  const getPageTitle = () => {
    const p = location.pathname;
    if (p === "/admin/dashboard") return "Dashboard";
    if (p === "/admin/books") return "Books";
    if (p === "/admin/blog") return "Blog Posts";
    if (p === "/admin/store/audiobooks") return "Audiobooks";
    if (p === "/admin/store/merch") return "Merchandise";
    if (p === "/admin/orders") return "Orders";
    if (p === "/admin/newsletter") return "Newsletter";
    if (p === "/admin/coupons") return "Coupons";
    if (p === "/admin/bio") return "Author Bio";
    if (p === "/admin/settings") return "Settings";
    return "Admin";
  };

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "#0a0a0a", color: "#f0ead6" }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSidebarOpen(false);
          }}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          width: 240,
          background: "#0d0d0d",
          borderRight: "1px solid rgba(212,175,55,0.12)",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          className="px-5 py-5 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(212,175,55,0.1)" }}
        >
          <div>
            <div
              className="text-lg font-bold tracking-wider"
              style={{
                fontFamily: "Playfair Display, serif",
                color: "#D4AF37",
              }}
            >
              Mystoryova
            </div>
            <div
              className="text-xs"
              style={{ color: "rgba(212,175,55,0.4)", letterSpacing: "0.2em" }}
            >
              ADMIN
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{ color: "#555" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            if (item.children) {
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => setStoreExpanded((p) => !p)}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors"
                    style={{
                      color: storeExpanded ? "#D4AF37" : "#888",
                      background: storeExpanded
                        ? "rgba(212,175,55,0.05)"
                        : "transparent",
                    }}
                  >
                    <item.icon size={16} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronRight
                      size={14}
                      className={`transition-transform ${storeExpanded ? "rotate-90" : ""}`}
                    />
                  </button>
                  {storeExpanded && (
                    <div style={{ background: "rgba(0,0,0,0.2)" }}>
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          data-ocid="admin.nav.link"
                          onClick={() => setSidebarOpen(false)}
                          className="flex items-center gap-3 pl-10 pr-5 py-2.5 text-sm transition-colors"
                          style={{
                            color: isActive(child.path) ? "#D4AF37" : "#666",
                            background: isActive(child.path)
                              ? "rgba(212,175,55,0.08)"
                              : "transparent",
                            borderLeft: isActive(child.path)
                              ? "2px solid #D4AF37"
                              : "2px solid transparent",
                          }}
                        >
                          <child.icon size={15} />
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={item.path}
                to={item.path!}
                data-ocid="admin.nav.link"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-5 py-2.5 text-sm transition-colors"
                style={{
                  color: isActive(item.path!) ? "#D4AF37" : "#888",
                  background: isActive(item.path!)
                    ? "rgba(212,175,55,0.08)"
                    : "transparent",
                  borderLeft: isActive(item.path!)
                    ? "2px solid #D4AF37"
                    : "2px solid transparent",
                }}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div
          style={{ borderTop: "1px solid rgba(212,175,55,0.1)" }}
          className="p-4"
        >
          <button
            type="button"
            data-ocid="admin.logout.button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-red-500/10"
            style={{ color: "#666" }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center gap-4 px-6 py-4"
          style={{
            background: "#0d0d0d",
            borderBottom: "1px solid rgba(212,175,55,0.1)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            style={{ color: "#D4AF37" }}
          >
            <Menu size={20} />
          </button>
          <h1
            className="text-xl font-bold flex-1"
            style={{ fontFamily: "Playfair Display, serif", color: "#f0ead6" }}
          >
            {getPageTitle()}
          </h1>
          <div
            className="text-xs px-3 py-1 rounded-full"
            style={{
              background: "rgba(212,175,55,0.1)",
              border: "1px solid rgba(212,175,55,0.2)",
              color: "#D4AF37",
            }}
          >
            Admin
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 p-6 overflow-auto"
          style={{ background: "#0f0f0f" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
