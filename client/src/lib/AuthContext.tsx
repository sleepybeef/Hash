import React, { createContext, useContext, useState, useEffect } from "react";

export type AuthUser = { username: string; id: string; isVerified: boolean } | null;

const AuthContext = createContext<{
  user: AuthUser;
  setUser: (user: AuthUser) => void;
}>({
  user: null,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("authUser");
    if (stored) {
      try {
        setUserState(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // Save user to localStorage on change
  const setUser = (u: AuthUser) => {
    setUserState(u);
    if (u) {
      localStorage.setItem("authUser", JSON.stringify(u));
    } else {
      localStorage.removeItem("authUser");
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
