# Observolife

A personal observation engine that transforms everyday life events into patterns and discoveries — without judgment or prescriptions.

## Stack

- Next.js 16 + TypeScript
- MongoDB Atlas + Mongoose (Atlas Search for full-text)
- Auth.js (email/password + optional Google) via the MongoDB adapter
- Tailwind CSS + shadcn/ui
- PWA-ready (manifest + offline event queue)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Set `MONGODB_URI` to your MongoDB Atlas connection string and `MONGODB_DB` to the database name, then generate an `AUTH_SECRET`.

### 3. Create indexes

Collections are created automatically on first write. Run this once (and after schema changes) to add the regular indexes and the Atlas Search index used by `/search`:

```bash
npm run db:indexes
```

The Atlas Search index only exists on MongoDB Atlas; until it finishes provisioning, text search returns no results (date/amount filters still work).

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start logging events.

## Phase 1 features

- Instant, bulk, and retrospective event logging
- Event timeline with soft delete
- Rule-based discovery feed (no AI yet)
- Configurable analysis cadence in settings (stored for Phase 4)
- JSON data export + account deletion
- Offline event queue (syncs when back online)

## Phase 2 features

- Signal aggregation pipeline (coffee, sleep, gym, spending, etc.)
- Period-over-period deltas with percentage changes in feed
- Atlas Search full-text search + keyword/date/spending filters
- `/search` page to browse your recorded life

## Project structure

```
src/
├── app/
│   ├── (app)/          # Authenticated pages
│   ├── (auth)/         # Login / register
│   └── api/            # Route handlers
├── components/         # UI components
└── lib/
    ├── auth/           # Auth.js config
    ├── db/             # Mongoose models + connection
    ├── events/         # Event parsing + service
    ├── feed/           # Rule-based feed generation
    └── offline/        # IndexedDB queue
```

## Phase 3 features

- **Wants** — CRUD with auto-suggested keywords + rule-based alignment (↗ / → / ↘)
- **Beliefs (hypotheses)** — CRUD with 30-day evidence evaluation (Supported / Moderately / Not yet)
- Wants alignment surfaced in the discovery feed
- Search quick filters (coffee, sleep, gym, etc.)
- **Responsive layout** — sidebar nav on desktop (md+), bottom nav on mobile

## Roadmap

- **Phase 4:** Configurable AI analysis (weekly/monthly/custom)
