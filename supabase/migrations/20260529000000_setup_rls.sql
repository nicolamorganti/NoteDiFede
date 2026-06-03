-- Note di Fede - Setup Row Level Security (RLS) e Storage Buckets
-- Migrazione: 20260529000000_setup_rls.sql

-- =====================================================================
-- 1. CONFIGURAZIONE BUCKET STORAGE
-- =====================================================================
-- Configura il bucket 'note-di-fede' per ospitare file fino a 50MB (52428800 bytes)
-- e ne restringe gli allowed_mime_types ai formati PDF e MP3 supportati dall'app.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'note-di-fede',
  'note-di-fede',
  false,
  52428800, -- 50MB in bytes
  null
)
on conflict (id) do update
set
  file_size_limit = 52428800,
  allowed_mime_types = null;

-- =====================================================================
-- 2. ABILITAZIONE RLS SULLE TABELLE APPLICATIVE
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.songs enable row level security;
alter table public.mass_moments enable row level security;
alter table public.song_moments enable row level security;
alter table public.song_arrangements enable row level security;
alter table public.masses enable row level security;
alter table public.mass_songs enable row level security;
alter table public.song_files enable row level security;
alter table public.song_links enable row level security;
alter table public.activity_log enable row level security;

-- =====================================================================
-- 3. FUNZIONE HELPER PER RUOLO MAESTRO (ADMIN MOCK)
-- =====================================================================
-- Restituisce true se l'utente corrente autenticato ha il ruolo 'maestro'
create or replace function public.is_maestro()
returns boolean
security definer
language plpgsql
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'maestro'
  );
end;
$$;

-- =====================================================================
-- 4. POLICIES PER LA TABELLA profiles
-- =====================================================================
-- Lettura aperta a tutti per mostrare i profili (ad es. chi ha caricato un file)
create policy "Allow public read access on profiles"
on public.profiles for select
using (true);

-- Permette l'inserimento del proprio profilo durante la registrazione o mock login
create policy "Allow profile creation for self"
on public.profiles for insert
with check (auth.uid() = id or auth.uid() is null);

-- Permette l'aggiornamento del proprio profilo o da parte di un maestro
create policy "Allow profile update for self or maestro"
on public.profiles for update
using (auth.uid() = id or public.is_maestro())
with check (auth.uid() = id or public.is_maestro());

-- Solo il maestro può eliminare profili
create policy "Allow profile deletion for maestro"
on public.profiles for delete
using (public.is_maestro());

-- =====================================================================
-- 5. POLICIES PER LA TABELLA songs
-- =====================================================================
-- Lettura aperta a tutti
create policy "Allow public read access on songs"
on public.songs for select
using (true);

-- Permette a chiunque l'inserimento (l'app usa il client anonimo per creare canti)
create policy "Allow song creation for anyone"
on public.songs for insert
with check (true);

-- Modifica e cancellazione permesse solo al maestro (l'app Next.js usa anche service_role che le bypassa)
create policy "Allow song update for maestro"
on public.songs for update
using (public.is_maestro());

create policy "Allow song deletion for maestro"
on public.songs for delete
using (public.is_maestro());

-- =====================================================================
-- 6. POLICIES PER LA TABELLA mass_moments
-- =====================================================================
-- Lettura aperta a tutti
create policy "Allow public read access on mass_moments"
on public.mass_moments for select
using (true);

-- Gestione completa solo per il maestro
create policy "Allow mass_moments management for maestro"
on public.mass_moments for all
using (public.is_maestro());

-- =====================================================================
-- 7. POLICIES PER LA TABELLA song_moments
-- =====================================================================
-- Lettura aperta a tutti
create policy "Allow public read access on song_moments"
on public.song_moments for select
using (true);

-- Permette l'associazione a chiunque (per allineamento alle azioni del client anonimo)
create policy "Allow song_moments creation for anyone"
on public.song_moments for insert
with check (true);

-- Gestione completa per il maestro
create policy "Allow song_moments management for maestro"
on public.song_moments for all
using (public.is_maestro());

-- =====================================================================
-- 8. POLICIES PER LA TABELLA song_arrangements
-- =====================================================================
-- Lettura aperta a tutti
create policy "Allow public read access on song_arrangements"
on public.song_arrangements for select
using (true);

-- Permette a chiunque l'inserimento (l'app usa il client anonimo)
create policy "Allow song_arrangements creation for anyone"
on public.song_arrangements for insert
with check (true);

