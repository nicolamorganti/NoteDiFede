create table public.song_arrangements (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs (id) on delete cascade,
  arrangement_name varchar(255),
  musical_key varchar(50),
  instrumentation varchar(100),
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index song_arrangements_song_idx on public.song_arrangements (song_id);
create index song_arrangements_key_idx on public.song_arrangements (musical_key);

create trigger song_arrangements_set_updated_at
before update on public.song_arrangements
for each row
execute function public.set_updated_at();

alter table public.song_files
add column arrangement_id uuid references public.song_arrangements (id) on delete cascade;

comment on table public.song_arrangements is 'Versioni del canto per tonalita, arrangiamento o strumentazione diversa.';
comment on table public.song_files is 'Metadati dei file salvati nello storage, senza contenuti binari nel database. Possono puntare a una specifica versione del canto.';
