// src/hooks/useAuth.ts
import { useEffect, useState } from "react";

export type UserSession = {
  type: "admin" | "portal" | null;
  role: string | null;
  profile: any;
};

export function useAuth() {
  const [session, setSession] = useState<UserSession>({
    type: null,
    role: null,
    profile: null,
  });

  useEffect(() => {
    // Primero revisa si es admin interno
    const adminProfile = localStorage.getItem("admin_profile");
    if (adminProfile) {
      const parsed = JSON.parse(adminProfile);
      setSession({
        type: "admin",
        role: parsed.role,
        profile: parsed,
      });
      return;
    }

    // Luego revisa si es usuario del portal (tienes guardado el token o perfil en otro lado)
    const portalToken = localStorage.getItem("portal_token"); // o como lo guardes
    if (portalToken) {
      try {
        const payload = JSON.parse(atob(portalToken.split(".")[1]));
        setSession({
          type: "portal",
          role: payload.role || "end_user",
          profile: payload,
        });
      } catch {}
    }
  }, []);

  return session;
}