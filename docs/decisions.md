# Architectural and Database Decisions - Note di Fede

This document maintains the record of structural, architectural, and database decisions made for the "Note di Fede" project, establishing a clear timeline and justification for each choice.

## 1. Supabase with Row Level Security (RLS)
- **Status:** Implemented (Migration `20260529000000_setup_rls.sql`)
- **Details:** Row Level Security (RLS) has been enabled across all database tables in the `public` schema (`profiles`, `songs`, `mass_moments`, `song_moments`, `song_arrangements`, `masses`, `mass_songs`, `song_files`, `song_links`, `activity_log`).
- **Authorization Model:**
  - A database helper function `public.is_maestro()` is used to identify users with the administrative role `maestro`.
  - Public read access (`SELECT`) is permitted on all major catalog and operational tables.
  - Insertion permissions are selectively opened to support client-side anonymous workflows (e.g., song creation, arrangement insertion, and activity logging).
  - Administrative changes (`UPDATE`, `DELETE`) on core entities are restricted strictly to users with the `maestro` role.
  - For security auditing, `activity_log` update and delete operations are blocked entirely.
  - Storage bucket policies restrict object upload/update/delete in the `note-di-fede` bucket to the `maestro` role.

## 2. File Size Limits Configuration
- **Status:** Implemented
- **Details:** To ensure stability during PDF sheet music and MP3 vocal track uploads, a consistent limit of 50MB has been enforced across all application layers:
  - **Next.js Server Actions:** Configured to `50mb` in `next.config.ts` via `experimental.serverActions.bodySizeLimit`.
  - **Supabase Local Configuration:** Configured to `50MiB` in `supabase/config.toml` via `file_size_limit`.
  - **Supabase Storage Bucket:** Enforced at `52,428,800` bytes (50MB) for the `note-di-fede` bucket in the database migrations, with mime type restrictions to `application/pdf` and `audio/*` formats.

## 3. Delimiter Logic for Lyrics in Song Notes
- **Status:** Implemented (Logic in `lib/songs.ts`)
- **Details:** To avoid DDL schema changes on the database side (which would require adding a new column to the legacy structure for lyrics), lyrics are stored in the existing `notes` text column of the `songs` table.
- **Implementation:**
  - Standard delimiters `[NOTE]` and `[TESTO]` are utilized to partition the string.
  - The application parses this column client-side via `parseNotesAndLyrics()` and serializes it via `serializeNotesAndLyrics()`.
  - This allows the app to cleanly distinguish between liturgical notes/annotations and the song text without requiring database schema modifications.

## 4. Seeding of Mass Moments (Ambrosian Rite)
- **Status:** Implemented (Seeded in DB)
- **Details:** The `mass_moments` table is populated with the 15 standard moments of the Ambrosian Liturgy, sorted sequentially as follows:
  1. **Ingresso** (sort_order: 1)
  2. **Aspersione** (sort_order: 2)
  3. **Gloria** (sort_order: 3)
  4. **Salmo** (sort_order: 4)
  5. **Canto al Vangelo** (sort_order: 5)
  6. **Dopo il Vangelo** (sort_order: 6)
  7. **Offertorio** (sort_order: 7)
  8. **Santo** (sort_order: 8)
  9. **Mistero della Fede** (sort_order: 9)
  10. **Amen** (sort_order: 10)
  11. **Spezzare del Pane** (sort_order: 11)
  12. **Agnello di Dio (Agnus Dei)** (sort_order: 12)
  13. **Padre Nostro** (sort_order: 13)
  14. **Comunione** (sort_order: 14)
  15. **Finale** (sort_order: 15)

