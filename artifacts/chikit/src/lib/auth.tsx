// @ts-nocheck
import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, User } from "@workspace/api-client-react";

export type PortalType = "staff" | "patient" | null;

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
  portalType: PortalType;
  selectedHospitalId: number | null;
  login: (
    token: string,
    portal?: PortalType,
    hospitalId?: number | null,
  ) => void;
  logout: () => void;
  setSelectedHospitalId: (id: number | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("chikit_token"),
  );
  const [portalType, setPortalType] = useState<PortalType>(() => {
    return (localStorage.getItem("chikit_portal") as PortalType) ?? null;
  });
  const [selectedHospitalId, setSelectedHospitalIdState] = useState<
    number | null
  >(() => {
    const v = localStorage.getItem("chikit_hospital_id");
    return v ? Number(v) : null;
  });

  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  useEffect(() => {
    if (isError) {
      console.error("[Auth] Token invalid or expired", error);
      localStorage.removeItem("chikit_token");
      setToken(null);
    }
  }, [isError, error]);

  const login = (
    newToken: string,
    portal: PortalType = "staff",
    hospitalId: number | null = null,
  ) => {
    localStorage.setItem("chikit_token", newToken);
    if (portal) localStorage.setItem("chikit_portal", portal);
    if (hospitalId)
      localStorage.setItem("chikit_hospital_id", String(hospitalId));
    setToken(newToken);
    setPortalType(portal);
    setSelectedHospitalIdState(hospitalId);
  };

  const logout = () => {
    localStorage.removeItem("chikit_token");
    localStorage.removeItem("chikit_portal");
    localStorage.removeItem("chikit_hospital_id");
    setToken(null);
    setPortalType(null);
    setSelectedHospitalIdState(null);
    window.location.href = "/login";
  };

  const setSelectedHospitalId = (id: number | null) => {
    if (id) localStorage.setItem("chikit_hospital_id", String(id));
    else localStorage.removeItem("chikit_hospital_id");
    setSelectedHospitalIdState(id);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: isLoading && !!token,
        portalType,
        selectedHospitalId,
        login,
        logout,
        setSelectedHospitalId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
