"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRightIcon, Loader2Icon, MailCheckIcon, MailIcon, KeyRoundIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/utils";

type Mode = "signin" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicSentTo, setMagicSentTo] = useState<string | null>(null);

  useEffect(() => {
    const error = params.get("error");
    if (error) toast.error("Authentication failed", { description: error });
  }, [params]);

  const isSignup = mode === "signup";
  const altHref = `${isSignup ? "/login" : "/signup"}${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`;

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setLoading(false);
        toast.error("Sign up failed", { description: error.message });
        return;
      }
      if (!data.session) {
        setLoading(false);
        setMagicSentTo(email);
        toast.success("Confirm your email", { description: "We sent you a confirmation link." });
        return;
      }
      if (displayName.trim() && data.user) {
        await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("id", data.user.id);
      }
      toast.success("Welcome to Vaultmarket", { description: "Your profile was created automatically." });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        toast.error("Sign in failed", { description: error.message });
        return;
      }
      toast.success("Signed in", { description: "Welcome back." });
    }

    router.replace(next);
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        shouldCreateUser: true,
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Could not send magic link", { description: error.message });
      return;
    }
    setMagicSentTo(email);
    toast.success("Magic link sent", { description: `Check ${email} to continue.` });
  }

  if (magicSentTo) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm animate-fade-up">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <MailCheckIcon className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a secure link to <span className="font-medium text-foreground">{magicSentTo}</span>. Open it on this
          device to continue.
        </p>
        <Button variant="ghost" className="mt-6" onClick={() => setMagicSentTo(null)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-2 text-muted-foreground">
        {isSignup ? "Join the marketplace to browse confidential listings." : "Sign in to access your deal room."}
      </p>

      <Tabs defaultValue="password" className="mt-8">
        <TabsList>
          <TabsTrigger value="password">
            <KeyRoundIcon className="size-4" /> Password
          </TabsTrigger>
          <TabsTrigger value="magic">
            <MailIcon className="size-4" /> Magic link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="password">
          <form onSubmit={handlePassword} className="mt-2 space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2Icon className="animate-spin" /> : <ArrowRightIcon />}
              {isSignup ? "Create account" : "Sign in"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="magic">
          <form onSubmit={handleMagicLink} className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="magic-email">Email</Label>
              <Input
                id="magic-email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2Icon className="animate-spin" /> : <MailIcon />}
              Email me a sign-in link
            </Button>
            <p className="text-center text-xs text-muted-foreground">No password needed. Works for new and existing accounts.</p>
          </form>
        </TabsContent>
      </Tabs>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {isSignup ? "Already have an account?" : "New to Vaultmarket?"}{" "}
        <Link href={altHref} className="font-medium text-foreground underline-offset-4 hover:underline">
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
