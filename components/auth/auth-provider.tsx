"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchBackendSession, loginBackend, logoutBackend, registerBackend } from "@/lib/api/auth-client";
import { ApiClientError } from "@/lib/api/http";
import { mapBackendSession, mapBackendUser } from "@/lib/backend-mappers";
import type { AuthContextValue, AuthSession, BackendState, LoginInput, RegisterInput } from "@/types/auth";

const AuthContext = createContext<AuthContextValue | null>(null);

function backendFailureMessage(error: unknown) {
  if (error instanceof ApiClientError && error.status === 503) {
    return "Database is not configured yet. Add the NEXORA Supabase connection strings to .env.local.";
  }
  if (error instanceof ApiClientError && error.status === 0) {
    return "The NEXORA backend could not be reached.";
  }
  return error instanceof Error ? error.message : "Backend is unavailable.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [backend, setBackend] = useState<BackendState>("checking");
  const [backendMessage, setBackendMessage] = useState("Checking secure account service…");

  const refreshSession = useCallback(async () => {
    setBackend("checking");
    try {
      const result = await fetchBackendSession();
      const next = result.session ? mapBackendSession(result.session) : null;
      setSession(next);
      setBackend("ready");
      setBackendMessage("Secure database-backed accounts are online.");
      return next;
    } catch (error) {
      setSession(null);
      setBackend("unavailable");
      setBackendMessage(backendFailureMessage(error));
      return null;
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshSession();
    });
  }, [refreshSession]);

  const login = useCallback(async (input: LoginInput) => {
    const result = await loginBackend(input);
    const next: AuthSession = {
      user: mapBackendUser(result.user),
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    setSession(next);
    setBackend("ready");
    setBackendMessage("Secure database-backed accounts are online.");
    return next;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await registerBackend(input);
    const next: AuthSession = {
      user: mapBackendUser(result.user),
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    setSession(next);
    setBackend("ready");
    setBackendMessage("Secure database-backed accounts are online.");
    return next;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutBackend();
    } finally {
      setSession(null);
      router.push("/");
      router.refresh();
    }
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      ready,
      backend,
      backendMessage,
      login,
      register,
      refreshSession,
      signOut,
    }),
    [session, ready, backend, backendMessage, login, register, refreshSession, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
