import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { CustomerAddress, Order } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { hashPassword, useCustomerAuth } from "../hooks/useCustomerAuth";
import { useSEO } from "../hooks/useSEO";

interface Props {
  isDark: boolean;
}

const GOLD = "#D4AF37";
const GOLD_GRAD = "linear-gradient(135deg, #D4AF37, #F0D060)";

type AuthMode = "login" | "register";

interface AddressForm {
  id: string;
  addressLabel: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

const blankAddress = (): AddressForm => ({
  id: "",
  addressLabel: "",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  isDefault: false,
});

export default function Account({ isDark }: Props) {
  useSEO({
    title: "My Account — Mystoryova",
    description:
      "Manage your Mystoryova account, addresses, and order history.",
  });

  const { actor } = useActor();
  const { customer, isLoggedIn, login, register, logout } = useCustomerAuth();

  // Auth form
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Profile
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressForm | null>(
    null,
  );
  const [savingAddress, setSavingAddress] = useState(false);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fg = isDark ? "#f0ead6" : "#1a1a1a";
  const mutedColor = isDark ? "#888" : "#666";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const cardBorder = isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.3)";
  const inputStyle = {
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
    border: `1px solid ${cardBorder}`,
    color: fg,
  };

  useEffect(() => {
    if (!isLoggedIn || !customer || !actor) return;
    setEditName(customer.name);
    // Load addresses
    setLoadingAddresses(true);
    actor
      .getCustomerAddresses(customer.id)
      .then(setAddresses)
      .catch(() => {})
      .finally(() => setLoadingAddresses(false));
    // Load orders
    setLoadingOrders(true);
    actor
      .getOrders()
      .then((all) => setOrders(all.filter((o) => o.customerId === customer.id)))
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [isLoggedIn, customer, actor]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) {
      setAuthError("Connecting to server...");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    if (authMode === "login") {
      const result = await login(actor, authEmail, authPassword);
      if (!result.success) setAuthError(result.error ?? "Login failed.");
    } else {
      if (!authName.trim()) {
        setAuthError("Name is required.");
        setAuthLoading(false);
        return;
      }
      if (authPassword.length < 6) {
        setAuthError("Password must be at least 6 characters.");
        setAuthLoading(false);
        return;
      }
      const result = await register(actor, authName, authEmail, authPassword);
      if (!result.success) setAuthError(result.error ?? "Registration failed.");
    }
    setAuthLoading(false);
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!actor || !customer) return;
    setSavingName(true);
    try {
      const account = await actor.getCustomer(customer.id);
      if (account) {
        await actor.updateCustomer({ ...account, name: editName.trim() });
        // Update local session
        const updated = { ...customer, name: editName.trim() };
        localStorage.setItem("mystoryova_customer", JSON.stringify(updated));
        window.dispatchEvent(new Event("customer-auth-change"));
        toast.success("Name updated!");
      }
    } catch {
      toast.error("Failed to update name.");
    }
    setSavingName(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!actor || !customer) return;
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setChangingPw(true);
    try {
      const [oldHash, newHash] = await Promise.all([
        hashPassword(oldPassword),
        hashPassword(newPassword),
      ]);
      const ok = await actor.changeCustomerPassword(
        customer.id,
        oldHash,
        newHash,
      );
      if (ok) {
        toast.success("Password changed!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error("Old password is incorrect.");
      }
    } catch {
      toast.error("Failed to change password.");
    }
    setChangingPw(false);
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!actor || !customer || !editingAddress) return;
    setSavingAddress(true);
    try {
      const addr: CustomerAddress = {
        ...editingAddress,
        customerId: customer.id,
        id: editingAddress.id || `addr_${Date.now()}`,
      };
      if (editingAddress.id) {
        await actor.updateCustomerAddress(addr);
        toast.success("Address updated!");
      } else {
        await actor.addCustomerAddress(addr);
        toast.success("Address saved!");
      }
      const updated = await actor.getCustomerAddresses(customer.id);
      setAddresses(updated);
      setEditingAddress(null);
      setShowAddressForm(false);
    } catch {
      toast.error("Failed to save address.");
    }
    setSavingAddress(false);
  }

  async function handleDeleteAddress(id: string) {
    if (!actor || !customer) return;
    try {
      await actor.deleteCustomerAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address deleted.");
    } catch {
      toast.error("Failed to delete address.");
    }
  }

