create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'actif'
  );
$$;

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and status = 'actif';
$$;

drop policy if exists "Athletes create own athlete profile" on public.athlete_profiles;
create policy "Athletes create own athlete profile"
on public.athlete_profiles for insert
with check (
  profile_id = auth.uid()
  and federation_id = public.current_federation_id()
  and public.current_profile_role() = 'sportif'
);

drop policy if exists "Athletes update own athlete profile" on public.athlete_profiles;
create policy "Athletes update own athlete profile"
on public.athlete_profiles for update
using (profile_id = auth.uid() and federation_id = public.current_federation_id())
with check (
  profile_id = auth.uid()
  and federation_id = public.current_federation_id()
  and public.current_profile_role() = 'sportif'
);

create table if not exists public.member_access_audit (
  id uuid primary key default gen_random_uuid(),
  federation_id uuid not null references public.federations(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  target_profile_id uuid references public.profiles(id) on delete set null,
  target_name text not null,
  target_email text,
  action text not null check (action = 'account_disabled'),
  created_at timestamptz not null default now()
);

alter table public.member_access_audit enable row level security;
grant select on public.member_access_audit to authenticated;

drop policy if exists "Admins can view member access audit" on public.member_access_audit;
create policy "Admins can view member access audit"
on public.member_access_audit for select
using (federation_id = public.current_federation_id() and public.is_current_user_admin());

create or replace function public.deactivate_federation_member(
  actor_profile_id uuid,
  target_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles;
  target_profile public.profiles;
begin
  select * into actor_profile from public.profiles where id = actor_profile_id for update;
  select * into target_profile from public.profiles where id = target_profile_id for update;

  if actor_profile.id is null or actor_profile.role <> 'admin' or actor_profile.status <> 'actif' then
    raise exception 'Administrateur actif requis';
  end if;
  if target_profile.id is null or target_profile.federation_id is distinct from actor_profile.federation_id then
    raise exception 'Compte introuvable dans cette federation';
  end if;
  if target_profile.id = actor_profile.id then
    raise exception 'Un administrateur ne peut pas desactiver son propre compte';
  end if;
  if target_profile.status = 'inactif' then
    raise exception 'Ce compte est deja desactive';
  end if;

  update public.profiles
  set status = 'inactif', updated_at = now()
  where id = target_profile.id;

  delete from auth.sessions where user_id = target_profile.id;

  insert into public.member_access_audit (
    federation_id,
    actor_profile_id,
    target_profile_id,
    target_name,
    target_email,
    action
  ) values (
    actor_profile.federation_id,
    actor_profile.id,
    target_profile.id,
    target_profile.full_name,
    target_profile.email,
    'account_disabled'
  );
end;
$$;

revoke all on function public.deactivate_federation_member(uuid, uuid) from public, anon, authenticated;
grant execute on function public.deactivate_federation_member(uuid, uuid) to service_role;
