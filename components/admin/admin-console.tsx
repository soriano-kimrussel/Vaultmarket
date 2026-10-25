"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileTextIcon, Loader2Icon, PencilIcon, PlusIcon, Trash2Icon, LayersIcon } from "lucide-react";
import { ItemCover } from "@/components/items/item-cover";
import { ItemFormDialog } from "@/components/admin/item-form-dialog";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { Item, ItemSensitive } from "@/lib/types";

export type AdminItem = Item & { item_sensitive: ItemSensitive | null };

export function AdminConsole({ items, editId }: { items: AdminItem[]; editId?: string }) {
  const router = useRouter();
  const initial = editId ? items.find((i) => i.id === editId) ?? null : null;
  const [editing, setEditing] = useState<AdminItem | null>(initial);
  const [open, setOpen] = useState(Boolean(initial));
  const [deleting, setDeleting] = useState<string | null>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(item: AdminItem) {
    setEditing(item);
    setOpen(true);
  }

  async function remove(item: AdminItem) {
    if (!window.confirm(`Delete "${item.title}"? This also removes its NDA signatures.`)) return;
    setDeleting(item.id);
    const res = await fetch(`/api/admin/items/${item.id}`, { method: "DELETE" });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setDeleting(null);
    if (!res.ok) {
      toast.error("Delete failed", { description: body.error });
      return;
    }
    toast.success("Listing deleted");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">All listings</h2>
        <Button variant="brand" onClick={openNew}>
          <PlusIcon /> New listing
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={LayersIcon}
          title="No listings yet"
          description="Create the first listing. Members on the marketplace will see it appear in real time."
          action={
            <Button onClick={openNew}>
              <PlusIcon /> Create listing
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-4 rounded-2xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:pr-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <ItemCover item={item} className="size-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/items/${item.id}`} className="truncate font-semibold hover:underline">
                      {item.title}
                    </Link>
                    {item.category && <Badge variant="secondary">{item.category}</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground tabular-nums">{formatPrice(item.item_sensitive?.price)}</span>
                    {item.item_sensitive?.document_path ? (
                      <span className="flex items-center gap-1">
                        <FileTextIcon className="size-3.5" /> {item.item_sensitive.document_path}
                      </span>
                    ) : (
                      <span>No document</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                  <PencilIcon /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${item.title}`}
                  onClick={() => remove(item)}
                  disabled={deleting === item.id}
                >
                  {deleting === item.id ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ItemFormDialog
        key={editing?.id ?? "new"}
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v && editId) router.replace("/admin");
        }}
        item={editing}
      />
    </div>
  );
}
