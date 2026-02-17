import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { RoleInfo } from "@/types/roadmap";

const DEFAULT_ROLES: RoleInfo[] = [
  { id: "frontend-developer", name: "Frontend Developer", department: "Job Roles" },
  { id: "backend-developer", name: "Backend Developer", department: "Job Roles" },
  { id: "fullstack-developer", name: "Fullstack Developer", department: "Job Roles" },
  { id: "devops-engineer", name: "DevOps Engineer", department: "Job Roles" },
  { id: "data-engineer", name: "Data Engineer", department: "Job Roles" },
  { id: "ml-engineer", name: "ML Engineer", department: "Job Roles" },
];

interface AppState {
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  roles: RoleInfo[];
  setRoles: React.Dispatch<React.SetStateAction<RoleInfo[]>>;
  addRole: (role: RoleInfo) => void;
  addRoles: (roles: RoleInfo[]) => void;
  removeRole: (id: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdminState] = useState(() => {
    return localStorage.getItem("auth_status") === "authenticated";
  });

  const [roles, setRoles] = useState<RoleInfo[]>(() => {
    try {
      const saved = localStorage.getItem("roles_data");
      return saved ? JSON.parse(saved) : DEFAULT_ROLES;
    } catch {
      return DEFAULT_ROLES;
    }
  });

  // Persist roles to localStorage
  useEffect(() => {
    localStorage.setItem("roles_data", JSON.stringify(roles));
  }, [roles]);

  const setIsAdmin = useCallback((v: boolean) => {
    setIsAdminState(v);
    if (v) {
      localStorage.setItem("auth_status", "authenticated");
    } else {
      localStorage.removeItem("auth_status");
    }
  }, []);

  const addRole = useCallback((role: RoleInfo) => {
    setRoles((prev) => {
      if (prev.some((r) => r.id === role.id)) return prev;
      return [...prev, role];
    });
  }, []);

  const addRoles = useCallback((newRoles: RoleInfo[]) => {
    setRoles((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const filtered = newRoles.filter((r) => !existingIds.has(r.id));
      return [...prev, ...filtered];
    });
  }, []);

  const removeRole = useCallback((id: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const logout = useCallback(() => {
    setIsAdminState(false);
    localStorage.removeItem("auth_status");
  }, []);

  return (
    <AppContext.Provider
      value={{ isAdmin, setIsAdmin, roles, setRoles, addRole, addRoles, removeRole, logout }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
}
