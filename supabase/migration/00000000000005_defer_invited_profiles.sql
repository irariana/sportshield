-- Do not create application profiles when an invited auth user is created.
-- The profile is created only after accept_federation_invitation succeeds.
delete from public.profiles profile
using public.federation_invitations invitation
where lower(profile.email) = lower(invitation.email)
  and profile.federation_id = invitation.federation_id
  and profile.status = 'inactif'
  and invitation.accepted_at is null
  and invitation.expires_at > now();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  invitation public.federation_invitations;
begin
  select * into invitation
  from public.federation_invitations
  where (
      id = nullif(new.raw_user_meta_data->>'invitation_id', '')::uuid
      or lower(email) = lower(new.email)
    )
    and lower(email) = lower(new.email)
    and accepted_at is null
    and expires_at > now();

  if invitation.id is null then
    insert into public.profiles (id, federation_id, full_name, email, role, status)
    values (
      new.id,
      null,
      coalesce(new.email, 'Nouvel utilisateur'),
      new.email,
      'admin',
      'actif'
    )
    on conflict (id) do update set email = excluded.email;
  end if;
  return new;
end;
$$;

drop function if exists public.accept_federation_invitation(uuid, text, text, text);
drop function if exists public.accept_federation_invitation(uuid, text, text, text, date, text, text, public.athlete_status);

create or replace function public.accept_federation_invitation(
  invitation_id uuid,
  member_name text,
  member_sport text default null,
  member_phone text default null,
  member_birth_date date default null,
  member_discipline text default null,
  member_club text default null,
  member_athlete_status public.athlete_status default 'actif'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.federation_invitations;
  existing_profile public.profiles;
begin
  select * into invitation
  from public.federation_invitations
  where id = invitation_id
    and lower(email) = lower(auth.jwt()->>'email')
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Invitation invalide ou expiree';
  end if;

  select * into existing_profile
  from public.profiles
  where id = auth.uid()
  for update;

  if existing_profile.id is not null and existing_profile.federation_id is not null
     and existing_profile.federation_id <> invitation.federation_id then
    raise exception 'Ce compte est deja rattache a une autre federation';
  end if;

  insert into public.profiles (id, federation_id, full_name, email, role, status, sport)
  values (
    auth.uid(),
    invitation.federation_id,
    coalesce(nullif(trim(member_name), ''), auth.jwt()->>'email'),
    lower(auth.jwt()->>'email'),
    invitation.role,
    'actif',
    nullif(trim(member_sport), '')
  )
  on conflict (id) do update set
    federation_id = excluded.federation_id,
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role,
    status = 'actif',
    sport = excluded.sport,
    updated_at = now();

  insert into public.federation_members (federation_id, full_name, role, email, status, sport, phone)
  values (invitation.federation_id, coalesce(nullif(trim(member_name), ''), auth.jwt()->>'email'), invitation.role, lower(auth.jwt()->>'email'), 'actif', nullif(trim(member_sport), ''), nullif(trim(member_phone), ''));

  if invitation.role = 'sportif' then
    insert into public.athlete_profiles (profile_id, federation_id, birth_date, discipline, club, athlete_status)
    values (auth.uid(), invitation.federation_id, member_birth_date, nullif(trim(member_discipline), ''), nullif(trim(member_club), ''), coalesce(member_athlete_status, 'actif'))
    on conflict (profile_id) do update set
      federation_id = excluded.federation_id,
      birth_date = excluded.birth_date,
      discipline = excluded.discipline,
      club = excluded.club,
      athlete_status = excluded.athlete_status,
      updated_at = now();
  end if;

  update public.federation_invitations
  set accepted_at = now()
  where id = invitation.id;
end;
$$;
