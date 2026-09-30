alter table public.training_sessions
  add column if not exists activity_source text not null default 'planned',
  add column if not exists source_format text,
  add column if not exists source_filename text,
  add column if not exists distance_meters numeric(10, 2),
  add column if not exists duration_seconds integer,
  add column if not exists average_pace_seconds_per_km integer;

-- Contrainte sur la source : « planned » (séance planifiée) ou une
-- source de données d'activité. Extensible (ex. Strava) sans nouvelle
-- migration de schéma, et rejouable sans erreur.
alter table public.training_sessions
  drop constraint if exists training_sessions_activity_source_check;
alter table public.training_sessions
  add constraint training_sessions_activity_source_check
  check (activity_source in ('planned', 'import', 'strava'));

-- Lecture des activités importées par fédération (tableau « Sources de données »)
create index if not exists training_sessions_federation_activity_idx
  on public.training_sessions (federation_id, activity_source);

drop policy if exists "Athletes import own activities" on public.training_sessions;
create policy "Athletes import own activities"
on public.training_sessions for insert
with check (
  federation_id = public.current_federation_id()
  and athlete_id = auth.uid()
  and coach_id is null
  and public.current_profile_role() = 'sportif'
  and activity_source = 'import'
  and source_format in ('GPX', 'TCX')
);

drop policy if exists "Athletes update own imported activities" on public.training_sessions;
create policy "Athletes update own imported activities"
on public.training_sessions for update
using (
  federation_id = public.current_federation_id()
  and athlete_id = auth.uid()
  and public.current_profile_role() = 'sportif'
  and activity_source = 'import'
)
with check (
  federation_id = public.current_federation_id()
  and athlete_id = auth.uid()
  and public.current_profile_role() = 'sportif'
  and activity_source = 'import'
  and source_format in ('GPX', 'TCX')
);

drop policy if exists "Athletes delete own imported activities" on public.training_sessions;
create policy "Athletes delete own imported activities"
on public.training_sessions for delete
using (
  federation_id = public.current_federation_id()
  and athlete_id = auth.uid()
  and public.current_profile_role() = 'sportif'
  and activity_source = 'import'
);