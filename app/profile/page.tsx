import type { Metadata } from "next";
import Link from "next/link";
import { DownloadIcon, FileClockIcon, SignatureIcon, VaultIcon } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };

type AuditRow = {
  id: string;
  downloaded_at: string | null;
  item_id: string | null;
  items: { title: string; category: string | null } | null;
};

export default async function ProfilePage() {
  const { supabase, user, profile, isAdmin } = await requireSession("/profile");

  const [auditRes, sigCount] = await Promise.all([
    supabase
      .from("download_audit")
      .select("id, downloaded_at, item_id, items(title, category)", { count: "exact" })
      .eq("user_id", user.id)
      .order("downloaded_at", { ascending: false })
      .limit(50)
      .returns<AuditRow[]>(),
    supabase.from("nda_signatures").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const audits = auditRes.data ?? [];

  const stats = [
    { label: "NDAs signed", value: sigCount.count ?? 0, icon: SignatureIcon },
    { label: "Downloads", value: auditRes.count ?? audits.length, icon: DownloadIcon },
    { label: "Member since", value: formatDate(profile?.created_at ?? user.created_at), icon: VaultIcon },
  ];

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        eyebrow="Account"
        title="Profile & activity"
        description="Your profile row was created by a Postgres trigger the moment you signed up."
        actions={isAdmin ? <Badge variant="brand">Admin</Badge> : <Badge variant="secondary">Member</Badge>}
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
              <p className="text-xl font-semibold tracking-tight tabular-nums">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Public profile</CardTitle>
            <CardDescription>Update your name and avatar.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              userId={user.id}
              email={user.email ?? ""}
              initialName={profile?.display_name ?? ""}
              initialAvatar={profile?.avatar_url ?? null}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileClockIcon className="size-4 text-brand" /> Download audit log
            </CardTitle>
            <CardDescription>Every confidential document you've downloaded, recorded in download_audit.</CardDescription>
          </CardHeader>
          <CardContent>
            {auditRes.error ? (
              <p className="text-sm text-destructive">{auditRes.error.message}</p>
            ) : audits.length === 0 ? (
              <EmptyState
                icon={DownloadIcon}
                title="No downloads yet"
                description="Downloads from unlocked listings will be logged here."
                className="py-10"
              />
            ) : (
              <ol className="relative space-y-1 before:absolute before:top-3 before:bottom-3 before:left-[15px] before:w-px before:bg-border">
                {audits.map((a) => (
                  <li key={a.id} className="relative flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-muted/50">
                    <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
                      <DownloadIcon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {a.item_id && a.items ? (
                        <Link href={`/items/${a.item_id}`} className="truncate text-sm font-medium hover:underline">
                          {a.items.title}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground italic">Deleted listing</span>
                      )}
                      <p className="text-xs text-muted-foreground">{formatDate(a.downloaded_at, true)}</p>
                    </div>
                    {a.items?.category && <Badge variant="secondary">{a.items.category}</Badge>}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
