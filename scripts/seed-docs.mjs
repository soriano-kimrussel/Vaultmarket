import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const docs = [
  {
    path: "atlas.pdf",
    title: "Project Atlas",
    lines: [
      "Confidential Information Memorandum",
      "Sector: Real Estate",
      "Asking price: $1,250,000",
      "Portfolio of mixed-use properties with stable occupancy.",
      "Distribution restricted to parties bound by NDA.",
    ],
  },
  {
    path: "borealis.pdf",
    title: "Project Borealis",
    lines: [
      "Confidential Information Memorandum",
      "Sector: Energy",
      "Asking price: $890,000",
      "Renewable generation assets with long-term offtake agreements.",
      "Distribution restricted to parties bound by NDA.",
    ],
  },
];

function escapePdf(text) {
  return text.replace(/[\\()]/g, (c) => `\\${c}`);
}

function buildPdf(title, lines) {
  const content = [
    "BT /F1 26 Tf 72 720 Td",
    `(${escapePdf(title)}) Tj`,
    "/F1 12 Tf 0 -40 Td",
    ...lines.flatMap((line) => [`(${escapePdf(line)}) Tj`, "0 -22 Td"]),
    "0 -40 Td (Generated sample document for Vaultmarket.) Tj",
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

for (const doc of docs) {
  const { error } = await supabase.storage
    .from("client-docs")
    .upload(doc.path, buildPdf(doc.title, doc.lines), { contentType: "application/pdf", upsert: false });
  if (error && !/exists|duplicate/i.test(error.message)) {
    console.error(`Failed to upload ${doc.path}: ${error.message}`);
    process.exitCode = 1;
  } else {
    console.log(error ? `${doc.path} already exists, skipped` : `Uploaded ${doc.path}`);
  }
}
