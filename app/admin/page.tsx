import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DownloadIcon, LayersIcon, UsersIcon } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { AdminConsole, type AdminItem } from "@/components/admin/admin-console";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin" };

type AuditRow = {
  id: string;
  user_id: string;
  downloaded_at: string | null;
  items: { title: string } | null;
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { supabase, isAdmin } = await requireSession("/admin");
  if (!isAdmin) redirect("/marketplace");
  const { edit } = await searchParams;

  const [itemsRes, auditRes, profilesRes] = await Promise.all([
    supabase.from("items").select("*, item_sensitive(*)").order("created_at", { ascending: false }).returns<AdminItem[]>(),
    supabase
      .from("download_audit")
      .select("id, user_id, downloaded_at, items(title)", { count: "exact" })
      .order("downloaded_at", { ascending: false })
      .limit(8)
      .returns<AuditRow[]>(),
    supabase.from("profiles").select("id, display_name", { count: "exact" }),
  ]);

  const names = new Map((profilesRes.data ?? []).map((p) => [p.id as string, (p.display_name as string) ?? "Unknown"]));

  const stats = [
    { label: "Listings", value: itemsRes.data?.length ?? 0, icon: LayersIcon },
    { label: "Members", value: profilesRes.count ?? 0, icon: UsersIcon },
    { label: "Downloads (all users)", value: auditRes.count ?? 0, icon: DownloadIcon },
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Admin console"
        title="Manage listings"
        description="Admins bypass NDA gating via is_admin() in RLS. Sensitive fields are written server-side with the service role."
        className="mb-10"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <s.icon className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {itemsRes.error ? (
            <p className="text-sm text-destructive">{itemsRes.error.message}</p>
          ) : (
            <AdminConsole items={itemsRes.data ?? []} editId={edit} />
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Recent downloads</CardTitle>
            <CardDescription>Visible to admins through the audit read policy.</CardDescription>
          </CardHeader>
          <CardContent>
            {(auditRes.data ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No downloads recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {(auditRes.data ?? []).map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.items?.title ?? "Deleted listing"}</p>
                      <p className="truncate text-xs text-muted-foreground">{names.get(a.user_id) ?? a.user_id.slice(0, 8)}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(a.downloaded_at, true)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
