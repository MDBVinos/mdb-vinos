ALTER TABLE "wines"
  ADD COLUMN IF NOT EXISTS "winery" text,
  ADD COLUMN IF NOT EXISTS "units_per_box" integer,
  ADD COLUMN IF NOT EXISTS "featured" boolean NOT NULL DEFAULT false;
