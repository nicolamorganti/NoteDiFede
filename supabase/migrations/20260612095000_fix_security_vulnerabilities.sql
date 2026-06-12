-- Note di Fede - Sicurezza Database (Fix criticità)
-- Migrazione: 20260612095000_fix_security_vulnerabilities.sql

-- =====================================================================
-- 1. RISOLUZIONE "Function Search Path Mutable" (Sicurezza dei path delle funzioni)
-- =====================================================================
-- Imposta esplicitamente il search_path a 'public' per evitare di ereditare
-- path mutabili dal chiamante (previene attacchi di search-path hijacking).

ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.is_maestro() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- =====================================================================
-- 2. RISOLUZIONE "Public Can Execute SECURITY DEFINER Function"
-- =====================================================================
-- Di default, Postgres concede il privilegio EXECUTE al ruolo speciale 'PUBLIC' (chiunque).
-- Per le funzioni SECURITY DEFINER (che girano con i privilegi del creatore), questo
-- rappresenta un potenziale rischio se possono essere chiamate direttamente.

-- A) handle_new_user(): È una funzione trigger usata solo internamente da auth.users.
-- Nessun utente esterno (anon/authenticated) deve poterla chiamare direttamente.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- B) is_maestro(): È usata nelle policies RLS per valutare i permessi di lettura/scrittura.
-- Deve poter essere eseguita dai ruoli 'authenticated' e 'anon' per la corretta valutazione delle policy,
-- ma la revochiamo da 'PUBLIC' concedendola esplicitamente solo ai ruoli autorizzati.
REVOKE EXECUTE ON FUNCTION public.is_maestro() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_maestro() TO authenticated, anon, service_role;
