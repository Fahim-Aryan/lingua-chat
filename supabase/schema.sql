-- ============================================================
-- Lingua — Supabase schema (run in Supabase SQL Editor)
-- Users (profiles) + messages, RLS, storage bucket
-- ============================================================

-- 1) Profile table (links to auth.users)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  profile_picture text,
  preferred_language text not null default 'bn',
  created_at timestamptz not null default now()
);

-- 2) Message table (PRD §5.1)
create table if not exists public.messages (
  message_id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (user_id) on delete cascade,
  receiver_id uuid not null references public.profiles (user_id) on delete cascade,
  original_text text default '',
  translated_text text,
  source_language text not null default 'ja',
  target_language text not null default 'bn',
  media_url text,
  created_at timestamptz not null default now()
);

create index if not exists messages_conv_idx
  on public.messages (sender_id, receiver_id, created_at desc);

-- 3) Auto-create profile on signup (trigger)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, username, preferred_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'preferred_language', 'bn')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Row Level Security
alter table public.profiles enable row level security;
alter table public.messages enable row level security;

-- Profiles: anyone signed in can read; only owner can update
create policy "profiles_read" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);

-- Messages: only the two participants can read a conversation
create policy "messages_read_participants" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "messages_insert_sender" on public.messages
  for insert with check (auth.uid() = sender_id);

-- 5) Realtime: broadcast inserts on messages
alter publication supabase_realtime add table public.messages;

-- 6) Storage bucket for chat media (private; served via signed URLs)
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', false)
on conflict (id) do nothing;

create policy "chat_media_read_authenticated" on storage.objects
  for select using (bucket_id = 'chat-media' and auth.role() = 'authenticated');

create policy "chat_media_insert_authenticated" on storage.objects
  for insert with check (bucket_id = 'chat-media' and auth.role() = 'authenticated');
