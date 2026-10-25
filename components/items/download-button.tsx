"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DownloadIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DownloadButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function download() {
    setLoading(true);
    try {
      const res = await fetch(`/api/items/${itemId}/download`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error || "Download failed");
      toast.success("Download started", { description: "Link expires in 60 seconds. This access was logged." });
      window.location.assign(body.url);
      router.refresh();
    } catch (err) {
      toast.error("Download failed", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={download} disabled={loading}>
      {loading ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
      Download
    </Button>
  );
}
