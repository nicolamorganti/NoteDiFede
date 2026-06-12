-- 1. Aggiunta dei nuovi ruoli all'enum esistente app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ospite';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cantore';

-- 2. Modifica del default della colonna role in profiles su 'ospite'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'ospite'::public.app_role;

-- 3. Allineamento dei vecchi profili 'normale' su 'ospite'
UPDATE public.profiles SET role = 'ospite'::public.app_role WHERE role = 'normale'::public.app_role;

-- 4. Aggiunta della colonna per il registro vocale
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vocal_register varchar(50) NOT NULL DEFAULT 'nessuno';

-- 5. Creazione della funzione trigger per copiare l'utente registrato in public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role, vocal_register)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'ospite'::public.app_role,
    'nessuno'
  );
  RETURN new;
END;
$$;

-- 6. Creazione del trigger effettivo su auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