## 5. Dynamic Vocal Tracks and Expanded Audio Formats Support
- **Status:** Implemented (Logic in `components/canti-catalog.tsx` and `components/song-file-form.tsx`)
- **Dynamic Vocal Tracks:** Vocal tracks are completely dynamic and rely solely on user-uploaded files. No mock audio tracks or default files are loaded by default, mirroring the behavior of PDF sheet music files. Audio tracks are only rendered if they have been explicitly uploaded to the active arrangement.
- **Expanded Audio Support:** The system has been configured to accept a wider range of audio file formats beyond standard MP3, supporting formats such as M4A, WAV, and AAC. The file upload interfaces dynamically configure their input file accept attributes (using `audio/*` for audio types and `application/pdf` for PDFs) to ensure consistent client-side validation.

## 6. Structural Configurations
- **Mock Authentication:** To facilitate local testing and quick evaluation, a mock login mechanism is configured in `app/page.tsx`. It simulates access for the credentials `maestro@notedifede.it` with password `cantoliturgico`, routing users to the `/canti` and `/messe` workspace dashboards.
- **Deployment and Architecture:** The frontend is built on Next.js (using App Router features like Server Actions), styled with Tailwind CSS, and powered by TypeScript. It interfaces directly with a remote Supabase instance (PostgreSQL 17) for persistence, database-level constraint enforcement, and media storage.

## 7. Progress Checklist
This checklist tracks the implementation status of Note di Fede features.

### Database & Migrations
- [x] Initial relational schema defined with UUID primary keys (`supabase_schema.sql`).
- [x] Database triggers configured to automatically manage `updated_at` timestamps on update.
- [x] RLS policies applied in migration `20260529000000_setup_rls.sql` to protect profiles, catalog data, and log tables.
- [x] Storage buckets and access policies created for `note-di-fede` with strict MIME types.
- [x] Database seeded with the 15 standard Ambrosian mass moments.

### Catalog & Song Management
- [x] Catalog view showing all songs with title, alternate title, code, and linked moments (`components/canti-catalog.tsx`).
- [x] Filter songs by liturgical moment, key, or file attachment presence.
- [x] Client-side parsing and serialization of `[NOTE]` and `[TESTO]` partitions in the notes column (`lib/songs.ts`).
- [x] Dynamic creation, editing, and deletion of songs by authorized users.
- [x] Management of song arrangements, key variants, and specific instrumentation.
- [x] YouTube/generic link association per song/arrangement.

### File & Storage Management
- [x] Document upload functionality (PDF sheet music, chord sheets) with file validation.
- [x] Dynamic audio file upload and rendering functionality (Soprano, Contralto, Tenore, Basso, Organ vocal tracks supporting MP3, M4A, WAV, AAC, etc.).
- [x] Enforced file size limits of 50MB across Next.js, local Supabase CLI, and database migrations.
- [x] Storage cleanup on file replacement or deletion.

### Masses & Liturgy Planner
- [x] Calendar overview list of all scheduled masses (`components/messe-list.tsx`).
- [x] Form to create, update, and delete masses.
- [x] Messa Composer interface to arrange canti within the 15 Ambrosian liturgical moments (`components/messe-composer.tsx`).
- [x] Contextual search and selection of catalog songs inside the mass composer, with dynamic filtering to display only canti associated with the current moment or unassociated canti.
- [x] Dynamic PDF binder compilation (`app/api/masses/[id]/binder/route.ts`) to merge all sheets chronologically.
- [x] Unified PDF binder naming convention using the sanitized format `[Title]_[Date].pdf`.

## 8. Unified PDF Binder Compilation & Naming Convention
- **Status:** Implemented (Endpoint `app/api/masses/[id]/binder/route.ts`)
- **Dynamic Compilation:** Compiles all selected PDF sheet music and image uploads (PNG/JPG/JPEG) for the mass songs chronologically into a single PDF document using `pdf-lib`.
- **Naming Convention:** Generates the filename using the sanitized mass title followed by the celebration date formatted as `_DDMMYYYY` (e.g. `II_dopo_Pentecoste_07062026.pdf`). Space characters and non-alphanumeric symbols are sanitized to underscores.


