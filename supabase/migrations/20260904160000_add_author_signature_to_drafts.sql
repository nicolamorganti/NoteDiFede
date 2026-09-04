-- Aggiunta colonna author_signature per la firma personalizzata del commento
ALTER TABLE public.sunday_newsletter_drafts
ADD COLUMN IF NOT EXISTS author_signature text;
