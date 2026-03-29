import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminBio from "./AdminBio";
import AdminBlog from "./AdminBlog";
import AdminBooks from "./AdminBooks";
import AdminCoupons from "./AdminCoupons";
import AdminDashboard from "./AdminDashboard";
import AdminLayout from "./AdminLayout";
import AdminLogin from "./AdminLogin";
import AdminNewsletter from "./AdminNewsletter";
import AdminOrders from "./AdminOrders";
import AdminSettings from "./AdminSettings";
import AdminStoreAudiobooks from "./AdminStoreAudiobooks";
import AdminStoreMerch from "./AdminStoreMerch";
import { useAdminAuth } from "./useAdminAuth";

export default function AdminApp() {
  const { isLoggedIn, isLoading, logout } = useAdminAuth();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  const isAuthenticated = loggedIn !== null ? loggedIn : isLoggedIn;

  function handleLogout() {
    logout();
    setLoggedIn(false);
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0a0a0a", color: "#D4AF37" }}
      >
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 rounded-full mx-auto mb-3 animate-spin"
            style={{
              borderColor: "rgba(212,175,55,0.2)",
              borderTopColor: "#D4AF37",
            }}
          />
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: "rgba(212,175,55,0.5)" }}
          >
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/books" element={<AdminBooks />} />
        <Route path="/blog" element={<AdminBlog />} />
        <Route path="/store/audiobooks" element={<AdminStoreAudiobooks />} />
        <Route path="/store/merch" element={<AdminStoreMerch />} />
        <Route path="/orders" element={<AdminOrders />} />
        <Route path="/newsletter" element={<AdminNewsletter />} />
        <Route path="/coupons" element={<AdminCoupons />} />
        <Route path="/bio" element={<AdminBio />} />
        <Route path="/settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
}
