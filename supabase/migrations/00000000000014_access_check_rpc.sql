-- ============================================================================
-- 00000000000014_access_check_rpc.sql
-- Run access check RPC for admin alerts generation.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.run_access_check()
RETURNS INT AS $$
DECLARE
  alert_count INT := 0;
  fed_id UUID;
BEGIN
  -- Get federation ID for current admin
  SELECT federation_id INTO fed_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin';
  IF fed_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Example check: active sensors without consent or inactive accounts assigned
  -- Create an alert if needed
  INSERT INTO public.alerts (federation_id, title, message, severity, status)
  SELECT 
    fed_id,
    'Contrôle d’accès : Capteurs actifs sans accord',
    'Un ou plusieurs capteurs collectent des données pour des sportifs n’ayant pas donné leur accord complet.',
    'warning',
    'nouvelle'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.alerts 
    WHERE federation_id = fed_id 
      AND title = 'Contrôle d’accès : Capteurs actifs sans accord' 
      AND status = 'nouvelle'
  );

  GET DIAGNOSTICS alert_count = ROW_COUNT;
  RETURN alert_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
