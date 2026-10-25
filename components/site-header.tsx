"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGridIcon, ShieldIcon, VaultIcon } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: "/marketplace", label: "Marketplace", icon: LayoutGridIcon },
    { href: "/vault", label: "My Vault", icon: VaultIcon },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldIcon }] : []),
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) || (href === "/marketplace" && pathname.startsWith("/items"));

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Logo href={user ? "/marketplace" : "/"} />

        {user && (
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  isActive(link.href) && "text-foreground",
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brand" />
                )}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          {user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-1.5">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Get started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {user && (
        <nav className="flex gap-1 overflow-x-auto border-t border-border/60 px-3 py-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
                isActive(link.href) ? "bg-secondary text-foreground" : "hover:text-foreground",
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
