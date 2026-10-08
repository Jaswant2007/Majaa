"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Role, SessionUser, ROLE_LABELS } from "@/lib/auth";

interface AuthContextType {
  user: SessionUser | null;
  role: Role;
  roleLabel: string;
  permissions: string[];
  isLoading: boolean;
  switchRole: (newRole: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: "ENTERPRISE_ADMIN",
  roleLabel: "Enterprise Admin",
  permissions: [],
  isLoading: true,
  switchRole: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [role, setRole] = useState<Role>("ENTERPRISE_ADMIN");
  const [roleLabel, setRoleLabel] = useState<string>("Enterprise Admin");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setRole(data.user.role);
        setRoleLabel(data.roleLabel);
        setPermissions(data.permissions || []);
      }
    } catch (err) {
      console.error("Auth fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const switchRole = async (newRole: Role) => {
    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        await fetchSession();
      }
    } catch (err) {
      console.error("Failed to switch role:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        roleLabel,
        permissions,
        isLoading,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
