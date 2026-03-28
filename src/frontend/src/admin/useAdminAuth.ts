import { useCallback, useEffect, useState } from "react";

const HASH_KEY = "mystoryova_admin_hash";
const SESSION_KEY = "mystoryova_admin_session";
const ATTEMPTS_KEY = "mystoryova_admin_attempts";
const RESET_EMAIL = "omchiddarwar4@gmail.com";
const RESET_PIN = "194651";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_MS = 24 * 60 * 60 * 1000; // 24 hours

async function hashPassword(pwd: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pwd);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface AttemptData {
  count: number;
  timestamp: number;
}

export function useAdminAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstRun, setIsFirstRun] = useState(false);

  useEffect(() => {
    const hash = localStorage.getItem(HASH_KEY);
    if (!hash) {
      setIsFirstRun(true);
      setIsLoading(false);
      return;
    }
    const sessionExpiry = localStorage.getItem(SESSION_KEY);
    if (sessionExpiry && Date.now() < Number(sessionExpiry)) {
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  const getLockoutInfo = useCallback((): {
    locked: boolean;
    remainingMs: number;
  } => {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return { locked: false, remainingMs: 0 };
    const data: AttemptData = JSON.parse(raw);
    if (data.count >= MAX_ATTEMPTS) {
      const elapsed = Date.now() - data.timestamp;
      if (elapsed < LOCKOUT_MS) {
        return { locked: true, remainingMs: LOCKOUT_MS - elapsed };
      }
      // Reset lockout after time passes
      localStorage.removeItem(ATTEMPTS_KEY);
    }
    return { locked: false, remainingMs: 0 };
  }, []);

  const login = useCallback(
    async (password: string): Promise<{ success: boolean; error?: string }> => {
      const { locked, remainingMs } = getLockoutInfo();
      if (locked) {
        const mins = Math.ceil(remainingMs / 60000);
        return {
          success: false,
          error: `Too many attempts. Try again in ${mins} minute(s).`,
        };
      }

      const storedHash = localStorage.getItem(HASH_KEY);
      if (!storedHash) return { success: false, error: "No password set." };

      const inputHash = await hashPassword(password);
      if (inputHash === storedHash) {
        localStorage.removeItem(ATTEMPTS_KEY);
        localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_MS));
        setIsLoggedIn(true);
        return { success: true };
      }

      // Increment attempts
      const raw = localStorage.getItem(ATTEMPTS_KEY);
      const data: AttemptData = raw
        ? JSON.parse(raw)
        : { count: 0, timestamp: Date.now() };
      const newCount = data.count + 1;
      localStorage.setItem(
        ATTEMPTS_KEY,
        JSON.stringify({ count: newCount, timestamp: Date.now() }),
      );
      const remaining = MAX_ATTEMPTS - newCount;
      if (remaining <= 0) {
        return {
          success: false,
          error: "Too many attempts. Locked for 15 minutes.",
        };
      }
      return {
        success: false,
        error: `Incorrect password. ${remaining} attempt(s) remaining.`,
      };
    },
    [getLockoutInfo],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
  }, []);

  const setupPassword = useCallback(
    async (password: string): Promise<{ success: boolean; error?: string }> => {
      if (password.length < 8)
        return {
          success: false,
          error: "Password must be at least 8 characters.",
        };
      const hash = await hashPassword(password);
      localStorage.setItem(HASH_KEY, hash);
      localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_MS));
      setIsFirstRun(false);
      setIsLoggedIn(true);
      return { success: true };
    },
    [],
  );

  const resetWithPin = useCallback(
    async (
      email: string,
      pin: string,
      newPassword: string,
    ): Promise<{ success: boolean; error?: string }> => {
      if (email !== RESET_EMAIL)
        return { success: false, error: "Unauthorized email." };
      const pinHash = await hashPassword(pin);
      const correctPinHash = await hashPassword(RESET_PIN);
      if (pinHash !== correctPinHash)
        return { success: false, error: "Incorrect PIN." };
      if (newPassword.length < 8)
        return {
          success: false,
          error: "Password must be at least 8 characters.",
        };
      const hash = await hashPassword(newPassword);
      localStorage.setItem(HASH_KEY, hash);
      localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_MS));
      localStorage.removeItem(ATTEMPTS_KEY);
      setIsFirstRun(false);
      setIsLoggedIn(true);
      return { success: true };
    },
    [],
  );

  return {
    isLoggedIn,
    isLoading,
    isFirstRun,
    login,
    logout,
    setupPassword,
    resetWithPin,
    getLockoutInfo,
  };
}
