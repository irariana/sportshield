-- Rend la page d'activation d'invitation coherente avec « Parametres de la federation ».
--   * les fonctions d'invitation exposent le nom et les sports de la federation
--     (public.federations.sports) pour alimenter les listes de la page d'inscription ;
--   * accept_federation_invitation refuse un sport qui n'est pas propose par la
--     federation afin que profils.sport reste toujours coherent avec les parametres.

drop function if exists public.get_federation_invitation_context(uuid);
drop function if exists public.get_current_federation_invitation_context();

create or replace function public.get_federation_invitation_context(invitation_id uuid)
returns table (role public.app_role, email text, federation_id uuid, federation_name text, federation_sports text[])
language sql
security definer
set search_path = public
as $$
  select invitation.role, invitation.email, invitation.federation_id, federation.name, federation.sports
  from public.federation_invitations invitation
  join public.federations federation on federation.id = invitation.federation_id
  where invitation.id = get_federation_invitation_context.invitation_id
    and lower(invitation.email) = lower((select email from auth.users where id = auth.uid()))
    and invitation.accepted_at is null
    and invitation.expires_at > now();
$$;

grant execute on function public.get_federation_invitation_context(uuid) to authenticated;

create or replace function public.get_current_federation_invitation_context()
returns table (id uuid, role public.app_role, email text, federation_id uuid, federation_name text, federation_sports text[])
language sql
security definer
set search_path = public
as $$
  select invitation.id, invitation.role, invitation.email, invitation.federation_id, federation.name, federation.sports
  from public.federation_invitations invitation
  join public.federations federation on federation.id = invitation.federation_id
  where lower(invitation.email) = lower((select email from auth.users where id = auth.uid()))
    and invitation.accepted_at is null
    and invitation.expires_at > now()
  order by invitation.created_at desc
  limit 1;
$$;

grant execute on function public.get_current_federation_invitation_context() to authenticated;

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
  reference_sports text[] := array['Route', 'Semi-marathon', 'Marathon', 'Trail'];
  allowed_sports text[];
begin
  select * into invitation
  from public.federation_invitations
  where id = invitation_id
    and lower(email) = lower((select email from auth.users where id = auth.uid()))
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Invitation invalide ou expiree';
  end if;

  -- Miroir de src/lib/sports.js : les choix proposes sont les sports retenus par
  -- la federation lorsqu'ils font partie de la liste de reference, sinon la liste
  -- de reference elle-meme. Les pages d'inscription proposent exactement cela.
  select coalesce(array_agg(distinct trim(sport)), '{}')
    into allowed_sports
  from unnest(coalesce((select federations.sports from public.federations where federations.id = invitation.federation_id), '{}'::text[])) as discipline(sport)
  where trim(sport) = any (reference_sports);

  if coalesce(array_length(allowed_sports, 1), 0) = 0 then
    allowed_sports := reference_sports;
  end if;

  if nullif(trim(coalesce(member_sport, '')), '') is not null
     and not (trim(member_sport) = any (allowed_sports)) then
    raise exception 'Le sport % n''est pas propose par cette federation', member_sport;
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
    coalesce(nullif(trim(member_name), ''), (select email from auth.users where id = auth.uid())),
    lower((select email from auth.users where id = auth.uid())),
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
  values (invitation.federation_id, coalesce(nullif(trim(member_name), ''), (select email from auth.users where id = auth.uid())), invitation.role, lower((select email from auth.users where id = auth.uid())), 'actif', nullif(trim(member_sport), ''), nullif(trim(member_phone), ''));

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
