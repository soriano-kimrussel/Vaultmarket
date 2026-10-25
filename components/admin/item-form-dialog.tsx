"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon, LockIcon, UploadIcon } from "lucide-react";
import type { AdminItem } from "@/components/admin/admin-console";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AdminItem | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const isEdit = Boolean(item);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch(isEdit ? `/api/admin/items/${item!.id}` : "/api/admin/items", {
      method: isEdit ? "PATCH" : "POST",
      body: form,
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string; warning?: string };
    setSaving(false);
    if (!res.ok) {
      toast.error(isEdit ? "Update failed" : "Create failed", { description: body.error });
      return;
    }
    if (body.warning) toast.warning("Saved with a warning", { description: body.warning });
    else toast.success(isEdit ? "Listing updated" : "Listing published", {
      description: isEdit ? undefined : "Members see it live on the marketplace.",
    });
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit listing" : "New listing"}</DialogTitle>
          <DialogDescription>
            Public fields go to <code className="font-mono text-xs">items</code>; confidential fields go to{" "}
            <code className="font-mono text-xs">item_sensitive</code>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required defaultValue={item?.title} placeholder="Project Cascade" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" defaultValue={item?.category ?? ""} placeholder="Real Estate" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover_url">Cover image URL</Label>
              <Input id="cover_url" name="cover_url" type="url" defaultValue={item?.cover_url ?? ""} placeholder="https://…" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="summary">Public teaser</Label>
              <Textarea id="summary" name="summary" defaultValue={item?.summary ?? ""} placeholder="What members see before signing." />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <LockIcon className="size-3.5" /> Confidential
            </span>
            <Separator className="flex-1" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                defaultValue={item?.item_sensitive?.price ?? ""}
                placeholder="1250000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document_path">Document path in client-docs</Label>
              <Input
                id="document_path"
                name="document_path"
                defaultValue={item?.item_sensitive?.document_path ?? ""}
                placeholder="atlas.pdf"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="confidential_notes">Confidential notes</Label>
              <Textarea
                id="confidential_notes"
                name="confidential_notes"
                defaultValue={item?.item_sensitive?.confidential_notes ?? ""}
                placeholder="Only visible after NDA."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="document">Upload document (optional)</Label>
              <label
                htmlFor="document"
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60"
              >
                <UploadIcon className="size-4" />
                <span className="truncate">{fileName ?? "Choose a PDF to store in the private bucket"}</span>
              </label>
              <input
                id="document"
                name="document"
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={saving}>
              {saving && <Loader2Icon className="animate-spin" />}
              {isEdit ? "Save changes" : "Publish listing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
