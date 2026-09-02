import { createContext, useContext, useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import { loadSession, loginUser, logoutUser, registerUser, updateSessionTimestamp, type RegisterInput } from "@/utils/auth";
import type { AppUser } from "@/types/Certificate";

interface AuthValue {
  user: AppUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  register: (input: RegisterInput) => Promise<AppUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

const SESSION_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setUser(loadSession());
    setReady(true);
  }, []);

  // Setup inactivity timeout and activity listeners when user is logged in
  useEffect(() => {
    if (!user) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    const resetInactivityTimer = () => {
      // Update session timestamp to keep it alive
      updateSessionTimestamp();
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      
      // Set new timeout for 3 minutes of inactivity
      inactivityTimerRef.current = setTimeout(() => {
        logoutUser();
        setUser(null);
      }, SESSION_TIMEOUT_MS);
    };

    // Set initial timer
    resetInactivityTimer();

    // Add event listeners for user activity
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    const handleActivity = () => resetInactivityTimer();

    events.forEach((event) => window.addEventListener(event, handleActivity, true));

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      events.forEach((event) => window.removeEventListener(event, handleActivity, true));
    };
  }, [user]);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      login: async (email, password) => {
        const u = await loginUser(email, password);
        setUser(u);
        return u;
      },
      register: async (input) => {
        const u = await registerUser(input);
        setUser(u);
        return u;
      },
      logout: () => {
        logoutUser();
        setUser(null);
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
          inactivityTimerRef.current = null;
        }
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
