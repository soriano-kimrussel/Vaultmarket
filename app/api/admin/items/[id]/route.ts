import { NextResponse } from "next/server";
import { parseItemForm, requireAdmin, saveSensitive, SERVICE_ROLE_MISSING, validateDocument } from "@/lib/admin-items";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx.response;
  if (!ctx.service) return NextResponse.json({ error: SERVICE_ROLE_MISSING }, { status: 500 });

  const { item, sensitive, document, invalidPrice } = parseItemForm(await request.formData());
  if (!item.title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (invalidPrice) return NextResponse.json({ error: "Price must be a number" }, { status: 400 });
  const docError = validateDocument(document);
  if (docError) return NextResponse.json({ error: docError }, { status: 400 });

  const { data: updated, error } = await ctx.supabase
    .from("items")
    .update({ ...item, title: item.title })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const sensitiveError = await saveSensitive(ctx.service, id, sensitive, document);
  if (sensitiveError) return NextResponse.json({ error: sensitiveError }, { status: 500 });

  return NextResponse.json({ id });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx.response;

  const { data, error } = await ctx.supabase.from("items").delete().eq("id", id).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  return NextResponse.json({ id });
}
