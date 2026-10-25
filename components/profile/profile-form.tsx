"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CameraIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";

const MAX_BYTES = 2 * 1024 * 1024;

export function ProfileForm({
  userId,
  email,
  initialName,
  initialAvatar,
}: {
  userId: string;
  email: string;
  initialName: string;
  initialAvatar: string | null;
}) {
  const router = useRouter();
  const { profile, setProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await createClient()
      .from("profiles")
      .update({ display_name: name.trim() || null })
      .eq("id", userId)
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error("Could not save profile", { description: error.message });
      return;
    }
    setProfile(data);
    toast.success("Profile updated");
    router.refresh();
  }

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image too large", { description: "Maximum size is 2 MB." });
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as { avatar_url?: string; error?: string };
      if (!res.ok || !body.avatar_url) throw new Error(body.error || "Upload failed");
      setAvatar(body.avatar_url);
      if (profile) setProfile({ ...profile, avatar_url: body.avatar_url });
      toast.success("Avatar updated");
      router.refresh();
    } catch (err) {
      toast.error("Avatar upload failed", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="group relative rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-label="Change avatar"
        >
          <Avatar className="size-20 text-xl ring-4 ring-background shadow-md">
            {avatar && <AvatarImage src={avatar} alt={name} />}
            <AvatarFallback className="text-xl">{initials(name || email)}</AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-disabled:opacity-100">
            {uploading ? <Loader2Icon className="size-5 animate-spin" /> : <CameraIcon className="size-5" />}
          </span>
        </button>
        <div className="space-y-1">
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading…" : "Upload new"}
          </Button>
          <p className="text-xs text-muted-foreground">PNG or JPG, up to 2 MB.</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="display-name">Display name</Label>
        <Input id="display-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={80} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
      </div>
      <Button type="submit" disabled={saving || name === initialName}>
        {saving ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
        Save changes
      </Button>
    </form>
  );
}
