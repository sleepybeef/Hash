
import React, { createContext, useContext, useState, useEffect } from "react";

export type AuthUser = {
  username: string;
  id: string;
  isVerified: boolean;
  isModerator: boolean;
} | null;

type AuthState = {
  user: AuthUser;
  lastVerified: number | null;
};

const AuthContext = createContext<{
  user: AuthUser;
  setUser: (user: AuthUser) => void;
}>(
  {
    user: null,
    setUser: () => {},
  }
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser>(null);

  useEffect(() => {
    const stored = localStorage.getItem("authState");
    if (stored) {
      try {
        const parsed: AuthState = JSON.parse(stored);
        // Check expiry: 30 min = 1800000 ms
        if (
          parsed.lastVerified &&
          Date.now() - parsed.lastVerified > 1800000
        ) {
          // Expired, clear auth
          setUserState(null);
          localStorage.removeItem("authState");
        } else {
          setUserState(parsed.user);
        }
      } catch {}
    }
  }, []);

  const setUser = (u: AuthUser) => {
    setUserState(u);
    if (u) {
      // Set/refresh lastVerified timestamp
      localStorage.setItem(
        "authState",
        JSON.stringify({ user: u, lastVerified: Date.now() })
      );
    } else {
      localStorage.removeItem("authState");
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
