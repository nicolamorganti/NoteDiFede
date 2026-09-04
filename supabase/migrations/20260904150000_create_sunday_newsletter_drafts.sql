-- Migrazione per la gestione della newsletter domenicale personalizzata
CREATE TABLE IF NOT EXISTS public.sunday_newsletter_drafts (
  id text PRIMARY KEY, -- es. '2026-09-06_ambrosiano', '2026-09-06_romano'
  sunday_date date NOT NULL,
  rite text NOT NULL CHECK (rite IN ('ambrosiano', 'romano')),
  custom_prompt text,
  reflection_title text NOT NULL DEFAULT '✨ La Postura Cristiana per la Domenica',
  reflection_text text,
  is_enabled boolean NOT NULL DEFAULT false,
  last_edited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_edited_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_sunday_newsletter_drafts UNIQUE (sunday_date, rite)
);

-- Indici per ricerche rapide per data e rito
CREATE INDEX IF NOT EXISTS idx_sunday_newsletter_drafts_lookup 
  ON public.sunday_newsletter_drafts (sunday_date, rite);

-- Abilitazione RLS
ALTER TABLE public.sunday_newsletter_drafts ENABLE ROW LEVEL SECURITY;

-- Policy di lettura per soli Maestri e Responsabili
DROP POLICY IF EXISTS "Maestri e responsabili can select sunday_newsletter_drafts" ON public.sunday_newsletter_drafts;
CREATE POLICY "Maestri e responsabili can select sunday_newsletter_drafts"
  ON public.sunday_newsletter_drafts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('maestro', 'responsabile')
    )
  );

-- Policy di scrittura/aggiornamento per soli Maestri e Responsabili
DROP POLICY IF EXISTS "Maestri e responsabili can insert or update sunday_newsletter_drafts" ON public.sunday_newsletter_drafts;
CREATE POLICY "Maestri e responsabili can insert or update sunday_newsletter_drafts"
  ON public.sunday_newsletter_drafts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('maestro', 'responsabile')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('maestro', 'responsabile')
    )
  );
