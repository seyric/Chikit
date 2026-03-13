import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, User } from "@workspace/api-client-react";

// Intercept fetch to add Bearer token automatically
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem("chikit_token");
  if (token) {
    init = init || {};
    init.headers = {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return originalFetch(input, init);
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("chikit_token"));

  // We query 'me' if token exists
  const { data: user, isLoading, isError, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  // If token is invalid, clear it
  useEffect(() => {
    if (isError) {
      console.error("[Auth] Token invalid or expired", error);
      localStorage.removeItem("chikit_token");
      setToken(null);
    }
  }, [isError, error]);

  const login = (newToken: string) => {
    localStorage.setItem("chikit_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("chikit_token");
    setToken(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading: isLoading && !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