-- Modifica e cancellazione permesse solo al maestro
create policy "Allow song_arrangements update for maestro"
on public.song_arrangements for update
using (public.is_maestro());

create policy "Allow song_arrangements deletion for maestro"
on public.song_arrangements for delete
using (public.is_maestro());

-- =====================================================================
-- 9. POLICIES PER LA TABELLA masses
-- =====================================================================
-- Lettura aperta a tutti
create policy "Allow public read access on masses"
on public.masses for select
using (true);

-- Gestione completa per il maestro
create policy "Allow masses management for maestro"
on public.masses for all
using (public.is_maestro());

-- =====================================================================
-- 10. POLICIES PER LA TABELLA mass_songs
-- =====================================================================
-- Lettura aperta a tutti
create policy "Allow public read access on mass_songs"
on public.mass_songs for select
using (true);

-- Gestione completa per il maestro
create policy "Allow mass_songs management for maestro"
on public.mass_songs for all
using (public.is_maestro());

-- =====================================================================
-- 11. POLICIES PER LA TABELLA song_files
-- =====================================================================
-- Lettura aperta a tutti
create policy "Allow public read access on song_files"
on public.song_files for select
using (true);

-- Gestione completa per il maestro (l'app usa service_role per inserire/eliminare)
create policy "Allow song_files management for maestro"
on public.song_files for all
using (public.is_maestro());

-- =====================================================================
-- 12. POLICIES PER LA TABELLA song_links
-- =====================================================================
-- Lettura aperta a tutti
create policy "Allow public read access on song_links"
on public.song_links for select
using (true);

-- Permette a chiunque l'inserimento (l'app usa il client anonimo)
create policy "Allow song_links creation for anyone"
on public.song_links for insert
with check (true);

-- Modifica e cancellazione permesse solo al maestro
create policy "Allow song_links update for maestro"
on public.song_links for update
using (public.is_maestro());

create policy "Allow song_links deletion for maestro"
on public.song_links for delete
using (public.is_maestro());

-- =====================================================================
-- 13. POLICIES PER LA TABELLA activity_log
-- =====================================================================
-- Lettura aperta a tutti
create policy "Allow public read access on activity_log"
on public.activity_log for select
using (true);

-- Permette l'inserimento dei log ad anonimi ed autenticati
create policy "Allow activity_log insertion"
on public.activity_log for insert
with check (true);

-- Nessuno può modificare o eliminare i log delle attività
create policy "Restrict activity_log modifications"
on public.activity_log for update
using (false);

create policy "Restrict activity_log deletions"
on public.activity_log for delete
using (false);

-- =====================================================================
-- 14. POLICIES DI STORAGE SUL BUCKET 'note-di-fede'
-- =====================================================================
-- Anche se le azioni di caricamento/cancellazione passano via service_role,
-- definiamo le policy a livello di storage.objects per la sicurezza.

-- Permette la lettura/download degli oggetti del bucket 'note-di-fede' a chiunque
create policy "Allow reading objects in note-di-fede bucket"
on storage.objects for select
using (bucket_id = 'note-di-fede');

-- Permette l'inserimento/caricamento di oggetti nel bucket solo ai maestri (o tramite service_role)
create policy "Allow upload to note-di-fede for maestro"
on storage.objects for insert
with check (bucket_id = 'note-di-fede' and (public.is_maestro() or auth.uid() is null));

-- Permette l'aggiornamento di oggetti nel bucket solo ai maestri
create policy "Allow updates to note-di-fede for maestro"
on storage.objects for update
using (bucket_id = 'note-di-fede' and public.is_maestro());

-- Permette la rimozione di oggetti nel bucket solo ai maestri
create policy "Allow deletion from note-di-fede for maestro"
on storage.objects for delete
using (bucket_id = 'note-di-fede' and public.is_maestro());
