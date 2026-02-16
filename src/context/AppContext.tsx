import React, { createContext, useContext, useState, useCallback } from "react";
import { RoleInfo } from "@/types/roadmap";
import { mockRoles } from "@/data/mockData";

interface AppState {
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  roles: RoleInfo[];
  setRoles: React.Dispatch<React.SetStateAction<RoleInfo[]>>;
  addRole: (role: RoleInfo) => void;
  removeRole: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState<RoleInfo[]>(mockRoles);

  const addRole = useCallback((role: RoleInfo) => {
    setRoles((prev) => [...prev, role]);
  }, []);

  const removeRole = useCallback((id: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{ isAdmin, setIsAdmin, roles, setRoles, addRole, removeRole }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
}
