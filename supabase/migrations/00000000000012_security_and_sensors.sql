-- ============================================================================
-- 00000000000012_security_and_sensors.sql
-- 1. Fix admin RLS on medical records (admin cannot read or write medical details).
-- 2. Restrict alerts visibility to admin and the relevant athlete.
-- 3. Create sensors, sensor_assignments, sensor_measurements tables.
-- ============================================================================

-- 1. Fix medical_records policies for admin
DROP POLICY IF EXISTS "Admins can manage medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Medical staff can manage medical records" ON public.medical_records;
CREATE POLICY "Medical staff can manage medical records"
  ON public.medical_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.federation_id = medical_records.federation_id
        AND profiles.role = 'medecin'
        AND profiles.status = 'actif'
    )
  );

CREATE POLICY "Athletes view own medical records"
  ON public.medical_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.id = medical_records.athlete_id
    )
  );

-- 2. Fix alerts policies
DROP POLICY IF EXISTS "Users can view federation alerts" ON public.alerts;
CREATE POLICY "Admins and relevant users view alerts"
  ON public.alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.federation_id = alerts.federation_id
        AND (profiles.role = 'admin' OR profiles.id = alerts.athlete_id)
    )
  );

-- 3. Sensors and Measurements
CREATE TABLE IF NOT EXISTS public.sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  federation_id UUID NOT NULL REFERENCES public.federations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('frequence_cardiaque', 'gps', 'sommeil')),
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  produced_data TEXT[] NOT NULL DEFAULT '{}',
  measurement_frequency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'actif' CHECK (status IN ('actif', 'en_panne', 'retire')),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(federation_id, serial_number)
);

CREATE TABLE IF NOT EXISTS public.sensor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id UUID NOT NULL REFERENCES public.sensors(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unassigned_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.sensor_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  sensor_id UUID NOT NULL REFERENCES public.sensors(id) ON DELETE CASCADE,
  measure_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  category TEXT NOT NULL CHECK (category IN ('performance', 'sante', 'localisation')),
  training_session_id UUID REFERENCES public.training_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Federation members view sensors"
  ON public.sensors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.federation_id = sensors.federation_id
    )
  );

CREATE POLICY "Admins manage sensors"
  ON public.sensors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.federation_id = sensors.federation_id AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Federation members view sensor assignments"
  ON public.sensor_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sensors s
      JOIN public.profiles p ON p.federation_id = s.federation_id
      WHERE s.id = sensor_assignments.sensor_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Admins manage sensor assignments"
  ON public.sensor_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sensors s
      JOIN public.profiles p ON p.federation_id = s.federation_id
      WHERE s.id = sensor_assignments.sensor_id AND p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Athletes view own measurements or authorized roles"
  ON public.sensor_measurements FOR SELECT
  USING (
    athlete_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'entraineur', 'medecin')
    )
  );
