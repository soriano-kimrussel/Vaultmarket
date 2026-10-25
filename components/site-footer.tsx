import { LogoMark } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <LogoMark className="size-6 rounded-md [&_svg]:size-3" />
          <span>Vaultmarket — confidential by design.</span>
        </div>
        <p>Built with Next.js, Supabase Auth, RLS, Storage & Realtime.</p>
      </div>
    </footer>
  );
}
