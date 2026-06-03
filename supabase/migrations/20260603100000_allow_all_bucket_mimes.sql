-- Migrazione: 20260603100000_allow_all_bucket_mimes.sql
-- Relax constraints on allowed_mime_types for 'note-di-fede' storage bucket
-- to support images, audio (M4A, WAV), and document formats.

update storage.buckets
set allowed_mime_types = null
where id = 'note-di-fede';
