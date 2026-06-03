# Note di Fede - Archivio Musicale Sacro

Note di Fede is a modern, mobile-first web application designed to manage liturgical songs, musical arrangements, audio resources, and celebration schedules. It serves as an administrative and collaborative workspace for choir directors (maestri) and choir members (cantori).

---

## Architecture

The project is built on a modern, decoupled web architecture:

- **Framework**: [Next.js 16.2.4](file:///d:/Lavoro/WebSites/NoteDiFede/package.json#L13) utilizing the **App Router** convention. Next.js Server Actions handle data mutations, and Route Handlers serve binary media files.
- **Frontend Library**: [React 19.2.4](file:///d:/Lavoro/WebSites/NoteDiFede/package.json#L14).
- **Backend & Database**: [Supabase](file:///d:/Lavoro/WebSites/NoteDiFede/supabase/) serves as the database, storage engine, and authentication provider:
  - **PostgreSQL**: A relational database engine configured with tables, strict enum types, composite keys, checks, and update triggers.
  - **Supabase Storage**: Object storage bucket (`note-di-fede`) to store files securely (PDF scores, audio recordings) without saving binary blobs in database rows.
- **Styling**: [Tailwind CSS v4](file:///d:/Lavoro/WebSites/NoteDiFede/package.json#L25) for responsive layouts and component styling.
- **Type Safety**: [TypeScript](file:///d:/Lavoro/WebSites/NoteDiFede/tsconfig.json) is used across client components, Server Actions, and API endpoints.

---

## Database Schema

The relational database is configured within a Supabase PostgreSQL instance. Below is an exhaustive description of the tables, including their fields, types, and constraints:

### 1. `profiles`
Stores user profile information. It is linked directly to Supabase Auth (`auth.users`).
- **id** (`uuid`, Primary Key): References `auth.users (id)` on delete cascade.
- **username** (`varchar(50)`, Unique, Not Null): Identification handle.
- **full_name** (`varchar(255)`): Real name of the user.
- **role** (`app_role` enum, Not Null, default `'normale'`): Permitted values are `'normale'` (choir member) or `'maestro'` (choir conductor).
- **created_at** / **updated_at** (`timestamptz`, Default UTC now).
- **last_sign_in_at** (`timestamptz`).

### 2. `songs`
The central catalog of liturgical songs.
- **id** (`uuid`, Primary Key, default `gen_random_uuid()`).
- **code** (`varchar(50)`, Unique): A unique short identifier code (e.g., song index).
- **title** (`varchar(255)`, Not Null): Primary title.
- **alternate_title** (`varchar(255)`): Alternative or secondary title.
- **notes** (`text`): General annotations. It supports structured formats using custom tags like `[NOTE]` and `[TESTO]` (lyrics) parsed by the application.
- **created_by** / **updated_by** (`uuid`): Foreign keys referencing [profiles](file:///d:/Lavoro/WebSites/NoteDiFede/supabase_schema.sql#L41) on delete set null.
- **created_at** / **updated_at** (`timestamptz`, Default UTC now).

### 3. `mass_moments`
Defines the specific parts of a mass celebration where a song may be performed (e.g., *Ingresso*, *Offertorio*, *Comunione*).
- **id** (`uuid`, Primary Key, default `gen_random_uuid()`).
- **name** (`varchar(255)`, Unique, Not Null): Liturgical name.
- **sort_order** (`integer`, Unique, Not Null): Determines the liturgical sequence.
- **created_by** / **updated_by** (`uuid`): Foreign keys referencing [profiles](file:///d:/Lavoro/WebSites/NoteDiFede/supabase_schema.sql#L41) on delete set null.
- **created_at** / **updated_at** (`timestamptz`, Default UTC now).

### 4. `song_moments`
A junction table establishing a many-to-many relationship between songs and mass moments.
- **song_id** (`uuid`, Primary Key Component): References [songs](file:///d:/Lavoro/WebSites/NoteDiFede/supabase_schema.sql#L51) on delete cascade.
- **moment_id** (`uuid`, Primary Key Component): References [mass_moments](file:///d:/Lavoro/WebSites/NoteDiFede/supabase_schema.sql#L63) on delete cascade.
- **created_by** / **updated_by** (`uuid`): References [profiles](file:///d:/Lavoro/WebSites/NoteDiFede/supabase_schema.sql#L41).
- **created_at** / **updated_at** (`timestamptz`, Default UTC now).

### 5. `masses`
Registry of individual celebration programs or scheduled masses.
- **id** (`uuid`, Primary Key, default `gen_random_uuid()`).
- **title** (`varchar(255)`, Not Null): The liturgical celebration name (e.g., *Domenica di Pentecoste*).
- **liturgical_year** (`liturgical_year` enum, Not Null): Permitted values are `'A'`, `'B'`, or `'C'`.
- **celebration_date** (`date`, Not Null): Scheduled date of the mass.
- **notes** (`text`): General directives or liturgical guidelines.
- **created_by** / **updated_by** (`uuid`): References [profiles](file:///d:/Lavoro/WebSites/NoteDiFede/supabase_schema.sql#L41).
- **created_at** / **updated_at** (`timestamptz`, Default UTC now).

### 6. `mass_songs`
Associates songs with a specific mass celebration, indicating their order and liturgical position.
- **id** (`uuid`, Primary Key, default `gen_random_uuid()`).
- **mass_id** (`uuid`, Not Null): References [masses](file:///d:/Lavoro/WebSites/NoteDiFede/supabase_schema.sql#L96) on delete cascade.
- **song_id** (`uuid`, Not Null): References [songs](file:///d:/Lavoro/WebSites/NoteDiFede/supabase_schema.sql#L51) on delete restrict.
- **moment_id** (`uuid`, Not Null): References [mass_moments](file:///d:/Lavoro/WebSites/NoteDiFede/supabase_schema.sql#L63) on delete restrict.
- **position** (`integer`, Not Null): Sorting index. Must satisfy `position > 0`.
- **created_by** / **updated_by** (`uuid`): References [profiles](file:///d:/Lavoro/WebSites/NoteDiFede/supabase_schema.sql#L41).
- **created_at** / **updated_at** (`timestamptz`, Default UTC now).
- **Constraints**:
  - `mass_songs_position_check`: `position > 0`
  - `mass_songs_unique_position`: Unique constraint on `(mass_id, moment_id, position)` to prevent multiple songs from sharing the exact same sequence spot within a moment.
  - `mass_songs_unique_song_per_moment`: Unique constraint on `(mass_id, moment_id, song_id)` preventing the same song from being repeated inside the same moment of a single mass.

### 7. `song_files`
Stores file metadata pointing to files uploaded into the Supabase storage bucket.
- **id** (`uuid`, Primary Key, default `gen_random_uuid()`).
- **song_id** (`uuid`, Not Null): References [songs](file:///d:/Lavoro/WebSites/NoteDiFede/supabase_schema.sql#L51) on delete cascade.
- **arrangement_id** (`uuid`): References `song_arrangements` on delete cascade (if the file is tied to a specific key/arrangement).
- **file_type** (`song_file_type` enum, Not Null): Permitted formats include `'spartito_pdf'`, `'testo_pdf'`, `'accordi_pdf'`, `'mp3_completo'`, `'mp3_soprano'`, `'mp3_contralto'`, `'mp3_tenore'`, `'mp3_basso'`, and `'mp3_organo'`.
- **storage_bucket** (`varchar(100)`, Not Null, default `'note-di-fede'`).
- **storage_path** (`text`, Not Null): Logical location in the Supabase bucket.
- **public_url** (`text`): Direct URL (if public).
- **file_name** (`varchar(255)`, Not Null): Name of the file.
- **file_size_bytes** (`bigint`): Size of the file in bytes (must be non-negative).
- **mime_type** (`varchar(100)`): HTTP MIME type.
- **uploaded_by** / **updated_by** (`uuid`): References [profiles](file:///d:/Lavoro/WebSites/NoteDiFede/supabase_schema.sql#L41).
- **created_at** / **updated_at** (`timestamptz`, Default UTC now).

### 8. `song_links`
External audio, video, or tutorial reference links.
- **id** (`uuid`, Primary Key, default `gen_random_uuid()`).
- **song_id** (`uuid`, Not Null): References [songs](file:///d:/Lavoro/WebSites/NoteDiFede/supabase_schema.sql#L51) on delete cascade.
- **arrangement_id** (`uuid`): References `song_arrangements` on delete cascade.
- **label** (`varchar(255)`, Not Null): Visual description of the link (e.g. *Coro Polifonico Vaticano*).
- **url** (`text`, Not Null): Hyperlink destination.
- **provider** (`song_link_provider` enum, Not Null, default `'generic'`): Either `'youtube'` or `'generic'`.
- **link_type** (`song_link_type` enum, Not Null, default `'ascolto'`): Categorized as `'ascolto'` (listening), `'tutorial'` (educational guides), or `'riferimento'` (reference performance).
- **notes** (`text`): Additional instructions.
- **created_by** / **updated_by** (`uuid`): References [profiles](file:///d:/Lavoro/WebSites/NoteDiFede/supabase_schema.sql#L41).
- **created_at** / **updated_at** (`timestamptz`, Default UTC now).

*(For details on the database script, see the schema initialization script: [supabase_schema.sql](file:///d:/Lavoro/WebSites/NoteDiFede/supabase_schema.sql).)*

---

## Layout and Folder Structure

The application follows the Next.js App Router structure under the [app](file:///d:/Lavoro/WebSites/NoteDiFede/app/) directory:

```text
app/
├── (dashboard)/
│   ├── canti/
│   │   ├── actions.ts
│   │   └── page.tsx
│   ├── layout.tsx
│   └── messe/
│       ├── [id]/
│       │   ├── modifica/
│       │   │   └── page.tsx
│       │   └── page.tsx
│       ├── actions.ts
│       └── page.tsx
├── api/
│   └── song-files/
│       └── [fileId]/
│           └── route.ts
├── favicon.ico
├── globals.css
├── layout.tsx
└── page.tsx
```

### Route Descriptions

#### 1. Root / Entry Route
- **Location**: [app/page.tsx](file:///d:/Lavoro/WebSites/NoteDiFede/app/page.tsx)
- **Role**: Render a liturgical-themed mock login interface. Provides instant evaluation capability through pre-configured credentials:
  - **Email**: `maestro@notedifede.it`
  - **Password**: `cantoliturgico`

#### 2. Dashboard Layout Route Group
- **Location**: [app/(dashboard)/layout.tsx](file:///d:/Lavoro/WebSites/NoteDiFede/app/(dashboard)/layout.tsx)
- **Role**: Wraps all child routes inside [components/app-shell.tsx](file:///d:/Lavoro/WebSites/NoteDiFede/components/app-shell.tsx). This shell features a responsive dashboard sidebar navigation, and headers styled with classic, warm, sacred typography and background palettes.

#### 3. Canti Directory
- **Location**: [app/(dashboard)/canti/](file:///d:/Lavoro/WebSites/NoteDiFede/app/(dashboard)/canti/)
- **Components**:
  - `page.tsx`: Resolves active songs and moments from the Server API database wrappers (`getSongs()`, `getMassMoments()`) and passes them down to the search-enabled [components/canti-catalog.tsx](file:///d:/Lavoro/WebSites/NoteDiFede/components/canti-catalog.tsx).
  - `actions.ts`: Exposes typed Server Actions executing direct Postgres CRUD logic on songs, song arrangements, external links, and storage file uploads.

#### 4. Messe Directory
- **Location**: [app/(dashboard)/messe/](file:///d:/Lavoro/WebSites/NoteDiFede/app/(dashboard)/messe/)
- **Components**:
  - `page.tsx`: Queries the database for the active mass registry (`getMasses()`) and serves the [components/messe-list.tsx](file:///d:/Lavoro/WebSites/NoteDiFede/components/messe-list.tsx) component.
  - `actions.ts`: Implements administrative actions (create mass, delete mass).
  - **Dynamic Route `[id]/`**:
    - `page.tsx`: Displays celebration plans, associated musical scores, and track details utilizing [components/messa-dashboard.tsx](file:///d:/Lavoro/WebSites/NoteDiFede/components/messa-dashboard.tsx).
    - **Modification Route `modifica/`**:
      - `page.tsx`: The liturgical program editor. Connects the [components/messe-composer.tsx](file:///d:/Lavoro/WebSites/NoteDiFede/components/messe-composer.tsx) UI tool to let directors dynamically drag, sort, assign, and remove songs across different liturgical moments.

#### 5. API Route Handlers
- **Location**: [app/api/song-files/[fileId]/route.ts](file:///d:/Lavoro/WebSites/NoteDiFede/app/api/song-files/%5BfileId%5D/route.ts)
- **Role**: Validates file authorization, requests a 60-second temporary signed URL from Supabase Storage, and proxies the stream back to the client. This handles HTTP `Range` requests for inline audio elements (`MP3` vocal tracks) and provides appropriate download/attachment headers.

---

## How to Run the Project

### 1. Prerequisites
- **Node.js**: Version 20.x or higher is recommended.
- **Package Manager**: `npm` (pre-bundled with Node.js).
- **Supabase Instance**: An active Supabase project (online or local dockerized instance).

### 2. Configuration Setup
Duplicate the environment template file and insert your credentials:
```bash
cp .env.local.example .env.local
```
Open [.env.local](file:///d:/Lavoro/WebSites/NoteDiFede/.env.local) and verify the following variables are configured correctly:
- `NEXT_PUBLIC_SUPABASE_URL`: The API URL of your Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The public anonymous key for safe client operations.
- `SUPABASE_SERVICE_ROLE_KEY`: The high-privilege service key used by Server APIs (e.g. streaming proxy bypass).

### 3. Database Initialization
1. Navigate to the SQL Editor in your Supabase Dashboard.
2. Load the contents of the database initialization file: [supabase_schema.sql](file:///d:/Lavoro/WebSites/NoteDiFede/supabase_schema.sql).
3. Execute the script to initialize tables, database types, constraints, and default liturgical moment orders.
4. Ensure the storage bucket `note-di-fede` is created and private.

### 4. Running the Development Server
Install dependencies and launch the local server:
```bash
# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
By default, the server is exposed at `http://localhost:3000`.

### 5. Production Build
To build and serve a production-optimized version:
```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

### 6. Linting
Verify standard formatting and type consistency rules:
```bash
npm run lint
```
