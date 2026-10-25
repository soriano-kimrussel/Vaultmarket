"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOutIcon, ShieldIcon, UserIcon, VaultIcon } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";

export function UserMenu() {
  const { user, profile, isAdmin } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const name = profile?.display_name || user?.email || "Account";

  async function signOut() {
    setSigningOut(true);
    const { error } = await createClient().auth.signOut();
    setSigningOut(false);
    if (error) {
      toast.error("Could not sign out", { description: error.message });
      return;
    }
    toast.success("Signed out", { description: "See you next time." });
    router.replace("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <Avatar className="size-9 ring-2 ring-background transition hover:ring-brand/40">
          {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={name} />}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="flex items-center gap-2 truncate font-semibold">
            <span className="truncate">{name}</span>
            {isAdmin && <Badge variant="brand">Admin</Badge>}
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon /> Profile & activity
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/vault">
            <VaultIcon /> My Vault
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldIcon /> Admin console
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={signingOut} onSelect={signOut}>
          <LogOutIcon /> {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
