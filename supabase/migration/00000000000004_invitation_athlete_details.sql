-- Persist the athlete details collected during invitation acceptance.
drop function if exists public.accept_federation_invitation(uuid, text, text, text);

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

  if not exists (
    select 1 from public.profiles
    where id = auth.uid()
      and federation_id = invitation.federation_id
      and role = invitation.role
  ) then
    raise exception 'Profil invite introuvable';
  end if;

  update public.profiles
  set full_name = nullif(trim(member_name), ''), sport = nullif(trim(member_sport), ''), phone = nullif(trim(member_phone), ''), status = 'actif', updated_at = now()
  where id = auth.uid();

  insert into public.federation_members (federation_id, full_name, role, email, status, sport, phone)
  values (invitation.federation_id, nullif(trim(member_name), ''), invitation.role, invitation.email, 'actif', nullif(trim(member_sport), ''), nullif(trim(member_phone), ''));

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

  update public.federation_invitations set accepted_at = now() where id = invitation.id;
end;
$$;
