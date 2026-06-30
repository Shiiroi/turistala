# Turistala

Turistala is an open-source, self-hostable travel journal and visualization platform. It allows users to track and catalog their journeys across the Philippines, rendering a personalized progress heatmap overlaid onto interactive maps of Philippine administrative divisions.

Live: https://turistala.shhiroi.me

> Turistala is an independent project. It is not affiliated with or endorsed by the Philippine Statistics Authority (PSA) or any government agency.

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Data pipeline](#data-pipeline)
- [GeoJSON format](#geojson-format)
- [Data sources & licenses](#data-sources--licenses)
- [Contributing](#contributing)
- [License](#license)

## Features

- Interactive Leaflet map with division switching across region, province, and city/municipality levels.
- Pre-sliced provincial geometry downloads, optimized to load only the boundaries required for the current map view.
- Real-time travel progress calculation and progression stamps booklet (Region Badges, Stamp Badges, and progress percentages).
- Customized visited logs and journal entries supporting title, visit date, description content, and photos.
- Direct map view image capture, canvas PNG export, and JSON format travel backup downloads.

## Architecture

Administrative metadata (regions, provinces, municipalities, visited places, goals, journals) is stored in Postgres through Supabase. Boundary geometry is served as chunked GeoJSON from a public Supabase Storage bucket (CDN); the source boundary files are pre-processed and split under `frontend/public/geo` and uploaded by `pnpm upload:geo`. The frontend is a static single-page application that queries boundaries directly from the public storage bucket or static assets on demand, resolving database queries asynchronously via API clients.

## Tech stack

- Frontend: Vite, React, TypeScript, Tailwind CSS v4
- Map: Leaflet / react-leaflet
- Data fetching: TanStack Query (React Query)
- Backend: Supabase (Postgres for metadata, public Storage bucket 'geo' for boundary CDN, 'journal-images' for media)
- Package manager: pnpm
- Hosting: Vercel

## Project structure

```
turistala/
├── frontend/
│   ├── public/                      # Web-served static assets (favicon, logo, etc.)
│   │   └── geo/                     # Pre-sliced GeoJSON files
│   │       ├── regions.json, provinces.json
│   │       └── municities/          # meta.json, manifest.json, province-*.json
│   ├── scripts/
│   │   ├── export-geo-layers.ts     # Links CSV metadata with GeoJSON boundaries into public/geo/
│   │   ├── upload-geo-storage.ts    # Uploads public/geo/** JSON chunks to Supabase Storage 'geo' bucket
│   │   ├── seeder.ts                # Seeds Postgres regions, provinces, and municities reference tables
│   │   └── geoLayersFromCsv.ts      # CSV parser and boundary mapping helper utilities
│   └── src/
│       ├── features/
│       │   ├── auth/                # Sign-in, sign-up, Gate components, session handlers
│       │   ├── homepage/            # Browse sidebar layouts, division list details, detail panels
│       │   ├── journal/             # Photo logs feed, image uploader, storage quota checks
│       │   ├── map/                 # Leaflet travel map components, PNG exporters, toolbar overlays
│       │   ├── passport/            # Progress badges grid, stamp booklets modal, progress tags
│       │   ├── places/              # Search combobox and custom POI boundary lookup services
│       │   ├── profile/             # Profile avatars canvas cropper, map accent color hook
│       │   └── travel/              # Quick journal forms, authenticated/mock store hooks
│       ├── components/              # Global UI elements (Button, Modal, Toast) and Brand Logo
│       ├── config/                  # Supabase clients and storage quota limits
│       └── pages/                   # WelcomePage, LoginPage, HomePage router structures
├── supabase/
│   ├── migrations/                  # Database schemas, storage buckets creation, and RLS triggers
│   ├── seed.sql                     # DB table truncations before seeding
│   ├── config.toml                  # Supabase project CLI settings
│   └── snippets/                    # Legacy queries (patch_province_by_spatial_match)
└── README.md
```

## Getting started

### Prerequisites

- Node.js 20+
- pnpm
- A Supabase project

### 1. Install

```bash
cd frontend
pnpm install
```

### 2. Environment

Create `frontend/.env`:

```bash
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>

# Required for data pipeline scripts only (never expose to the client)
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 3. Apply database schema

Run the migrations in `supabase/migrations/` against your Supabase project using the Supabase CLI or Dashboard SQL editor.

### 4. Build boundaries and seed metadata

Ingest the spatial geometry layers and seed the Postgres metadata tables:

```bash
cd frontend

# Step 1: Export boundary layers locally into public/geo/
pnpm export:geo

# Step 2: Upload processed layers to Supabase Storage 'geo' bucket
pnpm upload:geo

# Step 3: Seed PostgreSQL metadata tables
pnpm run tsx scripts/seeder.ts
```

| Command | Description |
|---------|-------------|
| `pnpm export:geo` | Merges CSVs and local boundaries into `public/geo/` |
| `pnpm upload:geo` | Uploads `public/geo/**` to Supabase Storage `geo` bucket |
| `pnpm run tsx scripts/seeder.ts` | Seeds regions, provinces, and municities metadata |

### 5. Run the app

```bash
pnpm dev
```

---

## Data pipeline

```
frontend/scripts/
  ├── regions.csv, provinces.csv, municities.csv (PSGC metadata)
  ├── Local GeoJSON Boundary Assets
  │
  ├── export:geo ───────► public/geo/* (pre-sliced regional/provincial boundary JSONs)
  │
  ├── upload:geo ───────► Supabase Storage: 'geo' bucket (public CDN)
  │
  └── seeder.ts ────────► Supabase DB: Postgres (reference metadata tables)
```

Geospatial boundaries are pre-split by province so the Leaflet frontend only downloads municipal coordinates dynamically when focused.

---

## GeoJSON format

All exported boundaries are RFC 7946 GeoJSON `FeatureCollection`s in WGS 84 (EPSG:4326). Feature properties are matched with the standard 10-digit PSGC numeric code:

```json
{
  "type": "Feature",
  "properties": {
    "id": 1339,
    "name": "Bacolod City",
    "code": "1804501000",
    "province_id": 45,
    "region_id": 10,
    "type": "city",
    "mode": "municipality"
  },
  "geometry": { "type": "MultiPolygon", "coordinates": [ ... ] }
}
```

---

## Data sources & licenses

| Source | Used for | License |
|--------|----------|---------|
| [faeldon/philippines-json-maps](https://github.com/faeldon/philippines-json-maps) | Region, province, municipality GeoJSON boundaries (re-keyed to PSGC) | MIT © James Faeldon |
| [GADM](https://gadm.org/) | Upstream geospatial boundary maps | Non-Commercial |
| [PhilGIS](http://philgis.org/) | Upstream Philippine geographical shapefiles | Non-Commercial |
| [PSA PSGC](https://psa.gov.ph/classification/psgc/) | Administrative reference codes, names, and hierarchies | Public (attribution required) |

Full third-party license text guidelines are in [`NOTICE.md`](./NOTICE.md) if present. Turistala re-keys, links, and packages these datasets; it does not claim ownership of the underlying statistical or boundary data.

---

## Contributing

Contributions, bug reports, and database boundary suggestions are welcome. Please open an issue outlining the modification request with references to official resources (e.g., PSA updates).

---

## License

Source code is available under the MIT License. Bound geometries are derived from the third-party sources listed above.
