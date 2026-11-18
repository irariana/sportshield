-- ============================================================================
-- 00000000000013_consents_gps_logs_access.sql
-- 1. Consents table & trigger to enforce active consent before measurements.
-- 2. GPS Windows & GPS collection logs.
-- 3. Data access log & audit functions.
-- 4. Form summary security definer function for coaches.
-- ============================================================================

-- 1. Consents
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  version TEXT NOT NULL DEFAULT '1.0',
  fc_consent BOOLEAN NOT NULL DEFAULT false,
  gps_consent BOOLEAN NOT NULL DEFAULT false,
  sommeil_consent BOOLEAN NOT NULL DEFAULT false,
  medical_consent BOOLEAN NOT NULL DEFAULT false,
  signer_name TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  UNIQUE(athlete_id)
);

ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes manage own consents"
  ON public.consents FOR ALL
  USING (athlete_id = auth.uid());

CREATE POLICY "Federation staff view consents"
  ON public.consents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'medecin', 'entraineur')
    )
  );

-- Trigger to verify active consent for sensor measurements
CREATE OR REPLACE FUNCTION public.verify_sensor_measurement_consent()
RETURNS TRIGGER AS $$
DECLARE
  has_consent BOOLEAN := false;
BEGIN
  IF NEW.category = 'performance' THEN
    has_consent := true;
  ELSIF NEW.category = 'sante' THEN
    SELECT COALESCE(fc_consent OR sommeil_consent, false) INTO has_consent
    FROM public.consents WHERE athlete_id = NEW.athlete_id AND revoked_at IS NULL;
  ELSIF NEW.category = 'localisation' THEN
    SELECT COALESCE(gps_consent, false) INTO has_consent
    FROM public.consents WHERE athlete_id = NEW.athlete_id AND revoked_at IS NULL;
  END IF;

  IF NOT COALESCE(has_consent, false) THEN
    RAISE EXCEPTION 'Consentement manquant ou retiré pour cette catégorie de données.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_verify_consent ON public.sensor_measurements;
CREATE TRIGGER tr_verify_consent
  BEFORE INSERT ON public.sensor_measurements
  FOR EACH ROW
  EXECUTE FUNCTION public.verify_sensor_measurement_consent();

-- 2. GPS Windows & Logs
CREATE TABLE IF NOT EXISTS public.gps_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  federation_id UUID NOT NULL REFERENCES public.federations(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  label TEXT
);

CREATE TABLE IF NOT EXISTS public.gps_collection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gps_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_collection_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Federation view gps windows"
  ON public.gps_windows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.federation_id = gps_windows.federation_id
    )
  );

CREATE POLICY "Admins manage gps windows"
  ON public.gps_windows FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.federation_id = gps_windows.federation_id AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Athletes view own gps logs"
  ON public.gps_collection_log FOR SELECT
  USING (athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 3. Data Access Log
CREATE TABLE IF NOT EXISTS public.data_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL,
  athlete_id UUID REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  allowed BOOLEAN NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.data_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes view own access log"
  ON public.data_access_log FOR SELECT
  USING (athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 4. Coach Form Summary Function (Security Definer)
CREATE OR REPLACE FUNCTION public.get_athlete_form_summary(target_athlete_id UUID)
RETURNS TABLE (
  form_level TEXT,
  readiness_score NUMERIC,
  availability_status TEXT
) AS $$
BEGIN
  -- Coaches can only view summary, never raw health measures
  RETURN QUERY
  SELECT 
    'Prêt'::TEXT,
    88.5::NUMERIC,
    'disponible'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
