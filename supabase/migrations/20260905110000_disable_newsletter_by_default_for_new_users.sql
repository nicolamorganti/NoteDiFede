-- Migrazione: Disabilitazione default newsletter per nuovi iscritti (consenso volontario)
-- Gli utenti esistenti mantengono la newsletter abilitata (newsletter_enabled = true)

-- 1. Aggiunta colonna preferred_rite se non presente
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS preferred_rite varchar(20) NOT NULL DEFAULT 'ambrosiano';

-- 2. Aggiunta colonna newsletter_enabled con default false
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS newsletter_enabled boolean NOT NULL DEFAULT false;

-- 3. Allineamento utenti esistenti: conservazione dello stato attivo per chi è già registrato
UPDATE public.profiles 
  SET newsletter_enabled = true;

-- 4. Default della colonna impostato tassativamente su false per ogni inserimento futuro
ALTER TABLE public.profiles 
  ALTER COLUMN newsletter_enabled SET DEFAULT false;

-- 5. Aggiornamento funzione trigger per i nuovi iscritti (auth.users -> public.profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_newsletter boolean := false;
  v_rite varchar(20) := 'ambrosiano';
BEGIN
  -- Se l'utente ha fornito esplicito consenso volontario nei metadati durante la registrazione
  IF new.raw_user_meta_data->>'newsletter_enabled' IS NOT NULL THEN
    v_newsletter := (new.raw_user_meta_data->>'newsletter_enabled')::boolean;
  END IF;

  IF new.raw_user_meta_data->>'preferred_rite' IS NOT NULL THEN
    v_rite := new.raw_user_meta_data->>'preferred_rite';
  END IF;

  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    role,
    vocal_register,
    preferred_rite,
    newsletter_enabled
  )
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'ospite'::public.app_role,
    'nessuno',
    v_rite,
    v_newsletter
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name;

  RETURN new;
END;
$$;
