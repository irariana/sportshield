-- ============================================================================
-- seed_demo.sql
-- Demonstration seed data for SportShield
-- ============================================================================

-- Assumes an existing federation and users. Insert sample sensors if federation exists.
DO $$
DECLARE
  fed_id UUID;
  athlete_record RECORD;
  sensor_rec_id UUID;
BEGIN
  SELECT id INTO fed_id FROM public.federations LIMIT 1;
  IF fed_id IS NULL THEN
    RETURN;
  END IF;

  -- Insert demo sensors
  INSERT INTO public.sensors (id, federation_id, type, manufacturer, model, serial_number, produced_data, measurement_frequency, status)
  VALUES 
    (gen_random_uuid(), fed_id, 'frequence_cardiaque', 'Garmin', 'HR Pro Plus', 'SN-HR-9988', ARRAY['FC', 'Variabilité'], '1s', 'actif'),
    (gen_random_uuid(), fed_id, 'gps', 'Polar', 'Vantage V3', 'SN-GPS-1122', ARRAY['Trace', 'Allure', 'Distance'], '5Hz', 'actif'),
    (gen_random_uuid(), fed_id, 'sommeil', 'Oura', 'Ring Gen 3', 'SN-SLM-4455', ARRAY['Phases', 'Récupération'], 'Continu', 'actif')
  ON CONFLICT (federation_id, serial_number) DO NOTHING;

  -- Insert sample GPS windows
  INSERT INTO public.gps_windows (federation_id, day_of_week, start_time, end_time, label)
  VALUES 
    (fed_id, 1, '08:00:00', '20:00:00', 'Créneau Standard Lundi'),
    (fed_id, 2, '08:00:00', '20:00:00', 'Créneau Standard Mardi'),
    (fed_id, 3, '08:00:00', '20:00:00', 'Créneau Standard Mercredi'),
    (fed_id, 4, '08:00:00', '20:00:00', 'Créneau Standard Jeudi'),
    (fed_id, 5, '08:00:00', '20:00:00', 'Créneau Standard Vendredi'),
    (fed_id, 6, '07:00:00', '18:00:00', 'Créneau Standard Samedi'),
    (fed_id, 0, '07:00:00', '14:00:00', 'Créneau Standard Dimanche')
  ON CONFLICT DO NOTHING;

END $$;
