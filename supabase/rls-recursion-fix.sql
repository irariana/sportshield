-- Corrige l'erreur "infinite recursion detected in policy for relation profiles".
-- A executer dans Supabase SQL Editor sur une base deja installee.

create or replace function public.current_federation_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select federation_id
  from public.profiles
  where id = auth.uid() and status = 'actif';
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

create or replace function public.accept_federation_invitation(
  invitation_id uuid,
  member_name text,
  member_sport text default null,
  member_phone text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.federation_invitations;
begin
  select * into invitation from public.federation_invitations
  where id = invitation_id and lower(email) = lower(auth.jwt()->>'email')
    and accepted_at is null and expires_at > now() for update;
  if not found then raise exception 'Invitation invalide ou expiree'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and federation_id = invitation.federation_id and role = invitation.role) then
    raise exception 'Profil invite introuvable';
  end if;
  update public.profiles set full_name = nullif(trim(member_name), ''), sport = nullif(trim(member_sport), ''), phone = nullif(trim(member_phone), ''), status = 'actif', updated_at = now() where id = auth.uid();
  insert into public.federation_members (federation_id, full_name, role, email, status, sport, phone)
  values (invitation.federation_id, nullif(trim(member_name), ''), invitation.role, invitation.email, 'actif', nullif(trim(member_sport), ''), nullif(trim(member_phone), ''));
  update public.federation_invitations set accepted_at = now() where id = invitation.id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  invitation public.federation_invitations;
begin
  select * into invitation from public.federation_invitations
  where id = nullif(new.raw_user_meta_data->>'invitation_id', '')::uuid
    and lower(email) = lower(new.email) and accepted_at is null and expires_at > now();
  insert into public.profiles (id, federation_id, full_name, email, role, status)
  values (
    new.id,
    invitation.federation_id,
    coalesce(new.email, 'Nouvel utilisateur'),
    new.email,
    coalesce(invitation.role, 'admin'),
    case when invitation.id is null then 'actif'::public.profile_status else 'inactif'::public.profile_status end
  )
  on conflict (id) do update set
    email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into public.federation_members (federation_id, full_name, role, email, status, sport, phone)
select profile.federation_id, profile.full_name, profile.role, profile.email, profile.status, profile.sport, profile.phone
from public.profiles profile
where profile.federation_id is not null
  and profile.role <> 'admin'
  and profile.status = 'actif'
  and not exists (
    select 1
    from public.federation_members member
    where member.federation_id = profile.federation_id
      and lower(coalesce(member.email, '')) = lower(coalesce(profile.email, ''))
  );
