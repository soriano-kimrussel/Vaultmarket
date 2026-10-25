create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text, avatar_url text, role text not null default 'user',
  created_at timestamptz default now());

create table items (
  id uuid primary key default gen_random_uuid(),
  title text not null, summary text, category text, cover_url text,
  created_at timestamptz default now());

create table item_sensitive (
  item_id uuid primary key references items(id) on delete cascade,
  confidential_notes text, price numeric, document_path text);

create table nda_signatures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  item_id uuid not null references items(id) on delete cascade,
  signature_name text, signed_at timestamptz default now(),
  unique(user_id, item_id));

create table download_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  item_id uuid references items(id) on delete set null,
  downloaded_at timestamptz default now());

alter table profiles enable row level security;
alter table items enable row level security;
alter table item_sensitive enable row level security;
alter table nda_signatures enable row level security;
alter table download_audit enable row level security;

-- helper to avoid recursive RLS on profiles
create function public.is_admin() returns boolean
language sql security definer stable as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin') $$;

-- auto-create a profile on signup
create function public.handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name) values (new.id, new.email);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- RPC to sign an NDA (runs as the user, RLS applies)
create function public.sign_nda(p_item_id uuid, p_signature text)
returns void language plpgsql security invoker as $$
begin
  insert into nda_signatures (item_id, signature_name)
  values (p_item_id, p_signature)
  on conflict (user_id, item_id) do nothing;
end $$;

-- policies
create policy "read own or admin profiles" on profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "update own profile" on profiles for update to authenticated
  using (id = auth.uid());

create policy "items readable" on items for select to authenticated using (true);
create policy "admins manage items" on items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "sensitive after NDA or admin" on item_sensitive for select to authenticated
  using (public.is_admin() or exists (select 1 from nda_signatures n
    where n.item_id = item_sensitive.item_id and n.user_id = auth.uid()));

create policy "manage own nda" on nda_signatures for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own audit insert" on download_audit for insert to authenticated
  with check (user_id = auth.uid());
create policy "own or admin audit read" on download_audit for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- storage: private confidential docs, download only if NDA signed or admin
create policy "download docs if signed or admin" on storage.objects for select to authenticated
  using (bucket_id = 'client-docs' and (public.is_admin()
    or exists (select 1 from nda_signatures n where n.user_id = auth.uid())));

-- seed
insert into items (id, title, summary, category) values
 ('11111111-1111-1111-1111-111111111111','Project Atlas','Public teaser for Atlas','Real Estate'),
 ('22222222-2222-2222-2222-222222222222','Project Borealis','Public teaser for Borealis','Energy');
insert into item_sensitive (item_id, confidential_notes, price, document_path) values
 ('11111111-1111-1111-1111-111111111111','Confidential Atlas details',1250000,'atlas.pdf'),
 ('22222222-2222-2222-2222-222222222222','Confidential Borealis details',890000,'borealis.pdf');
