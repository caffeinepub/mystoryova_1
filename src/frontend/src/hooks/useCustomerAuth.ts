import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "mystoryova_customer";

export interface CustomerSession {
  id: string;
  name: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function loadSession(): CustomerSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CustomerSession;
  } catch {
    return null;
  }
}

function saveSession(session: CustomerSession | null) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function useCustomerAuth() {
  const [customer, setCustomer] = useState<CustomerSession | null>(loadSession);

  const isLoggedIn = customer !== null;

  const logout = useCallback(() => {
    saveSession(null);
    setCustomer(null);
    window.dispatchEvent(new Event("customer-auth-change"));
  }, []);

  const login = useCallback(
    async (
      actor: any,
      email: string,
      password: string,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const hash = await hashPassword(password);
        const account = await actor.loginCustomer(
          email.trim().toLowerCase(),
          hash,
        );
        if (!account) {
          return { success: false, error: "Invalid email or password." };
        }
        const session: CustomerSession = {
          id: account.id,
          name: account.name,
          email: account.email,
        };
        saveSession(session);
        setCustomer(session);
        window.dispatchEvent(new Event("customer-auth-change"));
        return { success: true };
      } catch {
        return { success: false, error: "Login failed. Please try again." };
      }
    },
    [],
  );

  const register = useCallback(
    async (
      actor: any,
      name: string,
      email: string,
      password: string,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const hash = await hashPassword(password);
        const customerId = await actor.registerCustomer(
          name.trim(),
          email.trim().toLowerCase(),
          hash,
        );
        if (!customerId) {
          return {
            success: false,
            error: "Email already registered. Please login.",
          };
        }
        const session: CustomerSession = {
          id: customerId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
        };
        saveSession(session);
        setCustomer(session);
        window.dispatchEvent(new Event("customer-auth-change"));
        return { success: true };
      } catch {
        return {
          success: false,
          error: "Registration failed. Please try again.",
        };
      }
    },
    [],
  );

  // Keep in sync across tabs
  useEffect(() => {
    const handler = () => setCustomer(loadSession());
    window.addEventListener("storage", handler);
    window.addEventListener("customer-auth-change", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("customer-auth-change", handler);
    };
  }, []);

  return { customer, isLoggedIn, login, register, logout };
}
