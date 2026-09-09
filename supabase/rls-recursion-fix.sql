-- Corrige l'erreur "infinite recursion detected in policy for relation profiles".
-- A executer dans Supabase SQL Editor sur une base deja installee.

create or replace function public.current_federation_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select federation_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create table if not exists public.federation_members (
  id uuid primary key default gen_random_uuid(),
  federation_id uuid not null references public.federations(id) on delete cascade,
  full_name text not null,
  role public.app_role not null,
  email text,
  status public.profile_status not null default 'actif',
  sport text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.federation_members enable row level security;

create table if not exists public.federation_invitations (
  id uuid primary key default gen_random_uuid(),
  federation_id uuid not null references public.federations(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role public.app_role not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.federation_invitations enable row level security;

drop policy if exists "Users can view their federation" on public.federations;
drop policy if exists "Admins can manage their federation" on public.federations;
drop policy if exists "Admins can create their first federation" on public.federations;
drop policy if exists "Users can view federation profiles" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Admins can manage federation profiles" on public.profiles;
drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update their own profile link" on public.profiles;
drop policy if exists "Users can view federation members" on public.federation_members;
drop policy if exists "Admins can manage federation members" on public.federation_members;
drop policy if exists "Users can view federation alerts" on public.alerts;
drop policy if exists "Admins can manage federation alerts" on public.alerts;
drop policy if exists "Admins can manage federation invitations" on public.federation_invitations;

create policy "Users can view their federation"
on public.federations for select
using (id = public.current_federation_id());

create policy "Admins can manage their federation"
on public.federations for all
using (id = public.current_federation_id() and public.is_current_user_admin())
with check (id = public.current_federation_id());

create policy "Admins can create their first federation"
on public.federations for insert
with check (public.is_current_user_admin() and public.current_federation_id() is null);

create or replace function public.create_federation_for_current_user(
  federation_name text,
  federation_country text,
  federation_sports text[],
  federation_logo text default null
)
returns public.federations
language plpgsql
security definer
set search_path = public
as $$
declare
  new_federation public.federations;
begin
  if auth.uid() is null or not public.is_current_user_admin() then
    raise exception 'Administrateur non authentifie';
  end if;
  if public.current_federation_id() is not null then
    raise exception 'Une federation est deja associee a ce compte';
  end if;

  insert into public.federations (name, country, sports, logo_url)
  values (federation_name, federation_country, federation_sports, federation_logo)
  returning * into new_federation;

  update public.profiles
  set federation_id = new_federation.id, updated_at = now()
  where id = auth.uid();
  return new_federation;
end;
$$;

create policy "Users can view federation profiles"
on public.profiles for select
using (federation_id = public.current_federation_id());

create policy "Users can view their own profile"
on public.profiles for select
using (id = auth.uid());

create policy "Users can create their own profile"
on public.profiles for insert
with check (id = auth.uid() and role = 'admin');

create policy "Admins can manage federation profiles"
on public.profiles for all
using (federation_id = public.current_federation_id() and public.is_current_user_admin())
with check (federation_id = public.current_federation_id());

create policy "Users can update their own profile link"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can view federation members"
on public.federation_members for select
using (federation_id = public.current_federation_id());

create policy "Admins can manage federation members"
on public.federation_members for all
using (federation_id = public.current_federation_id() and public.is_current_user_admin())
with check (federation_id = public.current_federation_id());

create policy "Users can view federation alerts"
on public.alerts for select
using (federation_id = public.current_federation_id());

create policy "Admins can manage federation alerts"
on public.alerts for all
using (federation_id = public.current_federation_id() and public.is_current_user_admin())
with check (federation_id = public.current_federation_id());

create policy "Admins can manage federation invitations"
on public.federation_invitations for all
using (federation_id = public.current_federation_id() and public.is_current_user_admin())
with check (federation_id = public.current_federation_id() and public.is_current_user_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, federation_id, full_name, email, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'federation_id', '')::uuid,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Nouvel utilisateur'),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::app_role, 'admin')
  )
  on conflict (id) do update set
    federation_id = excluded.federation_id,
    role = excluded.role,
    email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
