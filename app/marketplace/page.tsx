import type { Metadata } from "next";
import { AlertTriangleIcon } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { MarketplaceBrowser } from "@/components/items/marketplace-browser";
import { EmptyState } from "@/components/empty-state";
import { requireSession } from "@/lib/supabase/server";
import type { Item } from "@/lib/types";

export const metadata: Metadata = { title: "Marketplace" };

export default async function MarketplacePage() {
  const { supabase, user, isAdmin } = await requireSession("/marketplace");

  const [itemsRes, sigRes] = await Promise.all([
    supabase.from("items").select("*").order("created_at", { ascending: false }).returns<Item[]>(),
    supabase.from("nda_signatures").select("item_id").eq("user_id", user.id),
  ]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Marketplace"
        title="Confidential listings"
        description="Public teasers are visible to every member. Pricing, notes and documents unlock after you sign each listing's NDA."
        className="mb-10"
      />
      {itemsRes.error ? (
        <EmptyState
          icon={AlertTriangleIcon}
          title="Couldn't load listings"
          description={itemsRes.error.message}
        />
      ) : (
        <MarketplaceBrowser
          initialItems={itemsRes.data ?? []}
          unlockedIds={(sigRes.data ?? []).map((s) => s.item_id as string)}
          isAdmin={isAdmin}
        />
      )}
    </PageContainer>
  );
}
