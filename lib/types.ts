export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string | null;
};

export type Item = {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  cover_url: string | null;
  created_at: string | null;
};

export type ItemSensitive = {
  item_id: string;
  confidential_notes: string | null;
  price: number | null;
  document_path: string | null;
};

export type NdaSignature = {
  id: string;
  user_id: string;
  item_id: string;
  signature_name: string | null;
  signed_at: string | null;
};

export type DownloadAudit = {
  id: string;
  user_id: string;
  item_id: string | null;
  downloaded_at: string | null;
};
