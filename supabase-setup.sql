-- ============================================================
-- Kurd Technology — Supabase database setup
-- Run this ONCE in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- ---------- 1. PROFILES (role + ban system) ----------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text not null default 'user',              -- 'user' or 'owner'
  banned boolean not null default false,
  ban_reason text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- everyone can read profiles (needed so the admin list & chat can show names)
drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

-- a normal user may only edit their own row
drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- the owner may edit ANY row (needed for ban/unban + promoting roles)
drop policy if exists "owner can update any profile" on public.profiles;
create policy "owner can update any profile"
  on public.profiles for update
  using ( exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner'
  ) );

-- auto-create a profile row the moment someone signs up.
-- full_name is intentionally left blank here, even for Google sign-in —
-- the site always asks the person to pick their own display name once.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, null, 'user');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ---------- 2. MESSAGES (owner <-> user chat, text + voice) ----------
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users on delete cascade not null,
  receiver_id uuid references auth.users on delete cascade not null,
  content text,
  audio_url text,
  created_at timestamptz default now(),
  read boolean not null default false
);

alter table public.messages enable row level security;

drop policy if exists "see own conversations" on public.messages;
create policy "see own conversations"
  on public.messages for select
  using ( auth.uid() = sender_id or auth.uid() = receiver_id );

-- only the owner may start a conversation with anyone; a normal user may
-- only ever send messages back to the owner (keeps it a real support chat,
-- not an open free-for-all between random users)
drop policy if exists "send messages" on public.messages;
create policy "send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
      or receiver_id in (select id from public.profiles where role = 'owner')
    )
  );

drop policy if exists "mark own received messages read" on public.messages;
create policy "mark own received messages read"
  on public.messages for update
  using ( auth.uid() = receiver_id );

-- realtime updates so chat feels instant
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;


-- ---------- 3. STORAGE bucket for voice messages ----------
insert into storage.buckets (id, name, public)
values ('voice-messages', 'voice-messages', true)
on conflict (id) do nothing;

drop policy if exists "anyone signed in can upload voice notes" on storage.objects;
create policy "anyone signed in can upload voice notes"
  on storage.objects for insert
  with check ( bucket_id = 'voice-messages' and auth.role() = 'authenticated' );

drop policy if exists "voice notes are publicly readable" on storage.objects;
create policy "voice notes are publicly readable"
  on storage.objects for select
  using ( bucket_id = 'voice-messages' );


-- ---------- 4. RATINGS (real "user satisfaction" %) ----------
create table if not exists public.ratings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  stars int not null check (stars between 1 and 5),
  created_at timestamptz default now()
);
alter table public.ratings enable row level security;

drop policy if exists "users can insert own rating" on public.ratings;
create policy "users can insert own rating"
  on public.ratings for insert
  with check ( auth.uid() = user_id );

drop policy if exists "users can view own rating" on public.ratings;
create policy "users can view own rating"
  on public.ratings for select
  using ( auth.uid() = user_id );

-- a small view that exposes only the AVERAGE (never individual answers)
-- so the homepage can show a real "user satisfaction" percentage.
create or replace view public.ratings_summary as
  select
    coalesce(round(avg(stars) / 5.0 * 100), 0) as satisfaction_pct,
    count(*) as total_ratings
  from public.ratings;

grant select on public.ratings_summary to authenticated;


-- ---------- 5. SITE SECTIONS (owner-managed homepage cards) ----------
create table if not exists public.site_sections (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text default '',
  image_url text default '',
  icon text default 'star',
  link text default '#',
  color text default '#F5B800',
  card_style text default 'games',
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users
);
alter table public.site_sections enable row level security;

-- everyone can see the sections that are turned on
drop policy if exists "visible sections are viewable by everyone" on public.site_sections;
create policy "visible sections are viewable by everyone"
  on public.site_sections for select
  using ( is_visible = true );

-- the owner can see everything, including hidden sections, to manage them
drop policy if exists "owner can view all sections" on public.site_sections;
create policy "owner can view all sections"
  on public.site_sections for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
  );

drop policy if exists "owner can insert sections" on public.site_sections;
create policy "owner can insert sections"
  on public.site_sections for insert
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
  );

drop policy if exists "owner can update sections" on public.site_sections;
create policy "owner can update sections"
  on public.site_sections for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
  );

drop policy if exists "owner can delete sections" on public.site_sections;
create policy "owner can delete sections"
  on public.site_sections for delete
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
  );

-- keep updated_at current automatically
create or replace function public.touch_site_sections()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists site_sections_touch on public.site_sections;
create trigger site_sections_touch
  before update on public.site_sections
  for each row execute procedure public.touch_site_sections();

-- seed with the 8 sections the homepage already shows, so switching to
-- the database-driven system changes nothing visually on first load.
-- (safe to re-run: only inserts if the table is currently empty)
insert into public.site_sections (title, description, icon, link, color, card_style, sort_order, is_visible)
select * from (values
  ('یاری و یاریگەکان', 'یاری خۆشو یاریگە جۆراوجۆرەکان بۆ کاتی بەتاڵی', 'gamepad',    '#',               '#4B3A93', 'games',   1, true),
  ('دروستکردنی CV',    'CVـیەکی جوان و پیشەیی بە شێواز و قاڵبی جوان دروست بکە', 'idcard', 'cv-builder.html', '#3E5988', 'cv',      2, true),
  ('هەلی کار',         'هەلی کار و کارمەندی جیاواز لە کوردستان', 'briefcase',  '#',               '#0E6E5E', 'jobs',    3, true),
  ('ئامرازەکانی AI',   'ئامرازە زیرەکەکان بۆ کار و فێربوون و زانیاری', 'robot', '#',               '#3B2E70', 'ai',      4, true),
  ('دیزاین و گرافیک',  'دروستکردنی دیزاین و وێنە بە ئامرازە جوانەکان', 'palette', '#',             '#7A5426', 'design',  5, true),
  ('فێربوون و کۆرس',   'کۆرس و وانەی فێربوونی پیشەیی و تایبەت', 'graduation', '#',                 '#1F6B45', 'courses', 6, true),
  ('وێنە و ڤیدیۆ',     'دەستکاری و ڕازاندنەوەی وێنە و ڤیدیۆ بە شێوازێکی ئاسان', 'image', '#',       '#23507F', 'media',   7, true),
  ('کۆد و وێبسایت',    'ئامراز بۆ کۆدنووسی و دروستکردنی وێبسایت', 'code', '#',                     '#6B6321', 'code',    8, true)
) as seed(title, description, icon, link, color, card_style, sort_order, is_visible)
where not exists (select 1 from public.site_sections);


-- ============================================================
-- LAST STEP — run this AFTER you have signed up once on the site
-- with ravyarhasan023@gmail.com, to make that account the owner:
-- ============================================================
-- update public.profiles set role = 'owner'
-- where id = (select id from auth.users where email = 'ravyarhasan023@gmail.com');
