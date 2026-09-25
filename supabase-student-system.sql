-- سیستەمی قوتابی — خشتەی داتابەیس
-- ئەمە جیایە لە supabase-setup.sql. کۆپی بکە و لە Supabase Dashboard -> SQL Editor
-- -> New Query بیخەرە ناو و "Run" لێبدە (یەک جار بەسە، هەمان پڕۆژەی Supabase-ی
-- ماڵپەڕی سەرەکی بەکاربهێنە، نەک پڕۆژەیەکی نوێ).

create table if not exists public.student_system (
  id text primary key default 'main',
  data jsonb not null,
  updated_at timestamptz default now() not null
);

alter table public.student_system enable row level security;

-- تەنها ئەو کەسانەی چوونەتە ژوورەوە (login کردوون) دەتوانن بیخوێننەوە و بیگۆڕن —
-- هاوشێوەی چۆنیەتی پارێزراوی student.html بە guard.js.
drop policy if exists "authenticated users can read student_system" on public.student_system;
create policy "authenticated users can read student_system"
  on public.student_system for select
  using (auth.role() = 'authenticated');

drop policy if exists "authenticated users can write student_system" on public.student_system;
create policy "authenticated users can write student_system"
  on public.student_system for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "authenticated users can update student_system" on public.student_system;
create policy "authenticated users can update student_system"
  on public.student_system for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ئارەزوومەندیش: ئەم دێڕە کارتێک زیاد دەکات لە پەڕەی سەرەکی (services.html)
-- بۆ ئەوەی خەڵک "سیستەمی قوتابی" ببینن و کرتەی لێ بکەن. ئەگەر پێشتر
-- کارتێکی هاوشێوەت هەیە پەیڕەوی مەکە، یان بڕۆ Table Editor -> site_sections
-- و بە دەست زیادی بکە.
insert into public.site_sections (title, description, icon, link, card_style, sort_order, is_visible)
values ('سیستەمی قوتابی', 'پلاتفۆرمی فێربوون و تاقیکردنەوە بۆ پۆلەکانی ١٠، ١١ و ١٢', 'graduation', 'student.html', 'games', 0, true);
