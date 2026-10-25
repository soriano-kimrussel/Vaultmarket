import Link from "next/link";
import {
  ArrowRightIcon,
  DatabaseZapIcon,
  FileLock2Icon,
  FingerprintIcon,
  KeyRoundIcon,
  RadioIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  SignatureIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const features = [
  { icon: FingerprintIcon, title: "Supabase Auth", body: "Email + password and passwordless magic links, with sessions refreshed in Next.js middleware." },
  { icon: ShieldCheckIcon, title: "Row Level Security", body: "Sensitive columns live in a separate table that Postgres only returns after you sign that deal's NDA." },
  { icon: SignatureIcon, title: "RPC signing", body: "Typed signatures call sign_nda(), a security-invoker function, so RLS still applies." },
  { icon: DatabaseZapIcon, title: "Triggers", body: "A Postgres trigger creates your profile the instant you sign up. No client code involved." },
  { icon: FileLock2Icon, title: "Private storage", body: "Confidential PDFs sit in a private bucket and are served through 60-second signed URLs." },
  { icon: ScrollTextIcon, title: "Audit trail", body: "Every download is written to an audit table that only you and admins can read." },
  { icon: KeyRoundIcon, title: "Roles", body: "An is_admin() helper powers admin policies without recursive RLS on profiles." },
  { icon: RadioIcon, title: "Realtime", body: "New listings stream into the marketplace live via Supabase Realtime." },
];

export default async function HomePage() {
  const { user } = isSupabaseConfigured ? await getSession() : { user: null };

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,black,transparent)]" />
        <div className="absolute top-[-12rem] left-1/2 h-[32rem] w-[56rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-brand/25 via-violet-500/20 to-fuchsia-500/20 blur-3xl" />
      </div>

      <section className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <Badge variant="brand" className="mb-6 px-3 py-1">
            <ShieldCheckIcon /> Enforced in Postgres, not in the browser
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            The deal room where secrets{" "}
            <span className="bg-gradient-to-r from-brand via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              unlock on signature
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-balance">
            Browse public teasers, sign a digital NDA, and watch confidential pricing, notes and documents appear —
            because the database itself now allows it.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="brand">
              <Link href={user ? "/marketplace" : "/signup"}>
                {user ? "Open marketplace" : "Create free account"} <ArrowRightIcon />
              </Link>
            </Button>
            {!user && (
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="relative mx-auto mt-20 max-w-4xl animate-fade-up [animation-delay:150ms]">
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-brand/30 to-transparent blur-sm" />
          <div className="relative grid gap-4 rounded-3xl border bg-card/80 p-4 shadow-2xl shadow-brand/5 backdrop-blur sm:grid-cols-2 sm:p-6">
            <PreviewCard locked />
            <PreviewCard />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">What's under the hood</h2>
          <p className="mt-3 text-muted-foreground">Every feature maps to a real Supabase primitive.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                <f.icon className="size-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PreviewCard({ locked = false }: { locked?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      <div
        className="h-28"
        style={{
          background: locked ? "linear-gradient(135deg,#6366f1,#a855f7)" : "linear-gradient(135deg,#10b981,#0ea5e9)",
        }}
      />
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{locked ? "Project Atlas" : "Project Borealis"}</p>
          <Badge variant={locked ? "warning" : "success"}>{locked ? "NDA required" : "Unlocked"}</Badge>
        </div>
        {locked ? (
          <div className="space-y-2">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
            <div className="h-8 w-28 rounded-lg bg-muted" />
          </div>
        ) : (
          <div className="space-y-1.5 text-sm">
            <p className="text-muted-foreground">Asking price</p>
            <p className="text-2xl font-semibold tracking-tight">$890,000</p>
            <p className="text-muted-foreground">Confidential Borealis details</p>
          </div>
        )}
      </div>
    </div>
  );
}
