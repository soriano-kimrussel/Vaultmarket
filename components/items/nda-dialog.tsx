"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileSignatureIcon, Loader2Icon, SignatureIcon } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

export function NdaDialog({ itemId, itemTitle }: { itemId: string; itemTitle: string }) {
  const router = useRouter();
  const { profile, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [signature, setSignature] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, startTransition] = useTransition();

  const party = profile?.display_name || user?.email || "the Recipient";
  const today = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date());
  const canSign = signature.trim().length >= 2 && agreed && !submitting;

  async function sign(e: React.FormEvent) {
    e.preventDefault();
    if (!canSign) return;
    setSubmitting(true);
    const { error } = await createClient().rpc("sign_nda", {
      p_item_id: itemId,
      p_signature: signature.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not sign NDA", { description: error.message });
      return;
    }
    toast.success("NDA signed", { description: `${itemTitle} is now unlocked in your vault.` });
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="brand" size="lg" disabled={refreshing}>
          {refreshing ? <Loader2Icon className="animate-spin" /> : <FileSignatureIcon />}
          {refreshing ? "Unlocking…" : "Review & sign NDA"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SignatureIcon className="size-5 text-brand" /> Non-Disclosure Agreement
          </DialogTitle>
          <DialogDescription>Read carefully. Your typed name acts as your electronic signature.</DialogDescription>
        </DialogHeader>

        <form onSubmit={sign} className="space-y-5">
          <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Mutual NDA — {itemTitle}</p>
            <p>
              This agreement is entered into on {today} between Vaultmarket (the &ldquo;Discloser&rdquo;) and{" "}
              <span className="font-medium text-foreground">{party}</span> (the &ldquo;Recipient&rdquo;).
            </p>
            <p>
              <span className="font-medium text-foreground">1. Confidential information.</span> All pricing, notes, financials,
              documents and other non-public material relating to {itemTitle} shall be treated as strictly confidential.
            </p>
            <p>
              <span className="font-medium text-foreground">2. Use.</span> The Recipient will use Confidential Information solely to
              evaluate a potential transaction and will not disclose it to any third party without prior written consent.
            </p>
            <p>
              <span className="font-medium text-foreground">3. Records.</span> The Recipient acknowledges that access to and
              downloads of Confidential Information are logged and auditable.
            </p>
            <p>
              <span className="font-medium text-foreground">4. Term.</span> These obligations survive for two (2) years from the
              date of signature.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature">Type your full legal name</Label>
            <Input
              id="signature"
              autoFocus
              autoComplete="name"
              placeholder="Jane Appleseed"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="h-12 font-serif text-lg italic"
            />
            {signature.trim() && (
              <p className="text-xs text-muted-foreground animate-fade-up">
                Signing as <span className="font-medium text-foreground">{signature.trim()}</span>
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
            <span className="text-muted-foreground">
              I have read and agree to the terms above and understand this constitutes a binding electronic signature.
            </span>
          </label>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={!canSign}>
              {submitting ? <Loader2Icon className="animate-spin" /> : <SignatureIcon />}
              Sign & unlock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
