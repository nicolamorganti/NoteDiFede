-- 1. Aggiunta del ruolo 'responsabile' all'enum esistente app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'responsabile';

-- 2. Ridefinizione della funzione helper is_maestro() per includere 'responsabile'
CREATE OR REPLACE FUNCTION public.is_maestro()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('maestro', 'responsabile')
  );
END;
$$;

-- 3. Allineamento dei privilegi sulla funzione
REVOKE EXECUTE ON FUNCTION public.is_maestro() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_maestro() TO authenticated, anon, service_role;
