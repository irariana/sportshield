alter table public.training_sessions
  add column if not exists objective text;

drop policy if exists "Athletes create own future sessions" on public.training_sessions;
create policy "Athletes create own future sessions"
on public.training_sessions for insert
with check (
  federation_id = public.current_federation_id()
  and athlete_id = auth.uid()
  and public.current_profile_role() = 'sportif'
  and session_date >= current_date
  and coach_id is null
);

drop policy if exists "Athletes update own future sessions" on public.training_sessions;
create policy "Athletes update own future sessions"
on public.training_sessions for update
using (
  federation_id = public.current_federation_id()
  and athlete_id = auth.uid()
  and public.current_profile_role() = 'sportif'
  and session_date >= current_date
)
with check (
  federation_id = public.current_federation_id()
  and athlete_id = auth.uid()
  and public.current_profile_role() = 'sportif'
  and session_date >= current_date
);

drop policy if exists "Athletes delete own future sessions" on public.training_sessions;
create policy "Athletes delete own future sessions"
on public.training_sessions for delete
using (
  federation_id = public.current_federation_id()
  and athlete_id = auth.uid()
  and public.current_profile_role() = 'sportif'
  and session_date >= current_date
);

create or replace function public.update_own_training_session_objective(
  target_session_id uuid,
  new_objective text
)
returns public.training_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_session public.training_sessions;
begin
  if auth.uid() is null or public.current_profile_role() <> 'sportif' then
    raise exception 'Seul le sportif peut modifier ses objectifs';
  end if;

  update public.training_sessions
  set objective = nullif(trim(new_objective), '')
  where id = target_session_id
    and athlete_id = auth.uid()
    and federation_id = public.current_federation_id()
  returning * into updated_session;

  if not found then
    raise exception 'Séance introuvable ou inaccessible';
  end if;

  return updated_session;
end;
$$;

revoke all on function public.update_own_training_session_objective(uuid, text) from public;
grant execute on function public.update_own_training_session_objective(uuid, text) to authenticated;