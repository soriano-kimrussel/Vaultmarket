import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangleIcon, ArrowUpRightIcon, SignatureIcon, VaultIcon } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ItemCover } from "@/components/items/item-cover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Item, NdaSignature } from "@/lib/types";

export const metadata: Metadata = { title: "My Vault" };

type Row = NdaSignature & { items: Item | null };

export default async function VaultPage() {
  const { supabase, user } = await requireSession("/vault");

  const { data, error } = await supabase
    .from("nda_signatures")
    .select("*, items(*)")
    .eq("user_id", user.id)
    .order("signed_at", { ascending: false })
    .returns<Row[]>();

  const rows = (data ?? []).filter((r) => r.items);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="My Vault"
        title="Unlocked listings"
        description="Every listing you've signed an NDA for. Your signatures are private to you, enforced by RLS on nda_signatures."
        actions={
          rows.length > 0 && (
            <div className="rounded-xl border bg-card px-4 py-2 text-sm shadow-sm">
              <span className="text-2xl font-semibold tabular-nums">{rows.length}</span>{" "}
              <span className="text-muted-foreground">unlocked</span>
            </div>
          )
        }
        className="mb-10"
      />

      {error ? (
        <EmptyState icon={AlertTriangleIcon} title="Couldn't load your vault" description={error.message} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={VaultIcon}
          title="Your vault is empty"
          description="Sign an NDA on any listing to unlock its confidential data. It will appear here."
          action={
            <Button asChild variant="brand">
              <Link href="/marketplace">Browse marketplace</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {rows.map((row, i) => (
            <Link
              key={row.id}
              href={`/items/${row.item_id}`}
              className="group flex items-center gap-4 rounded-2xl border bg-card p-3 pr-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-fade-up sm:gap-5"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <ItemCover item={row.items!} className="size-16 shrink-0 rounded-xl sm:h-20 sm:w-32" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">{row.items!.title}</h3>
                  {row.items!.category && <Badge variant="secondary">{row.items!.category}</Badge>}
                </div>
                <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                  <SignatureIcon className="size-3.5 shrink-0" />
                  Signed as <span className="font-medium text-foreground">{row.signature_name}</span>
                  <span className="hidden sm:inline">· {formatDate(row.signed_at, true)}</span>
                </p>
              </div>
              <Badge variant="success" className="hidden sm:inline-flex">
                Unlocked
              </Badge>
              <ArrowUpRightIcon className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