  async function handleSetDefault(addressId: string) {
    if (!actor || !customer) return;
    try {
      await actor.setDefaultAddress(customer.id, addressId);
      const updated = await actor.getCustomerAddresses(customer.id);
      setAddresses(updated);
      toast.success("Default address updated.");
    } catch {
      toast.error("Failed to update default.");
    }
  }

  const pageStyle = {
    backgroundColor: isDark ? "#0a0a0a" : "#f8f4f0",
    color: fg,
    minHeight: "100vh",
  };

  // ─── Not logged in ─────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="py-16 px-4" style={pageStyle}>
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1
              className="text-4xl font-bold mb-2 text-center"
              style={{ fontFamily: "Playfair Display, serif", color: GOLD }}
            >
              {authMode === "login" ? "Welcome Back" : "Create Account"}
            </h1>
            <p
              className="text-center text-sm mb-8"
              style={{ color: mutedColor }}
            >
              {authMode === "login"
                ? "Sign in to access your orders, addresses and more."
                : "Join Mystoryova to save addresses and track orders."}
            </p>

            {/* Toggle */}
            <div
              className="flex rounded-xl overflow-hidden mb-6"
              style={{ border: `1px solid ${cardBorder}` }}
            >
              <button
                type="button"
                data-ocid="account.tab"
                className="flex-1 py-2.5 text-sm font-semibold transition-all"
                style={{
                  background: authMode === "login" ? GOLD_GRAD : "transparent",
                  color: authMode === "login" ? "#0a0a0a" : mutedColor,
                }}
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                data-ocid="account.tab"
                className="flex-1 py-2.5 text-sm font-semibold transition-all"
                style={{
                  background:
                    authMode === "register" ? GOLD_GRAD : "transparent",
                  color: authMode === "register" ? "#0a0a0a" : mutedColor,
                  borderLeft: `1px solid ${cardBorder}`,
                }}
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                }}
              >
                Register
              </button>
            </div>

            <form
              onSubmit={handleAuth}
              className="rounded-2xl p-8 flex flex-col gap-4"
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                backdropFilter: "blur(12px)",
              }}
              data-ocid="account.modal"
            >
              <AnimatePresence mode="wait">
                {authMode === "register" && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-1"
                  >
                    <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                      Full Name *
                    </Label>
                    <Input
                      data-ocid="account.input"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Your name"
                      style={inputStyle}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-1">
                <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                  Email *
                </Label>
                <Input
                  data-ocid="account.input"
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                  Password *
                </Label>
                <Input
                  data-ocid="account.input"
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={inputStyle}
                />
              </div>

              {authError && (
                <p
                  data-ocid="account.error_state"
                  className="text-sm"
                  style={{ color: "#EF4444" }}
                >
                  {authError}
                </p>
              )}

              <Button
                data-ocid="account.submit_button"
                type="submit"
                disabled={authLoading}
                className="w-full py-3 font-bold text-base"
                style={{ background: GOLD_GRAD, color: "#0a0a0a" }}
              >
                {authLoading
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Sign In"
                    : "Create Account"}
              </Button>
            </form>

            <p
              className="text-center text-xs mt-4"
              style={{ color: mutedColor }}
            >
              Want to shop without an account?{" "}
              <Link to="/checkout" style={{ color: GOLD }}>
                Continue as guest
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Logged in ─────────────────────────────────────────────────────────────
  if (!customer) return null;
  const joinedDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="py-12 px-4" style={pageStyle}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
            style={{ background: GOLD_GRAD, color: "#0a0a0a" }}
          >
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: "Playfair Display, serif", color: GOLD }}
            >
              {customer.name}
            </h1>
            <p className="text-sm" style={{ color: mutedColor }}>
              {customer.email}
            </p>
          </div>
          <button
            type="button"
            data-ocid="account.secondary_button"
            onClick={logout}
            className="sm:ml-auto text-sm px-4 py-2 rounded-lg transition-all"
            style={{
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#EF4444",
            }}
          >
            Sign Out
          </button>
        </motion.div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList
            className="flex gap-1 mb-8 p-1 rounded-xl w-fit"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            {["profile", "addresses", "orders", "downloads"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                data-ocid={`account.${tab}.tab`}
                className="px-4 py-2 text-sm capitalize rounded-lg transition-all"
                style={{ color: mutedColor }}
              >
                {tab === "downloads"
                  ? "📥 Downloads"
                  : tab === "profile"
                    ? "👤 Profile"
                    : tab === "addresses"
                      ? "📍 Addresses"
                      : "📦 Orders"}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── PROFILE ── */}
          <TabsContent value="profile">
            <div className="grid gap-6 max-w-xl">
              {/* Basic info */}
              <div
                className="rounded-2xl p-6"
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  backdropFilter: "blur(12px)",
                }}
              >
                <h2
                  className="text-lg font-bold mb-4"
                  style={{ fontFamily: "Playfair Display, serif", color: GOLD }}
                >
                  Profile Information
                </h2>
                <div className="text-sm mb-4 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span style={{ color: mutedColor }}>Email</span>
                    <span style={{ color: fg }}>{customer.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: mutedColor }}>Member since</span>
                    <span style={{ color: fg }}>{joinedDate}</span>
                  </div>
                </div>
                <Separator
                  style={{ background: cardBorder, marginBottom: "1rem" }}
                />
                <form onSubmit={handleSaveName} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                      Display Name
                    </Label>
                    <Input
                      data-ocid="account.profile.input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <Button
                    data-ocid="account.profile.save_button"
                    type="submit"
                    size="sm"
                    disabled={savingName}
                    style={{
                      background: GOLD_GRAD,
                      color: "#0a0a0a",
                      width: "fit-content",
                    }}
                  >
                    {savingName ? "Saving..." : "Save Name"}
                  </Button>
                </form>
              </div>

              {/* Change password */}
              <div
                className="rounded-2xl p-6"
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  backdropFilter: "blur(12px)",
                }}
              >
                <h2
                  className="text-lg font-bold mb-4"
                  style={{ fontFamily: "Playfair Display, serif", color: GOLD }}
                >
                  Change Password
                </h2>
                <form
                  onSubmit={handleChangePassword}
                  className="flex flex-col gap-3"
                >
                  <div className="flex flex-col gap-1">
                    <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                      Current Password
                    </Label>
                    <Input
                      data-ocid="account.password.input"
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                      New Password
                    </Label>
                    <Input
                      data-ocid="account.password.input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>
                      Confirm New Password
                    </Label>
                    <Input
                      data-ocid="account.password.input"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      style={inputStyle}
                    />
                  </div>
                  <Button
                    data-ocid="account.password.submit_button"
                    type="submit"
                    size="sm"
                    disabled={changingPw}
                    style={{
                      background: GOLD_GRAD,
                      color: "#0a0a0a",
                      width: "fit-content",
                    }}
                  >
                    {changingPw ? "Changing..." : "Change Password"}
                  </Button>
                </form>
              </div>
            </div>
          </TabsContent>

          {/* ── ADDRESSES ── */}
          <TabsContent value="addresses">
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2
                  style={{
                    fontFamily: "Playfair Display, serif",
                    color: GOLD,
                    fontSize: "1.25rem",
                    fontWeight: 700,
                  }}
                >
                  Saved Addresses
                </h2>
                {!showAddressForm && (
                  <Button
                    data-ocid="account.addresses.open_modal_button"
                    size="sm"
                    onClick={() => {
                      setEditingAddress(blankAddress());
                      setShowAddressForm(true);
                    }}
                    style={{ background: GOLD_GRAD, color: "#0a0a0a" }}
                  >
                    + Add Address
                  </Button>
                )}
              </div>

              {loadingAddresses ? (
                <p
                  data-ocid="account.addresses.loading_state"
                  style={{ color: mutedColor }}
                >
                  Loading addresses...
                </p>
              ) : addresses.length === 0 && !showAddressForm ? (
                <div
                  data-ocid="account.addresses.empty_state"
                  className="text-center py-12"
                >
                  <div className="text-5xl mb-3">📍</div>
                  <p style={{ color: mutedColor }}>No saved addresses yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {addresses.map((addr, i) => (
                    <motion.div
                      key={addr.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      data-ocid={`account.addresses.item.${i + 1}`}
                      className="rounded-xl p-4"
                      style={{
                        background: cardBg,
                        border: `1px solid ${cardBorder}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="font-semibold"
                              style={{ color: fg }}
                            >
                              {addr.addressLabel || "Address"}
                            </span>
                            {addr.isDefault && (
                              <Badge
                                className="text-xs"
                                style={{
                                  background: GOLD_GRAD,
                                  color: "#0a0a0a",
                                }}
                              >
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm" style={{ color: mutedColor }}>
                            {addr.fullName} · {addr.phone}
                          </p>
                          <p
                            className="text-sm mt-0.5"
                            style={{ color: mutedColor }}
                          >
                            {addr.line1}
                            {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city},{" "}
                            {addr.state} {addr.pincode}, {addr.country}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 items-end shrink-0">
                          <button
                            type="button"
                            data-ocid={`account.addresses.edit_button.${i + 1}`}
                            className="text-xs px-3 py-1 rounded-lg"
                            style={{
                              border: `1px solid ${cardBorder}`,
                              color: GOLD,
                            }}
                            onClick={() => {
                              setEditingAddress({ ...addr });
                              setShowAddressForm(true);
                            }}
                          >
                            Edit
                          </button>
                          {!addr.isDefault && (
                            <button
                              type="button"
                              data-ocid={`account.addresses.toggle.${i + 1}`}
                              className="text-xs px-3 py-1 rounded-lg"
                              style={{
                                border: `1px solid ${cardBorder}`,
                                color: mutedColor,
                              }}
                              onClick={() => handleSetDefault(addr.id)}
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            type="button"
                            data-ocid={`account.addresses.delete_button.${i + 1}`}
                            className="text-xs px-3 py-1 rounded-lg"
                            style={{
                              border: "1px solid rgba(239,68,68,0.3)",
                              color: "#EF4444",
                            }}
                            onClick={() => handleDeleteAddress(addr.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Address form */}
              <AnimatePresence>
                {showAddressForm && editingAddress && (
                  <motion.form
                    key="address-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleSaveAddress}
                    data-ocid="account.addresses.modal"
                    className="rounded-2xl p-6 mt-4 flex flex-col gap-3"
                    style={{
                      background: cardBg,
                      border: `1px solid ${cardBorder}`,
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <h3 className="font-bold" style={{ color: GOLD }}>
                      {editingAddress.id ? "Edit Address" : "New Address"}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field
                        label="Label (e.g. Home, Office)"
                        value={editingAddress.addressLabel}
                        onChange={(v) =>
                          setEditingAddress(
                            (p) => p && { ...p, addressLabel: v },
                          )
                        }
                        inputStyle={inputStyle}
                        mutedColor={mutedColor}
                        ocid="account.addresses.input"
                      />
                      <Field
                        label="Full Name *"
                        value={editingAddress.fullName}
                        onChange={(v) =>
                          setEditingAddress((p) => p && { ...p, fullName: v })
                        }
                        inputStyle={inputStyle}
                        mutedColor={mutedColor}
                        ocid="account.addresses.input"
                        required
                      />
                      <Field
                        label="Phone"
                        value={editingAddress.phone}
                        onChange={(v) =>
                          setEditingAddress((p) => p && { ...p, phone: v })
                        }
                        inputStyle={inputStyle}
                        mutedColor={mutedColor}
                        ocid="account.addresses.input"
                      />
                      <Field
                        label="Address Line 1 *"
                        value={editingAddress.line1}
                        onChange={(v) =>
                          setEditingAddress((p) => p && { ...p, line1: v })
                        }
                        inputStyle={inputStyle}
                        mutedColor={mutedColor}
                        ocid="account.addresses.input"
                        required
                      />
                      <Field
                        label="Address Line 2"
                        value={editingAddress.line2}
                        onChange={(v) =>
                          setEditingAddress((p) => p && { ...p, line2: v })
                        }
                        inputStyle={inputStyle}
                        mutedColor={mutedColor}
                        ocid="account.addresses.input"
                      />
                      <Field
                        label="City *"
                        value={editingAddress.city}
                        onChange={(v) =>
                          setEditingAddress((p) => p && { ...p, city: v })
                        }
                        inputStyle={inputStyle}
                        mutedColor={mutedColor}
                        ocid="account.addresses.input"
                        required
                      />
                      <Field
                        label="State *"
                        value={editingAddress.state}
                        onChange={(v) =>
                          setEditingAddress((p) => p && { ...p, state: v })
                        }
                        inputStyle={inputStyle}
                        mutedColor={mutedColor}
                        ocid="account.addresses.input"
                        required
                      />
                      <Field
                        label="PIN Code *"
                        value={editingAddress.pincode}
                        onChange={(v) =>
                          setEditingAddress((p) => p && { ...p, pincode: v })
                        }
                        inputStyle={inputStyle}
                        mutedColor={mutedColor}
                        ocid="account.addresses.input"
                        required
                      />
                      <Field
                        label="Country"
                        value={editingAddress.country}
                        onChange={(v) =>
                          setEditingAddress((p) => p && { ...p, country: v })
                        }
                        inputStyle={inputStyle}
                        mutedColor={mutedColor}
                        ocid="account.addresses.input"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        data-ocid="account.addresses.save_button"
                        type="submit"
                        size="sm"
                        disabled={savingAddress}
                        style={{ background: GOLD_GRAD, color: "#0a0a0a" }}
                      >
                        {savingAddress ? "Saving..." : "Save Address"}
                      </Button>
                      <Button
                        data-ocid="account.addresses.cancel_button"
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowAddressForm(false);
                          setEditingAddress(null);
                        }}
                        style={{ borderColor: cardBorder, color: mutedColor }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* ── ORDERS ── */}
          <TabsContent value="orders">
            <div className="max-w-2xl">
              <h2
                style={{
                  fontFamily: "Playfair Display, serif",
                  color: GOLD,
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                }}
              >
                Order History
              </h2>
              {loadingOrders ? (
                <p
                  data-ocid="account.orders.loading_state"
                  style={{ color: mutedColor }}
                >
                  Loading orders...
                </p>
              ) : orders.length === 0 ? (
                <div
                  data-ocid="account.orders.empty_state"
                  className="text-center py-12"
                >
                  <div className="text-5xl mb-3">📦</div>
                  <p style={{ color: mutedColor }}>No orders yet.</p>
                  <Link to="/store">
                    <Button
                      size="sm"
                      className="mt-3"
                      style={{ background: GOLD_GRAD, color: "#0a0a0a" }}
                    >
                      Browse Store
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {orders.map((order, i) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      data-ocid={`account.orders.item.${i + 1}`}
                      className="rounded-xl p-5"
                      style={{
                        background: cardBg,
                        border: `1px solid ${cardBorder}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p
                            className="font-semibold text-sm"
                            style={{ color: fg }}
                          >
                            {order.id}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: mutedColor }}
                          >
                            {new Date(
                              Number(order.createdAt) / 1_000_000,
                            ).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <Badge
                          className="text-xs"
                          style={{
                            background:
                              order.status === "Delivered"
                                ? "rgba(34,197,94,0.15)"
                                : order.status === "Pending"
                                  ? "rgba(212,175,55,0.15)"
                                  : "rgba(59,130,246,0.15)",
                            color:
                              order.status === "Delivered"
                                ? "#22C55E"
                                : order.status === "Pending"
                                  ? GOLD
                                  : "#60A5FA",
                            border: "none",
                          }}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-xs" style={{ color: mutedColor }}>
                        {order.items
                          .map((it) => `${it.name} ×${it.quantity}`)
                          .join(" · ")}
                      </div>
                      <p
                        className="text-sm font-bold mt-2"
                        style={{ color: GOLD }}
                      >
                        {order.currency === "INR" ? "₹" : "$"}
                        {(Number(order.totalAmount) / 100).toFixed(2)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── DOWNLOADS ── */}
          <TabsContent value="downloads">
            <div
              data-ocid="account.downloads.empty_state"
              className="text-center py-20 max-w-sm mx-auto"
            >
              <div className="text-6xl mb-4">📥</div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "Playfair Display, serif", color: GOLD }}
              >
                No Downloads Yet
              </h3>
              <p className="text-sm" style={{ color: mutedColor }}>
                Your digital purchases — audiobooks, ebooks, and more — will
                appear here once available.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper field component
function Field({
  label,
  value,
  onChange,
  inputStyle,
  mutedColor,
  ocid,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputStyle: React.CSSProperties;
  mutedColor: string;
  ocid: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label style={{ color: mutedColor, fontSize: "0.75rem" }}>{label}</Label>
      <Input
        data-ocid={ocid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={inputStyle}
      />
    </div>
  );
}
