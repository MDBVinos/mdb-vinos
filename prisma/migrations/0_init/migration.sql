CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "wines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "description" text,
  "price_unit" numeric(10, 2),
  "price_box" numeric(10, 2),
  "image_url" text,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "moments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "wine_types" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "intensities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "wine_moments" (
  "wine_id" uuid NOT NULL REFERENCES "wines"("id") ON DELETE CASCADE,
  "moment_id" uuid NOT NULL REFERENCES "moments"("id") ON DELETE CASCADE,
  PRIMARY KEY ("wine_id", "moment_id")
);

CREATE TABLE IF NOT EXISTS "wine_types_relation" (
  "wine_id" uuid NOT NULL REFERENCES "wines"("id") ON DELETE CASCADE,
  "type_id" uuid NOT NULL REFERENCES "wine_types"("id") ON DELETE CASCADE,
  PRIMARY KEY ("wine_id", "type_id")
);

CREATE TABLE IF NOT EXISTS "wine_intensity" (
  "wine_id" uuid NOT NULL REFERENCES "wines"("id") ON DELETE CASCADE,
  "intensity_id" uuid NOT NULL REFERENCES "intensities"("id") ON DELETE CASCADE,
  PRIMARY KEY ("wine_id", "intensity_id")
);

CREATE INDEX IF NOT EXISTS "wines_active_idx" ON "wines"("active");
CREATE INDEX IF NOT EXISTS "wines_name_idx" ON "wines"("name");
CREATE INDEX IF NOT EXISTS "wine_moments_moment_id_idx" ON "wine_moments"("moment_id");
CREATE INDEX IF NOT EXISTS "wine_types_relation_type_id_idx" ON "wine_types_relation"("type_id");
CREATE INDEX IF NOT EXISTS "wine_intensity_intensity_id_idx" ON "wine_intensity"("intensity_id");

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wines',
  'wines',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public wine images are readable'
  ) THEN
    CREATE POLICY "Public wine images are readable"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'wines');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload wine images'
  ) THEN
    CREATE POLICY "Authenticated users can upload wine images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'wines');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can update wine images'
  ) THEN
    CREATE POLICY "Authenticated users can update wine images"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'wines')
      WITH CHECK (bucket_id = 'wines');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can delete wine images'
  ) THEN
    CREATE POLICY "Authenticated users can delete wine images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'wines');
  END IF;
END $$;
