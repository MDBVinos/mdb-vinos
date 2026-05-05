"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  buildWineImportPreview,
  normalizeImportKey,
  parseWineImportWorkbook,
  type WineImportPreview,
  type WineImportPreviewRow,
} from "./importer";
import { requireUser } from "./queries";
import type { ActionState } from "./types";

const WINE_BUCKET = "wines";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value === "" ? null : Number(value);
}

function integerValue(formData: FormData, key: string) {
  const value = numberValue(formData, key);
  return value == null ? null : Math.trunc(value);
}

function checkedValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
}

async function uploadWineImage(formData: FormData, currentUrl?: string | null) {
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    return currentUrl ?? null;
  }

  const { supabase } = await requireUser();
  const path = `wines/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from(WINE_BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(WINE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function winePayload(formData: FormData, imageUrl: string | null) {
  const name = stringValue(formData, "name");

  if (!name) {
    throw new Error("El nombre del vino es obligatorio.");
  }

  return {
    active: checkedValue(formData, "active"),
    description: stringValue(formData, "description") || null,
    featured: checkedValue(formData, "featured"),
    imageUrl,
    name,
    priceBox: numberValue(formData, "price_box"),
    priceUnit: numberValue(formData, "price_unit"),
    unitsPerBox: integerValue(formData, "units_per_box"),
    winery: stringValue(formData, "winery") || null,
  };
}

async function replaceWineMoments(tx: Prisma.TransactionClient, wineId: string, momentIds: string[]) {
  await tx.wineMoment.deleteMany({ where: { wineId } });

  if (momentIds.length > 0) {
    await tx.wineMoment.createMany({
      data: momentIds.map((momentId) => ({
        momentId,
        wineId,
      })),
      skipDuplicates: true,
    });
  }
}

async function replaceWineType(tx: Prisma.TransactionClient, wineId: string, wineTypeId: string | null) {
  await tx.wineTypeRelation.deleteMany({ where: { wineId } });

  if (wineTypeId) {
    await tx.wineTypeRelation.create({
      data: {
        typeId: wineTypeId,
        wineId,
      },
    });
  }
}

async function replaceWineIntensity(tx: Prisma.TransactionClient, wineId: string, intensityId: string | null) {
  await tx.wineIntensity.deleteMany({ where: { wineId } });

  if (intensityId) {
    await tx.wineIntensity.create({
      data: {
        intensityId,
        wineId,
      },
    });
  }
}

async function replaceWineRelations(
  tx: Prisma.TransactionClient,
  wineId: string,
  momentIds: string[],
  wineTypeId: string,
  intensityId: string,
) {
  await Promise.all([
    replaceWineMoments(tx, wineId, momentIds),
    replaceWineType(tx, wineId, wineTypeId || null),
    replaceWineIntensity(tx, wineId, intensityId || null),
  ]);
}

function revalidateWinePaths(wineId?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/wines");
  revalidatePath("/discover");

  if (wineId) {
    revalidatePath(`/wine/${wineId}`);
    revalidatePath(`/admin/edit/${wineId}`);
  }
}

export type WineImportActionState = {
  error?: string;
  payload?: string;
  preview?: WineImportPreview;
};

async function wineImportContext() {
  const [existingWines, moments, wineTypes, intensities] = await Promise.all([
    prisma.wine.findMany({ select: { id: true, name: true } }),
    prisma.moment.findMany({ select: { id: true, name: true } }),
    prisma.wineType.findMany({ select: { id: true, name: true } }),
    prisma.intensity.findMany({ select: { id: true, name: true } }),
  ]);

  return {
    existingWines,
    intensities,
    moments,
    wineTypes,
  };
}

function parseWineImportRows(payload: string): WineImportPreviewRow[] {
  const rows = JSON.parse(payload);

  if (!Array.isArray(rows)) {
    throw new Error("El payload del importador es invalido.");
  }

  return rows as WineImportPreviewRow[];
}

function describeDatabaseError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return "ya existe un vino con ese nombre o un campo duplicado en la base.";
      case "P2003":
        return "alguna relacion (tipo, intensidad o momento) no existe en la base.";
      case "P2025":
        return "el vino o una relacion referenciada no se encontro.";
      default:
        return `error de base de datos (${error.code}).`;
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return "los datos enviados no pasaron la validacion de la base.";
  }

  if (error instanceof Error) {
    if (/expired transaction|transaction.*timeout/i.test(error.message)) {
      return "la operacion tardo demasiado y la transaccion expiro. Probá importar menos filas a la vez.";
    }
    return error.message;
  }

  return "error desconocido.";
}

async function applyWineImportRows(rows: WineImportPreviewRow[]) {
  if (rows.length === 0) {
    throw new Error("No hay filas para importar.");
  }

  const invalidRows = rows.filter((row) => row.errors.length > 0);
  if (invalidRows.length > 0) {
    const sample = invalidRows
      .slice(0, 3)
      .map((row) => `fila ${row.line}: ${row.errors.join(" ")}`)
      .join(" | ");
    const extra = invalidRows.length > 3 ? ` (y ${invalidRows.length - 3} mas)` : "";
    throw new Error(`Corregi los errores del preview antes de importar. ${sample}${extra}`);
  }

  let creates = 0;
  let updates = 0;

  const existingWines = await prisma.wine.findMany({ select: { id: true, name: true } });
  const existingIds = new Set(existingWines.map((wine) => wine.id));
  const existingByName = new Map(existingWines.map((wine) => [normalizeImportKey(wine.name), wine]));

  for (const row of rows) {
    const currentWineId =
      row.wineId && existingIds.has(row.wineId)
        ? row.wineId
        : (existingByName.get(normalizeImportKey(row.name))?.id ?? null);

    const payload = {
      featured: row.featured,
      name: row.name,
      priceBox: row.priceBox,
      priceUnit: row.priceUnit,
      unitsPerBox: row.unitsPerBox,
      winery: row.winery,
    };

    try {
      if (currentWineId) {
        await prisma.$transaction(
          async (tx) => {
            await tx.wine.update({
              data: row.hasExplicitImage ? { ...payload, imageUrl: row.imageUrl } : payload,
              where: { id: currentWineId },
            });

            if (row.hasExplicitType) {
              await replaceWineType(tx, currentWineId, row.typeId);
            }

            if (row.hasExplicitIntensity) {
              await replaceWineIntensity(tx, currentWineId, row.intensityId);
            }

            if (row.hasExplicitMoments) {
              await replaceWineMoments(tx, currentWineId, row.momentIds);
            }
          },
          { maxWait: 10_000, timeout: 30_000 },
        );

        updates += 1;
        continue;
      }

      const wine = await prisma.$transaction(
        async (tx) => {
          const created = await tx.wine.create({
            data: {
              ...payload,
              active: true,
              imageUrl: row.imageUrl,
            },
            select: { id: true, name: true },
          });

          if (row.typeId) {
            await replaceWineType(tx, created.id, row.typeId);
          }

          if (row.intensityId) {
            await replaceWineIntensity(tx, created.id, row.intensityId);
          }

          if (row.momentIds.length > 0) {
            await replaceWineMoments(tx, created.id, row.momentIds);
          }

          return created;
        },
        { maxWait: 10_000, timeout: 30_000 },
      );

      existingIds.add(wine.id);
      existingByName.set(normalizeImportKey(wine.name), wine);
      creates += 1;
    } catch (error) {
      console.error(`[wine-import] fila ${row.line} (${row.name}) fallo:`, error);
      const reason = describeDatabaseError(error);
      const wineLabel = row.name ? `"${row.name}"` : "(sin nombre)";
      const progress = `Procesados antes del fallo: ${creates} creados y ${updates} actualizados.`;
      throw new Error(`Fila ${row.line} ${wineLabel}: ${reason} ${progress}`);
    }
  }

  return { creates, updates };
}

export async function previewWineImportAction(
  _state: WineImportActionState,
  formData: FormData,
): Promise<WineImportActionState> {
  try {
    await requireUser();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Subi un archivo .xlsx para previsualizar.");
    }

    const parsed = await parseWineImportWorkbook(Buffer.from(await file.arrayBuffer()));
    const preview = buildWineImportPreview(parsed.rows, await wineImportContext());

    if (preview.rows.length === 0) {
      throw new Error("El Excel no tiene filas para importar.");
    }

    return {
      payload: JSON.stringify(preview.rows),
      preview,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo leer el Excel." };
  }
}

export async function confirmWineImportAction(
  _state: WineImportActionState,
  formData: FormData,
): Promise<WineImportActionState> {
  let result: Awaited<ReturnType<typeof applyWineImportRows>>;

  try {
    await requireUser();
    result = await applyWineImportRows(parseWineImportRows(stringValue(formData, "payload")));
  } catch (error) {
    console.error("[wine-import] error al confirmar importacion:", error);
    const reason = error instanceof Error ? error.message : describeDatabaseError(error);
    return { error: `No se pudo importar el Excel. ${reason}` };
  }

  revalidateWinePaths();
  redirect(`/admin?imported=${result.creates + result.updates}`);
}

export async function createWineAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireUser();
    const imageUrl = await uploadWineImage(formData);
    const payload = winePayload(formData, imageUrl);

    await prisma.$transaction(async (tx) => {
      const wine = await tx.wine.create({
        data: payload,
        select: { id: true },
      });

      await replaceWineRelations(
        tx,
        wine.id,
        formData.getAll("moments").map(String),
        stringValue(formData, "wine_type_id"),
        stringValue(formData, "intensity_id"),
      );
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo crear el vino." };
  }

  revalidateWinePaths();
  redirect("/admin?created=1");
}

export async function updateWineAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const wineId = stringValue(formData, "id");
  const currentImageUrl = stringValue(formData, "current_image_url") || null;

  try {
    await requireUser();
    const imageUrl = await uploadWineImage(formData, currentImageUrl);
    const payload = winePayload(formData, imageUrl);

    await prisma.$transaction(async (tx) => {
      await tx.wine.update({
        data: payload,
        where: { id: wineId },
      });

      await replaceWineRelations(
        tx,
        wineId,
        formData.getAll("moments").map(String),
        stringValue(formData, "wine_type_id"),
        stringValue(formData, "intensity_id"),
      );
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo actualizar el vino." };
  }

  revalidateWinePaths(wineId);
  redirect("/admin?updated=1");
}

export async function toggleWineActiveAction(formData: FormData) {
  const wineId = stringValue(formData, "id");
  const active = formData.get("active") === "true";

  await requireUser();
  await prisma.wine.update({
    data: { active: !active },
    where: { id: wineId },
  });

  revalidateWinePaths(wineId);
}

export async function deleteWineAction(formData: FormData) {
  const wineId = stringValue(formData, "id");

  await requireUser();
  await prisma.wine.delete({ where: { id: wineId } });

  revalidateWinePaths(wineId);
}
