create type public.song_link_provider as enum ('youtube', 'generic');
create type public.song_link_type as enum ('ascolto', 'tutorial', 'riferimento');

create table public.song_links (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs (id) on delete cascade,
  arrangement_id uuid references public.song_arrangements (id) on delete cascade,
  label varchar(255) not null,
  url text not null,
  provider public.song_link_provider not null default 'generic',
  link_type public.song_link_type not null default 'ascolto',
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index song_links_song_idx on public.song_links (song_id);
create index song_links_arrangement_idx on public.song_links (arrangement_id);
create index song_links_provider_idx on public.song_links (provider);

create trigger song_links_set_updated_at
before update on public.song_links
for each row
execute function public.set_updated_at();

comment on table public.song_links is 'Link esterni di ascolto, tutorial o riferimento associabili al canto o a una sua variante.';
