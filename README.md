# Vaultmarket

An NDA-gated deal marketplace built with **Next.js (App Router)**, **Supabase** and **shadcn/ui**.
Members browse public teasers; confidential pricing, notes and documents appear only after they sign that
listing's NDA, and the access rule lives in **Postgres Row Level Security**, not in the UI.

- **Live demo:** `https://YOUR-APP.vercel.app`
- **Test user:** `user@example.com` / `PASSWORD`
- **Test admin:** `admin@example.com` / `PASSWORD`

## What it demonstrates

| Supabase feature | Where it shows up |
| --- | --- |
| **Auth** | Email/password sign up & sign in, passwordless magic links, sign out. Sessions are refreshed server-side in the Next.js proxy (formerly middleware) via `@supabase/ssr`. |
| **Route protection** | `proxy.ts` (Next 16's name for middleware) redirects signed-out users away from `/marketplace`, `/items/*`, `/vault`, `/profile`, `/admin`, and signed-in users away from `/login` and `/signup`. Each case is a single server-side redirect, so it can't loop. |
| **Trigger** | `on_auth_user_created` runs `handle_new_user()` to insert a `profiles` row for every new user. |
| **RLS** | `item_sensitive` returns zero rows until the user has an `nda_signatures` row for that item (or is an admin). |
| **RPC** | The NDA modal calls `sign_nda(p_item_id, p_signature)`, a `security invoker` function, so RLS still applies. |
| **Roles** | `profiles.role = 'admin'` is checked by `is_admin()`, a `security definer` helper that avoids recursive RLS on `profiles`. |
| **Storage** | Avatars go in the public `avatars` bucket. Confidential PDFs live in the private `client-docs` bucket and are served through 60-second signed URLs. |
| **Audit** | Every download inserts a row into `download_audit`. Users see their own history on the profile page, and admins see everyone's. |
| **Realtime** | The marketplace subscribes to `postgres_changes` on `items`, so new listings appear live without a refresh. |

### Key RLS policies

```sql
create policy "sensitive after NDA or admin" on item_sensitive for select to authenticated
  using (public.is_admin() or exists (select 1 from nda_signatures n
    where n.item_id = item_sensitive.item_id and n.user_id = auth.uid()));

create policy "manage own nda" on nda_signatures for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "admins manage items" on items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "own or admin audit read" on download_audit for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "download docs if signed or admin" on storage.objects for select to authenticated
  using (bucket_id = 'client-docs' and (public.is_admin()
    or exists (select 1 from nda_signatures n where n.user_id = auth.uid())));
```

The full schema is in [`supabase/schema.sql`](supabase/schema.sql).

## Setup

### 1. Create a Supabase project

Create a new project at [supabase.com](https://supabase.com). Under **Project Settings → API**, copy the
project URL, the `anon` public key and the `service_role` key.

### 2. Run the schema

Open **SQL Editor**, paste the contents of `supabase/schema.sql` and run it. This creates the tables, RLS
policies, the `is_admin()` helper, the signup trigger, the `sign_nda` RPC and two seed listings.

### 3. Create storage buckets

Under **Storage**:

1. Create a bucket named **`avatars`** and mark it **Public**.
2. Create a bucket named **`client-docs`** and leave it **Private**.
3. Upload two sample PDFs to the root of `client-docs`, named exactly **`atlas.pdf`** and **`borealis.pdf`**.
   Or, after step 6, run `npm run seed:docs` to generate and upload them automatically.

### 4. Enable Realtime on `items`

Go to **Database → Publications → `supabase_realtime`** and enable the **`items`** table, or run:

```sql
alter publication supabase_realtime add table items;
```

### 5. Auth settings

- **Authentication → Providers → Email:** turn **off** "Confirm email".
- **Authentication → URL Configuration:** set **Site URL** to `http://localhost:3000` (your Vercel URL in
  production) and add `http://localhost:3000/auth/callback` and `https://YOUR-APP.vercel.app/auth/callback`
  to **Redirect URLs**. Magic links need this.

### 6. Environment variables

```bash
cp .env.local.example .env.local
```

| Variable | Where it's used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Used in route handlers to write `item_sensitive`, upload confidential documents and upload avatars, because the schema has no client-side write policies for these. |

### 7. Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### 8. Make an admin

Sign up, then in the SQL editor run:

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'admin@example.com');
```

Sign in as that user to see the **Admin** console. There you can create, edit and delete listings. Keep a
second browser open on `/marketplace` to watch new listings arrive in real time.

## Why the anon key is safe to expose

The `anon` key only identifies the project. It grants nothing on its own: every table has RLS enabled, and
the policies decide what each signed-in user can read or write. The `service_role` key bypasses RLS, so it
is read only in server route handlers (`lib/supabase/admin.ts` is marked `server-only`), is never prefixed
with `NEXT_PUBLIC_`, and is never sent to the browser.

## Deploy to Vercel

1. Import the repository in Vercel.
2. Add the three environment variables above.
3. Deploy, then add `https://YOUR-APP.vercel.app/auth/callback` to Supabase's redirect URLs.

## Hardening for production

The schema is deliberately compact for a demo. Before using it for real data:

- **`update own profile` has no column restriction**, so a user could change their own `role`. Add a
  `with check` that keeps `role` unchanged, or revoke `update (role)` from `authenticated`.
- **The `client-docs` storage policy matches any NDA signature, not the one for that document.** The app only
  hands out paths from `item_sensitive`, which RLS already scopes per item, but a direct API call could still
  sign a URL for another document. Join the object name to `item_sensitive.document_path` in the policy.
- Add `set search_path = public` to the `security definer` functions.

## Project structure

```
app/
  (auth)/login, (auth)/signup   Auth pages (password + magic link)
  auth/callback                 Code / token exchange for magic links
  marketplace                   Grid, search, category filter, realtime
  items/[id]                    Detail page, NDA modal, confidential panel
  vault                         Listings the user has unlocked
  profile                       Name, avatar upload, download audit log
  admin                         Admin console
  api/                          Download, avatar and admin route handlers
components/ui                   shadcn/ui components
lib/supabase                    Browser, server, middleware and service-role clients
proxy.ts                        Session refresh + route protection
supabase/schema.sql             Database schema, policies, functions, seed
```
