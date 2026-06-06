import { useState, useEffect, useCallback } from "react";
import { reconcileSettings } from "@/lib/settingsSync";

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  is_admin?: number;
  isAdmin?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/me");
      const data = await r.json();
      setUser(data.user || null);
      if (data.user) await reconcileSettings();
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { user, setUser, loading, refresh };
}