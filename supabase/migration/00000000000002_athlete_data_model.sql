-- ============================================================
-- SportShield — Modèle de données MVP : sportifs, encadrement,
-- suivi médical et séances d'entraînement.
-- A exécuter après supabase/schema.sql (et rls-recursion-fix.sql
-- si déjà appliqué séparément). Idempotent.
-- ============================================================

-- Statut sportif (distinct du statut de compte 'profile_status',
-- qui sert lui à l'activation du compte)
do $$
begin
  create type public.athlete_status as enum ('actif', 'en_pause', 'blesse', 'inactif');
exception
  when duplicate_object then null;
end $$;

-- 1) Fiche sportif : extension 1-1 de profiles pour role = 'sportif'
create table if not exists public.athlete_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  federation_id uuid not null references public.federations(id) on delete cascade,
  birth_date date,
  discipline text,
  club text,
  athlete_status public.athlete_status not null default 'actif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.athlete_profiles enable row level security;

-- 2) Affectation entraîneur <-> sportif (remplace le mock localStorage)
create table if not exists public.coach_athlete_assignments (
  id uuid primary key default gen_random_uuid(),
  federation_id uuid not null references public.federations(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  assigned_at date not null default current_date,
  ended_at date,
  created_at timestamptz not null default now()
);

alter table public.coach_athlete_assignments enable row level security;

-- une seule affectation active à la fois par sportif
create unique index if not exists coach_athlete_assignments_active_idx
  on public.coach_athlete_assignments (athlete_id)
  where ended_at is null;

-- 3) Suivi médical (visites, blessures, observations)
create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  federation_id uuid not null references public.federations(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  recorded_by uuid references public.profiles(id) on delete set null,
  record_type text not null default 'observation', -- 'visite' | 'blessure' | 'observation'
  title text not null,
  details text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.medical_records enable row level security;

-- 4) Séances d'entraînement (charge, durée, etc.)
create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  federation_id uuid not null references public.federations(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id) on delete set null,
  session_type text not null,
  session_date date not null default current_date,
  duration_minutes integer,
  load integer,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.training_sessions enable row level security;

-- 5) Alertes : on permet de cibler un sportif précis (optionnel)
alter table public.alerts add column if not exists athlete_id uuid references public.profiles(id) on delete cascade;

-- ============================================================
-- Fonctions utilitaires pour les policies RLS par rôle
-- ============================================================

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_assigned_coach(target_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.coach_athlete_assignments
    where athlete_id = target_athlete_id
      and coach_id = auth.uid()
      and ended_at is null
  );
$$;

-- ============================================================
-- Policies : athlete_profiles
-- ============================================================

drop policy if exists "View athlete profiles per role" on public.athlete_profiles;
create policy "View athlete profiles per role"
on public.athlete_profiles for select
using (
  federation_id = public.current_federation_id()
  and (
    public.is_current_user_admin()
    or profile_id = auth.uid()
    or public.current_profile_role() = 'medecin'
    or (public.current_profile_role() = 'entraineur' and public.is_assigned_coach(profile_id))
  )
);

drop policy if exists "Admins manage athlete profiles" on public.athlete_profiles;
create policy "Admins manage athlete profiles"
on public.athlete_profiles for all
using (federation_id = public.current_federation_id() and public.is_current_user_admin())
with check (federation_id = public.current_federation_id() and public.is_current_user_admin());

drop policy if exists "Athletes create own athlete profile" on public.athlete_profiles;
create policy "Athletes create own athlete profile"
on public.athlete_profiles for insert
with check (profile_id = auth.uid());

drop policy if exists "Athletes update own athlete profile" on public.athlete_profiles;
create policy "Athletes update own athlete profile"
on public.athlete_profiles for update
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

-- ============================================================
-- Policies : coach_athlete_assignments
-- ============================================================

drop policy if exists "View relevant assignments" on public.coach_athlete_assignments;
create policy "View relevant assignments"
on public.coach_athlete_assignments for select
using (
  federation_id = public.current_federation_id()
  and (
    public.is_current_user_admin()
    or coach_id = auth.uid()
    or athlete_id = auth.uid()
  )
);

drop policy if exists "Admins manage assignments" on public.coach_athlete_assignments;
create policy "Admins manage assignments"
on public.coach_athlete_assignments for all
using (federation_id = public.current_federation_id() and public.is_current_user_admin())
with check (federation_id = public.current_federation_id() and public.is_current_user_admin());

-- ============================================================
-- Policies : medical_records (médecin + admin + le sportif concerné)
-- ============================================================

drop policy if exists "View own or medical records" on public.medical_records;
create policy "View own or medical records"
on public.medical_records for select
using (
  federation_id = public.current_federation_id()
  and (
    public.is_current_user_admin()
    or athlete_id = auth.uid()
    or public.current_profile_role() = 'medecin'
  )
);

drop policy if exists "Medical staff manage medical records" on public.medical_records;
create policy "Medical staff manage medical records"
on public.medical_records for all
using (
  federation_id = public.current_federation_id()
  and (public.is_current_user_admin() or public.current_profile_role() = 'medecin')
)
with check (
  federation_id = public.current_federation_id()
  and (public.is_current_user_admin() or public.current_profile_role() = 'medecin')
);

-- ============================================================
-- Policies : training_sessions (admin + coach affecté + le sportif concerné)
-- ============================================================

drop policy if exists "View own or coached sessions" on public.training_sessions;
create policy "View own or coached sessions"
on public.training_sessions for select
using (
  federation_id = public.current_federation_id()
  and (
    public.is_current_user_admin()
    or athlete_id = auth.uid()
    or (public.current_profile_role() = 'entraineur' and public.is_assigned_coach(athlete_id))
  )
);

drop policy if exists "Coaches manage sessions of assigned athletes" on public.training_sessions;
create policy "Coaches manage sessions of assigned athletes"
on public.training_sessions for all
using (
  federation_id = public.current_federation_id()
  and (
    public.is_current_user_admin()
    or (public.current_profile_role() = 'entraineur' and public.is_assigned_coach(athlete_id))
  )
)
with check (
  federation_id = public.current_federation_id()
  and (
    public.is_current_user_admin()
    or (public.current_profile_role() = 'entraineur' and public.is_assigned_coach(athlete_id))
  )
);

-- ============================================================
-- Policies : alerts ciblées sur un sportif
-- (remplace la policy de lecture existante pour tenir compte
-- de athlete_id quand il est renseigné)
-- ============================================================

drop policy if exists "Users can view federation alerts" on public.alerts;
create policy "Users can view federation alerts"
on public.alerts for select
using (
  federation_id = public.current_federation_id()
  and (
    athlete_id is null
    or public.is_current_user_admin()
    or athlete_id = auth.uid()
    or public.current_profile_role() = 'medecin'
  )
);
