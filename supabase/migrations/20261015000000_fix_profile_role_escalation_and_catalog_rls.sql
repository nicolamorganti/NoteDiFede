-- Note di Fede - Sicurezza Database (Fix Privilege Escalation & Catalog RLS)
-- Migrazione: 20261015000000_fix_profile_role_escalation_and_catalog_rls.sql

-- =====================================================================
-- 1. PROTEZIONE ANTI-ESCALATION SU public.profiles
-- =====================================================================
-- Impedisce a qualsiasi utente (anon o authenticated senza privilegi)
-- di alterare il proprio o altrui campo 'role'. Solo maestri, responsabili
-- o service_role possono modificare il ruolo.

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT (public.is_maestro() OR auth.role() = 'service_role') THEN
      RAISE EXCEPTION 'Operazione non consentita: permessi insufficienti per modificare il ruolo utente.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_protect_profile_role ON public.profiles;
CREATE TRIGGER trigger_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

REVOKE EXECUTE ON FUNCTION public.protect_profile_role() FROM PUBLIC;

-- =====================================================================
-- 2. RESTRINGIMENTO RLS INSERT SUL CATALOGO (songs, song_moments, song_arrangements)
-- =====================================================================
-- Rimuove le vecchie policy che consentivano l'inserimento anonimo indiscriminato
-- e le limita agli utenti con ruolo 'maestro' o 'responsabile'.

DROP POLICY IF EXISTS "Allow song creation for anyone" ON public.songs;
CREATE POLICY "Allow song creation for maestro"
ON public.songs FOR INSERT
TO authenticated
WITH CHECK (public.is_maestro());

DROP POLICY IF EXISTS "Allow song_moments creation for anyone" ON public.song_moments;
CREATE POLICY "Allow song_moments creation for maestro"
ON public.song_moments FOR INSERT
TO authenticated
WITH CHECK (public.is_maestro());

DROP POLICY IF EXISTS "Allow song_arrangements creation for anyone" ON public.song_arrangements;
CREATE POLICY "Allow song_arrangements creation for maestro"
ON public.song_arrangements FOR INSERT
TO authenticated
WITH CHECK (public.is_maestro());
