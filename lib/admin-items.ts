import "server-only";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_DOC_BYTES = 4 * 1024 * 1024;

type AdminContext =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; service: SupabaseClient | null }
  | { ok: false; response: NextResponse };

export async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error) return { ok: false, response: NextResponse.json({ error: error.message }, { status: 500 }) };
  if (!isAdmin) return { ok: false, response: NextResponse.json({ error: "Admins only" }, { status: 403 }) };

  return { ok: true, supabase, service: createAdminClient() };
}

function text(form: FormData, key: string) {
  const value = form.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function parseItemForm(form: FormData) {
  const priceRaw = text(form, "price");
  const price = priceRaw === null ? null : Number(priceRaw);
  const document = form.get("document");
  return {
    item: {
      title: text(form, "title"),
      summary: text(form, "summary"),
      category: text(form, "category"),
      cover_url: text(form, "cover_url"),
    },
    sensitive: {
      confidential_notes: text(form, "confidential_notes"),
      price: price !== null && Number.isFinite(price) ? price : null,
      document_path: text(form, "document_path"),
    },
    document: document instanceof File && document.size > 0 ? document : null,
    invalidPrice: priceRaw !== null && !Number.isFinite(price),
  };
}

export function validateDocument(file: File | null) {
  if (!file) return null;
  if (file.type !== "application/pdf") return "Document must be a PDF";
  if (file.size > MAX_DOC_BYTES) return "Document must be 4 MB or smaller";
  return null;
}

export async function saveSensitive(
  service: SupabaseClient,
  itemId: string,
  sensitive: ReturnType<typeof parseItemForm>["sensitive"],
  document: File | null,
) {
  let documentPath = sensitive.document_path;
  if (document) {
    const safeName = document.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
    documentPath = `${itemId}/${safeName}`;
    const { error } = await service.storage
      .from("client-docs")
      .upload(documentPath, document, { contentType: "application/pdf", upsert: true });
    if (error) return error.message;
  }

  const { error } = await service
    .from("item_sensitive")
    .upsert({ item_id: itemId, ...sensitive, document_path: documentPath }, { onConflict: "item_id" });
  return error?.message ?? null;
}

export const SERVICE_ROLE_MISSING =
  "SUPABASE_SERVICE_ROLE_KEY is not configured on the server, so confidential fields cannot be written.";
