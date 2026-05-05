# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                # Next.js dev server
npm run build              # Production build
npm run test               # Run all tests (tsx --test lib/**/*.test.ts)
npm run lint               # ESLint

npm run prisma:generate    # Regenerate Prisma client after schema changes
npm run db:migrate         # Apply pending migrations (requires DIRECT_URL)
npm run db:seed            # Seed lookups (moments, wine types, intensities)
npm run db:check           # Verify DB connection
```

After any change to `prisma/schema.prisma`, always run `npm run prisma:generate` and restart the dev server (plus `rm -rf .next` to clear the Next.js bundle cache).

Single test file: `npx tsx --test lib/admin/importer.test.ts`

## Environment

Copy `.env.example` → `.env.local` with:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase project.
- `DATABASE_URL` — Prisma runtime connection (Supavisor transaction mode for serverless).
- `DIRECT_URL` — Prisma CLI/migrations (direct or Supavisor session mode).

## Architecture

### Responsibility split

**Prisma** owns all wine catalog data. **Supabase JS client** is used only for Auth (session cookies) and Storage (image uploads). Never use Supabase JS to query catalog tables.

### Data layer

```
prisma/schema.prisma       ← canonical schema
lib/prisma.ts              ← singleton PrismaClient with PrismaPg adapter
lib/generated/prisma/      ← generated client (commit this, don't hand-edit)
```

The Prisma client uses `@prisma/adapter-pg` (engineless driver). The generated output is at `lib/generated/prisma` (non-default location). Import the client always from `@/lib/generated/prisma/client`.

### lib structure

```
lib/admin/
  queries.ts    ← admin data fetchers (requireUser guard)
  actions.ts    ← all Next.js Server Actions for admin CRUD
  importer.ts   ← Excel parse + preview logic (pure, no DB)
  types.ts      ← Admin-facing TypeScript types (Wine, WineFormOptions, etc.)

lib/public/
  queries.ts    ← public data fetchers (catalog, search, recommendations, detail)
  types.ts      ← Public-facing types (PublicWine, WineDetails, etc.)

lib/wines/
  format.ts     ← toWineView() — maps Prisma Wine row → app Wine type
  format.test.ts

lib/supabase/
  server.ts     ← createClient() for Server Components / Actions
  client.ts     ← createClient() for Client Components
  middleware.ts ← updateSession() used in middleware.ts
```

### Server Actions pattern (`lib/admin/actions.ts`)

All mutations are Next.js Server Actions (`"use server"`). Every action starts with `await requireUser()` which redirects to `/login` if no session. After mutations, `revalidateWinePaths(wineId?)` invalidates the relevant Next.js cache paths.

Wine relations (moments, type, intensity) are always replaced wholesale using `replaceWineMoments`, `replaceWineType`, `replaceWineIntensity` helpers — delete-then-insert inside a transaction.

### Excel import flow

`lib/admin/importer.ts` is pure (no Prisma). It exports:
1. `parseWineImportWorkbook(buffer)` — reads ExcelJS, maps headers via `HEADER_ALIASES`, returns `ParsedWineImportRow[]`.
2. `buildWineImportPreview(rows, context)` — validates rows against existing DB data, returns `WineImportPreview` with errors/warnings per row.

`lib/admin/actions.ts` then either previews (returns JSON payload to the form) or applies (`applyWineImportRows` — upsert by name, per-row transactions).

### Design tokens

Global CSS variables defined in `app/globals.css`. Key tokens:
- `--bg`, `--panel`, `--panel-soft`, `--text`, `--muted`, `--line`
- `--accent` (#5d1417 bordeaux), `--danger` (#702c2c), `--success` (#29473a)
- `--shadow`

Typography: Cormorant Garamond for body/editorial, Arial/Helvetica for all form controls and admin UI.

Global button classes: `.button` (primary), `.button.secondary`, `.button.danger` / `button.danger`. Use CSS Modules for component-level styles only.

### Auth

`middleware.ts` calls `updateSession` on every non-static request to keep Supabase cookies fresh. Protected pages/actions call `requireUser()` from `lib/admin/queries.ts`.
