CREATE TABLE "wineries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "wineries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wine_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "winery_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "wine_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "varietals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "varietals_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "wines" ADD COLUMN "winery_id" UUID;
ALTER TABLE "wines" ADD COLUMN "wine_line_id" UUID;
ALTER TABLE "wines" ADD COLUMN "varietal_id" UUID;

CREATE UNIQUE INDEX "wineries_name_key" ON "wineries"("name");
CREATE UNIQUE INDEX "wine_lines_winery_id_name_key" ON "wine_lines"("winery_id", "name");
CREATE UNIQUE INDEX "varietals_name_key" ON "varietals"("name");

CREATE INDEX "wine_lines_name_idx" ON "wine_lines"("name");
CREATE INDEX "wines_winery_id_idx" ON "wines"("winery_id");
CREATE INDEX "wines_wine_line_id_idx" ON "wines"("wine_line_id");
CREATE INDEX "wines_varietal_id_idx" ON "wines"("varietal_id");

ALTER TABLE "wine_lines"
  ADD CONSTRAINT "wine_lines_winery_id_fkey"
  FOREIGN KEY ("winery_id") REFERENCES "wineries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wines"
  ADD CONSTRAINT "wines_winery_id_fkey"
  FOREIGN KEY ("winery_id") REFERENCES "wineries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "wines"
  ADD CONSTRAINT "wines_wine_line_id_fkey"
  FOREIGN KEY ("wine_line_id") REFERENCES "wine_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "wines"
  ADD CONSTRAINT "wines_varietal_id_fkey"
  FOREIGN KEY ("varietal_id") REFERENCES "varietals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
