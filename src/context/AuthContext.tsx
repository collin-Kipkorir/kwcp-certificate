import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadSession, loginUser, logoutUser, registerUser, type RegisterInput } from "@/utils/auth";
import type { AppUser } from "@/types/Certificate";

interface AuthValue {
  user: AppUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  register: (input: RegisterInput) => Promise<AppUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(loadSession());
    setReady(true);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      login: async (email, password) => {
        const u = loginUser(email, password);
        setUser(u);
        return u;
      },
      register: async (input) => {
        const u = registerUser(input);
        setUser(u);
        return u;
      },
      logout: () => {
        logoutUser();
        setUser(null);
      },
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
