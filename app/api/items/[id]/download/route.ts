import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: sensitive, error } = await supabase
    .from("item_sensitive")
    .select("document_path")
    .eq("item_id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!sensitive) return NextResponse.json({ error: "Sign this listing's NDA first." }, { status: 403 });
  if (!sensitive.document_path) return NextResponse.json({ error: "No document attached." }, { status: 404 });

  const { data: signed, error: signError } = await supabase.storage
    .from("client-docs")
    .createSignedUrl(sensitive.document_path, 60, { download: true });

  if (signError || !signed) {
    const missing = /not found/i.test(signError?.message ?? "");
    return NextResponse.json(
      {
        error: missing
          ? `The file "${sensitive.document_path}" is missing from the client-docs bucket. Upload it in Supabase Storage or run npm run seed:docs.`
          : signError?.message ?? "Could not create signed URL",
      },
      { status: missing ? 404 : 500 },
    );
  }

  const { error: auditError } = await supabase.from("download_audit").insert({ item_id: id });
  if (auditError) return NextResponse.json({ error: `Audit failed: ${auditError.message}` }, { status: 500 });

  return NextResponse.json({ url: signed.signedUrl });
}
