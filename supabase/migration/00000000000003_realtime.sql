-- Tables consommées par les abonnements temps réel de l'application.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'federations',
    'profiles',
    'federation_members',
    'federation_invitations',
    'athlete_profiles',
    'coach_athlete_assignments',
    'medical_records',
    'training_sessions'
  ] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;