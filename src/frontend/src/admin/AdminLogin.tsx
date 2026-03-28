import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, KeyRound, Lock, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAdminAuth } from "./useAdminAuth";

interface Props {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: Props) {
  const { isFirstRun, login, setupPassword, resetWithPin, getLockoutInfo } =
    useAdminAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "pin" | "newpw">(
    "email",
  );
  const [resetEmail, setResetEmail] = useState("");
  const [resetPin, setResetPin] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [resetError, setResetError] = useState("");
  const [lockoutMs, setLockoutMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const { locked, remainingMs } = getLockoutInfo();
    if (locked) setLockoutMs(remainingMs);
  }, [getLockoutInfo]);

  useEffect(() => {
    if (lockoutMs > 0) {
      timerRef.current = setInterval(() => {
        setLockoutMs((prev) => {
          if (prev <= 1000) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lockoutMs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (isFirstRun) {
      if (password !== confirm) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      const res = await setupPassword(password);
      if (res.success) onLogin();
      else setError(res.error ?? "Error");
    } else {
      const res = await login(password);
      if (res.success) onLogin();
      else {
        setError(res.error ?? "Error");
        const { remainingMs } = getLockoutInfo();
        if (remainingMs > 0) setLockoutMs(remainingMs);
      }
    }
    setLoading(false);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");
    if (resetStep === "email") {
      if (!resetEmail) {
        setResetError("Enter your email.");
        return;
      }
      setResetStep("pin");
    } else if (resetStep === "pin") {
      if (resetPin.length !== 6) {
        setResetError("Enter the 6-digit PIN.");
        return;
      }
      setResetStep("newpw");
    } else {
      if (newPw !== newPwConfirm) {
        setResetError("Passwords do not match.");
        return;
      }
      const res = await resetWithPin(resetEmail, resetPin, newPw);
      if (res.success) {
        setShowReset(false);
        onLogin();
      } else setResetError(res.error ?? "Error");
    }
  }

  const lockoutMins = Math.ceil(lockoutMs / 60000);
  const lockoutSecs = Math.ceil((lockoutMs % 60000) / 1000);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0a0a0a" }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,175,55,0.07) 0%, transparent 70%)",
        }}
      />

      <div
        className="w-full max-w-md rounded-2xl p-8 relative"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(212,175,55,0.2)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield size={20} style={{ color: "#D4AF37" }} />
            <span
              className="text-2xl font-bold tracking-widest uppercase"
              style={{
                fontFamily: "Playfair Display, serif",
                color: "#D4AF37",
                letterSpacing: "0.15em",
              }}
            >
              Mystoryova
            </span>
          </div>
          <p
            className="text-xs tracking-[0.3em] uppercase"
            style={{ color: "rgba(212,175,55,0.5)" }}
          >
            Admin Portal
          </p>
          <div
            className="w-16 h-px mx-auto mt-4"
            style={{
              background:
                "linear-gradient(90deg, transparent, #D4AF37, transparent)",
            }}
          />
        </div>

        {/* Lockout banner */}
        {lockoutMs > 0 && (
          <div
            className="rounded-xl p-3 mb-5 text-sm text-center"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
            }}
          >
            🔒 Locked out — {lockoutMins}:
            {lockoutSecs.toString().padStart(2, "0")} remaining
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <h2
              className="text-xl font-bold mb-1"
              style={{
                fontFamily: "Playfair Display, serif",
                color: "#f0ead6",
              }}
            >
              {isFirstRun ? "Set Admin Password" : "Welcome Back"}
            </h2>
            <p className="text-xs" style={{ color: "#666" }}>
              {isFirstRun
                ? "Create a secure password to protect your admin panel."
                : "Enter your password to continue."}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <Label style={{ color: "#aaa", fontSize: "0.75rem" }}>
              Password
            </Label>
            <div className="relative">
              <Input
                data-ocid="admin.login.input"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={lockoutMs > 0}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(212,175,55,0.2)",
                  color: "#f0ead6",
                  paddingRight: "2.5rem",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "#666" }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isFirstRun && (
            <div className="flex flex-col gap-1">
              <Label style={{ color: "#aaa", fontSize: "0.75rem" }}>
                Confirm Password
              </Label>
              <Input
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm password"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(212,175,55,0.2)",
                  color: "#f0ead6",
                }}
              />
            </div>
          )}

          {error && (
            <p
              data-ocid="admin.login.error_state"
              className="text-xs"
              style={{ color: "#f87171" }}
            >
              {error}
            </p>
          )}

          <Button
            data-ocid="admin.login.submit_button"
            type="submit"
            disabled={loading || lockoutMs > 0}
            className="w-full font-bold mt-1"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #F0D060)",
              color: "#0a0a0a",
            }}
          >
            <Lock size={15} className="mr-2" />
            {loading
              ? "Verifying..."
              : isFirstRun
                ? "Create Password"
                : "Sign In"}
          </Button>
        </form>

        {!isFirstRun && (
          <button
            type="button"
            data-ocid="admin.login.secondary_button"
            onClick={() => {
              setShowReset(true);
              setResetStep("email");
              setResetError("");
            }}
            className="w-full text-xs mt-4 text-center"
            style={{ color: "rgba(212,175,55,0.5)" }}
          >
            Forgot Password?
          </button>
        )}
      </div>

      {/* PIN Reset Modal */}
      {showReset && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
        >
          <div
            data-ocid="admin.reset.dialog"
            className="w-full max-w-sm rounded-2xl p-6"
            style={{
              background: "#111",
              border: "1px solid rgba(212,175,55,0.25)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <KeyRound size={18} style={{ color: "#D4AF37" }} />
              <h3
                className="font-bold"
                style={{
                  fontFamily: "Playfair Display, serif",
                  color: "#D4AF37",
                }}
              >
                Reset Password
              </h3>
            </div>

            <form onSubmit={handleReset} className="flex flex-col gap-4">
              {resetStep === "email" && (
                <div className="flex flex-col gap-1">
                  <Label style={{ color: "#aaa", fontSize: "0.75rem" }}>
                    Admin Email
                  </Label>
                  <Input
                    data-ocid="admin.reset.input"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter admin email"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(212,175,55,0.2)",
                      color: "#f0ead6",
                    }}
                  />
                </div>
              )}

              {resetStep === "pin" && (
                <div className="flex flex-col gap-1">
                  <Label style={{ color: "#aaa", fontSize: "0.75rem" }}>
                    6-Digit Recovery PIN
                  </Label>
                  <Input
                    data-ocid="admin.reset.input"
                    type="text"
                    maxLength={6}
                    value={resetPin}
                    onChange={(e) =>
                      setResetPin(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="______"
                    className="text-center tracking-widest text-xl"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(212,175,55,0.2)",
                      color: "#D4AF37",
                    }}
                  />
                </div>
              )}

              {resetStep === "newpw" && (
                <>
                  <div className="flex flex-col gap-1">
                    <Label style={{ color: "#aaa", fontSize: "0.75rem" }}>
                      New Password
                    </Label>
                    <Input
                      data-ocid="admin.reset.input"
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="New password (min 8 chars)"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(212,175,55,0.2)",
                        color: "#f0ead6",
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label style={{ color: "#aaa", fontSize: "0.75rem" }}>
                      Confirm New Password
                    </Label>
                    <Input
                      type="password"
                      value={newPwConfirm}
                      onChange={(e) => setNewPwConfirm(e.target.value)}
                      placeholder="Confirm new password"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(212,175,55,0.2)",
                        color: "#f0ead6",
                      }}
                    />
                  </div>
                </>
              )}

              {resetError && (
                <p className="text-xs" style={{ color: "#f87171" }}>
                  {resetError}
                </p>
              )}

              <div className="flex gap-2 mt-1">
                <Button
                  data-ocid="admin.reset.cancel_button"
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowReset(false)}
                  style={{ borderColor: "rgba(212,175,55,0.2)", color: "#888" }}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="admin.reset.confirm_button"
                  type="submit"
                  className="flex-1 font-bold"
                  style={{
                    background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                    color: "#0a0a0a",
                  }}
                >
                  {resetStep === "newpw" ? "Reset Password" : "Continue"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
