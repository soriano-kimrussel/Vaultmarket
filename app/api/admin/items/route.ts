import { NextResponse } from "next/server";
import { parseItemForm, requireAdmin, saveSensitive, SERVICE_ROLE_MISSING, validateDocument } from "@/lib/admin-items";

export async function POST(request: Request) {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx.response;
  if (!ctx.service) return NextResponse.json({ error: SERVICE_ROLE_MISSING }, { status: 500 });

  const { item, sensitive, document, invalidPrice } = parseItemForm(await request.formData());
  if (!item.title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (invalidPrice) return NextResponse.json({ error: "Price must be a number" }, { status: 400 });
  const docError = validateDocument(document);
  if (docError) return NextResponse.json({ error: docError }, { status: 400 });

  const { data: created, error } = await ctx.supabase
    .from("items")
    .insert({ ...item, title: item.title })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sensitiveError = await saveSensitive(ctx.service, created.id, sensitive, document);
  if (sensitiveError) {
    return NextResponse.json({ id: created.id, warning: `Listing created, but confidential data failed: ${sensitiveError}` });
  }

  return NextResponse.json({ id: created.id }, { status: 201 });
}
