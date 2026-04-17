-- Note di Fede - Schema iniziale per Supabase/PostgreSQL
-- Basato su:
-- 1. _legacy_php_archive/specs/project-spec.md
-- 2. _legacy_php_archive/php/db_function.php
--
-- Scelte principali:
-- - UUID come chiavi primarie
-- - utenti gestiti da Supabase Auth, con tabella profili applicativa
-- - file esterni al database, salvati in Supabase Storage o altro object storage
-- - URL e storage_path testuali al posto dei LONGBLOB del sistema legacy

create extension if not exists pgcrypto;

create type public.app_role as enum ('normale', 'maestro');
create type public.liturgical_year as enum ('A', 'B', 'C');
create type public.song_file_type as enum (
  'spartito_pdf',
  'testo_pdf',
  'accordi_pdf',
  'mp3_completo',
  'mp3_soprano',
  'mp3_contralto',
  'mp3_tenore',
  'mp3_basso',
  'mp3_organo'
);
create type public.activity_action as enum ('creazione', 'modifica', 'eliminazione');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username varchar(50) not null unique,
  full_name varchar(255),
  role public.app_role not null default 'normale',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_sign_in_at timestamptz
);

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  code varchar(50) unique,
  title varchar(255) not null,
  alternate_title varchar(255),
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.mass_moments (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null unique,
  sort_order integer not null unique,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.song_moments (
  song_id uuid not null references public.songs (id) on delete cascade,
  moment_id uuid not null references public.mass_moments (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (song_id, moment_id)
);

create table public.masses (
  id uuid primary key default gen_random_uuid(),
  title varchar(255) not null,
  liturgical_year public.liturgical_year not null,
  celebration_date date not null,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.mass_songs (
  id uuid primary key default gen_random_uuid(),
  mass_id uuid not null references public.masses (id) on delete cascade,
  song_id uuid not null references public.songs (id) on delete restrict,
  moment_id uuid not null references public.mass_moments (id) on delete restrict,
  position integer not null,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint mass_songs_position_check check (position > 0),
  constraint mass_songs_unique_position unique (mass_id, moment_id, position),
  constraint mass_songs_unique_song_per_moment unique (mass_id, moment_id, song_id)
);

create table public.song_files (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs (id) on delete cascade,
  file_type public.song_file_type not null,
  storage_bucket varchar(100) not null default 'note-di-fede',
  storage_path text not null,
  public_url text,
  file_name varchar(255) not null,
  file_size_bytes bigint,
  mime_type varchar(100),
  uploaded_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint song_files_size_check check (file_size_bytes is null or file_size_bytes >= 0)
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  table_name varchar(50) not null,
  record_id uuid,
  action public.activity_action not null,
  user_id uuid references public.profiles (id) on delete set null,
  changes jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default timezone('utc', now())
);

create index songs_title_idx on public.songs (title);
create index songs_alternate_title_idx on public.songs (alternate_title);
create index songs_code_idx on public.songs (code);
create index masses_celebration_date_idx on public.masses (celebration_date desc);
create index masses_liturgical_year_idx on public.masses (liturgical_year);
create index mass_songs_mass_idx on public.mass_songs (mass_id);
create index mass_songs_song_idx on public.mass_songs (song_id);
create index mass_songs_moment_idx on public.mass_songs (moment_id);
create index song_files_song_idx on public.song_files (song_id);
create index song_files_type_idx on public.song_files (file_type);
create index activity_log_table_record_idx on public.activity_log (table_name, record_id);
create index activity_log_user_idx on public.activity_log (user_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger songs_set_updated_at
before update on public.songs
for each row
execute function public.set_updated_at();

create trigger mass_moments_set_updated_at
before update on public.mass_moments
for each row
execute function public.set_updated_at();

create trigger song_moments_set_updated_at
before update on public.song_moments
for each row
execute function public.set_updated_at();

create trigger masses_set_updated_at
before update on public.masses
for each row
execute function public.set_updated_at();

create trigger mass_songs_set_updated_at
before update on public.mass_songs
for each row
execute function public.set_updated_at();

create trigger song_files_set_updated_at
before update on public.song_files
for each row
execute function public.set_updated_at();

insert into public.mass_moments (name, sort_order)
values
  ('Ingresso', 1),
  ('Atto Penitenziale', 2),
  ('Gloria', 3),
  ('Salmo', 4),
  ('Canto al Vangelo', 5),
  ('Offertorio', 6),
  ('Santo', 7),
  ('Memoriale', 8),
  ('Agnello di Dio', 9),
  ('Comunione', 10),
  ('Finale', 11)
on conflict (name) do nothing;

comment on table public.profiles is 'Profili applicativi collegati a Supabase Auth.';
comment on table public.songs is 'Catalogo dei canti liturgici.';
comment on table public.mass_moments is 'Momenti della celebrazione in cui un canto puo essere utilizzato.';
comment on table public.song_moments is 'Associazione molti-a-molti tra canti e momenti della messa.';
comment on table public.masses is 'Anagrafica delle celebrazioni/messa.';
comment on table public.mass_songs is 'Sequenza dei canti assegnati a una specifica messa.';
comment on table public.song_files is 'Metadati dei file salvati nello storage, senza contenuti binari nel database.';
comment on table public.activity_log is 'Registro attivita applicativa e tracciamento modifiche.';

-- Bucket storage suggerito.
-- Eseguibile separatamente o insieme a questo script dalla SQL editor di Supabase.
insert into storage.buckets (id, name, public)
values ('note-di-fede', 'note-di-fede', false)
on conflict (id) do nothing;

-- Nota:
-- Per semplicita questa prima versione non abilita ancora RLS sulle tabelle applicative.
-- Lo faremo quando imposteremo autenticazione, ruoli e policy operative nel modulo core.
