"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Profile } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  setProfile: (profile: Profile | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PROTECTED = ["/marketplace", "/items", "/vault", "/profile", "/admin"];

export function AuthProvider({
  initialUser,
  initialProfile,
  children,
}: {
  initialUser: User | null;
  initialProfile: Profile | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    setUser(initialUser);
    setProfile(initialProfile);
  }, [initialUser, initialProfile]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_OUT") {
        setProfile(null);
        const current = pathnameRef.current;
        if (PROTECTED.some((p) => current === p || current.startsWith(`${p}/`))) {
          router.replace("/login");
        }
        router.refresh();
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const value = useMemo(
    () => ({ user, profile, isAdmin: profile?.role === "admin", setProfile }),
    [user, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
