import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { parseTheme, THEME_COOKIE, themeClass } from "@/lib/theme";
import { cn } from "@/lib/utils";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Vaultmarket — NDA-gated deal room", template: "%s · Vaultmarket" },
  description:
    "A confidential marketplace where sensitive deal data unlocks only after a signed NDA, enforced by Postgres Row Level Security.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f12" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = isSupabaseConfigured
    ? await getSession()
    : { user: null, profile: null };
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(GeistSans.variable, GeistMono.variable, themeClass(theme))}
    >
      <body className="min-h-dvh font-sans">
        <ThemeProvider initialTheme={theme}>
          <AuthProvider initialUser={user} initialProfile={profile}>
            <div className="relative flex min-h-dvh flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
