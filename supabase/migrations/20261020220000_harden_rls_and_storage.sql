-- Note di Fede - Consolidamento Sicurezza RLS (Catalogo, Profili, Storage)
-- Migrazione: 20261020220000_harden_rls_and_storage.sql

-- =====================================================================
-- 1. RESTRINGIMENTO RLS INSERT SU public.song_links
-- =====================================================================
-- Rimuove la policy che consentiva l'inserimento anonimo su song_links
-- e la allinea a songs, song_moments e song_arrangements (solo maestro/responsabile).

DROP POLICY IF EXISTS "Allow song_links creation for anyone" ON public.song_links;
CREATE POLICY "Allow song_links creation for maestro"
ON public.song_links FOR INSERT
TO authenticated
WITH CHECK (public.is_maestro());

-- =====================================================================
-- 2. RESTRINGIMENTO RLS SU public.profiles
-- =====================================================================
-- A) Impedisce inserimenti anonimi (auth.uid() is null) su public.profiles.
--    Il trigger handle_new_user() gira come SECURITY DEFINER e bypassa RLS.
DROP POLICY IF EXISTS "Allow profile creation for self" ON public.profiles;
CREATE POLICY "Allow profile creation for self"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- B) Restringe la lettura dei profili al proprietario stesso o ai ruoli
--    amministrativi (maestro / responsabile), evitando l'enumerazione pubblica.
DROP POLICY IF EXISTS "Allow public read access on profiles" ON public.profiles;
CREATE POLICY "Allow profile read for self or maestro"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_maestro());

-- =====================================================================
-- 3. RESTRINGIMENTO RLS SU storage.objects (Bucket 'note-di-fede')
-- =====================================================================
-- Rimuove la clausola 'or auth.uid() is null' che consentiva upload anonimi
-- diretti tramite la chiave pubblica di Supabase.

DROP POLICY IF EXISTS "Allow upload to note-di-fede for maestro" ON storage.objects;
CREATE POLICY "Allow upload to note-di-fede for maestro"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'note-di-fede' AND public.is_maestro());
