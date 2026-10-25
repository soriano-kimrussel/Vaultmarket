import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarIcon,
  DatabaseIcon,
  FileTextIcon,
  LockIcon,
  PencilIcon,
  ShieldCheckIcon,
  SignatureIcon,
  TagIcon,
} from "lucide-react";
import { PageContainer } from "@/components/page-header";
import { ItemCover } from "@/components/items/item-cover";
import { NdaDialog } from "@/components/items/nda-dialog";
import { DownloadButton } from "@/components/items/download-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Item, ItemSensitive, NdaSignature } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!UUID.test(id)) return { title: "Listing" };
  const { supabase } = await requireSession(`/items/${id}`);
  const { data } = await supabase.from("items").select("title").eq("id", id).maybeSingle();
  return { title: data?.title ?? "Listing" };
}

export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase, user, isAdmin } = await requireSession(`/items/${id}`);

  const [itemRes, sensitiveRes, signatureRes] = await Promise.all([
    supabase.from("items").select("*").eq("id", id).maybeSingle<Item>(),
    supabase.from("item_sensitive").select("*").eq("item_id", id).maybeSingle<ItemSensitive>(),
    supabase.from("nda_signatures").select("*").eq("item_id", id).eq("user_id", user.id).maybeSingle<NdaSignature>(),
  ]);

  if (itemRes.error) throw new Error(itemRes.error.message);
  const item = itemRes.data;
  if (!item) notFound();

  const sensitive = sensitiveRes.data;
  const signature = signatureRes.data;
  const unlocked = Boolean(sensitive);

  return (
    <PageContainer className="max-w-6xl">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground">
        <Link href="/marketplace">
          <ArrowLeftIcon /> All listings
        </Link>
      </Button>

      <ItemCover item={item} className="h-56 rounded-3xl shadow-xl sm:h-72">
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6 text-white sm:p-8">
          <div className="flex flex-wrap gap-2">
            {item.category && (
              <Badge variant="glass">
                <TagIcon /> {item.category}
              </Badge>
            )}
            <Badge variant="glass">
              <CalendarIcon /> Listed {formatDate(item.created_at)}
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight drop-shadow-sm sm:text-5xl">{item.title}</h1>
        </div>
      </ItemCover>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <section>
            <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Public teaser</h2>
            <p className="mt-3 text-lg leading-relaxed">{item.summary || "No public summary has been provided."}</p>
          </section>

          <section className="rounded-2xl border bg-muted/30 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <DatabaseIcon className="size-4 text-brand" /> How this page is protected
            </div>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                Teaser fields come from <code className="rounded bg-muted px-1 font-mono text-xs">items</code>, readable by any signed-in member.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                Price, notes and document path live in{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">item_sensitive</code>. Its RLS policy returns zero rows
                until an <code className="rounded bg-muted px-1 font-mono text-xs">nda_signatures</code> row exists for you.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                Documents are served from a private bucket through a 60-second signed URL, and each download is audited.
              </li>
            </ul>
          </section>

          {isAdmin && (
            <Button asChild variant="outline">
              <Link href={`/admin?edit=${item.id}`}>
                <PencilIcon /> Edit listing
              </Link>
            </Button>
          )}
        </div>

        <aside className="lg:col-span-2">
          <div className="sticky top-24 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <span className="flex items-center gap-2 font-semibold">
                {unlocked ? <ShieldCheckIcon className="size-4 text-emerald-500" /> : <LockIcon className="size-4 text-amber-500" />}
                Confidential data
              </span>
              {isAdmin ? (
                <Badge variant="brand">Admin access</Badge>
              ) : unlocked ? (
                <Badge variant="success">Unlocked</Badge>
              ) : (
                <Badge variant="warning">Locked</Badge>
              )}
            </div>

            {unlocked && sensitive ? (
              <div className="space-y-6 p-6 animate-reveal">
                <div>
                  <p className="text-sm text-muted-foreground">Asking price</p>
                  <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">{formatPrice(sensitive.price)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confidential notes</p>
                  <p className="mt-1.5 leading-relaxed whitespace-pre-line">{sensitive.confidential_notes || "—"}</p>
                </div>
                {sensitive.document_path ? (
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                      <FileTextIcon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{sensitive.document_path}</p>
                      <p className="text-xs text-muted-foreground">Private bucket · signed URL</p>
                    </div>
                    <DownloadButton itemId={item.id} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No document attached.</p>
                )}
                {signature && (
                  <div className="flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
                    <SignatureIcon className="size-3.5" />
                    Signed as <span className="font-medium text-foreground">{signature.signature_name}</span> on{" "}
                    {formatDate(signature.signed_at, true)}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative p-6">
                <div className="pointer-events-none space-y-5 blur-[6px] select-none" aria-hidden>
                  <div>
                    <p className="text-sm text-muted-foreground">Asking price</p>
                    <p className="mt-1 text-4xl font-semibold">$•,•••,•••</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-5/6 rounded bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                  </div>
                  <div className="h-14 rounded-xl bg-muted" />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-card/40 to-card/90 p-6 text-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
                    <LockIcon className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Sign the NDA to unlock</p>
                    <p className="mt-1 text-sm text-muted-foreground">Postgres hides these fields until you do.</p>
                  </div>
                  <NdaDialog itemId={item.id} itemTitle={item.title} />
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
