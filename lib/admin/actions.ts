"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { validateWineImageImportRows } from "./image-import";
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
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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

function stringListValue(formData: FormData, key: string) {
  return [...new Set(formData.getAll(key).map(String).filter(Boolean))];
}

function discountPayload(formData: FormData) {
  const name = stringValue(formData, "name");
  const percent = integerValue(formData, "percent");

  if (!name) {
    throw new Error("El nombre del descuento es obligatorio.");
  }

  if (percent == null || percent < 1 || percent > 99) {
    throw new Error("El descuento tiene que ser un numero entre 1 y 99.");
  }

  return { name, percent };
}

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
}

async function uploadWineImage(formData: FormData, currentUrl?: string | null) {
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    return currentUrl ?? null;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("La imagen supera los 5 MB. Subi una version mas liviana.");
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
    varietalId: stringValue(formData, "varietal_id") || null,
    wineLineId: stringValue(formData, "wine_line_id") || null,
    winery: stringValue(formData, "winery") || null,
    wineryId: stringValue(formData, "winery_id") || null,
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

async function replaceWineIntensities(tx: Prisma.TransactionClient, wineId: string, intensityIds: string[]) {
  await tx.wineIntensity.deleteMany({ where: { wineId } });

  if (intensityIds.length > 0) {
    await tx.wineIntensity.createMany({
      data: intensityIds.map((intensityId) => ({
        intensityId,
        wineId,
      })),
      skipDuplicates: true,
    });
  }
}

async function replaceWineRelations(
  tx: Prisma.TransactionClient,
  wineId: string,
  momentIds: string[],
  wineTypeId: string,
  intensityIds: string[],
) {
  await Promise.all([
    replaceWineMoments(tx, wineId, momentIds),
    replaceWineType(tx, wineId, wineTypeId || null),
    replaceWineIntensities(tx, wineId, intensityIds),
  ]);
}

function revalidateWinePaths(wineId?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/descuentos");
  revalidatePath("/admin/import");
  revalidatePath("/bodegas");
  revalidatePath("/wines");
  revalidatePath("/discover");
  revalidatePath("/lineas/[id]", "page");
  revalidatePath("/wine/[id]", "page");

  if (wineId) {
    revalidateWineDetailPaths(wineId);
  }
}

async function replaceDiscountWines(
  tx: Prisma.TransactionClient,
  discountId: string,
  percent: number,
  active: boolean,
  wineIds: string[],
) {
  await tx.wine.updateMany({
    data: {
      discountId: null,
      discountPercent: null,
    },
    where: { discountId },
  });

  if (wineIds.length > 0) {
    await tx.wine.updateMany({
      data: {
        discountId,
        discountPercent: active ? percent : null,
      },
      where: { id: { in: wineIds } },
    });
  }
}

function revalidateWineDetailPaths(wineId: string) {
  revalidatePath(`/wine/${wineId}`);
  revalidatePath(`/admin/edit/${wineId}`);
}

export type WineImportActionState = {
  error?: string;
  payload?: string;
  preview?: WineImportPreview;
};

export type WineImageImportActionState = {
  error?: string;
};

async function wineImportContext() {
  const [existingWines, moments, wineTypes, intensities, wineries, wineLines, varietals] = await Promise.all([
    prisma.wine.findMany({ select: { id: true, name: true } }),
    prisma.moment.findMany({ select: { id: true, name: true } }),
    prisma.wineType.findMany({ select: { id: true, name: true } }),
    prisma.intensity.findMany({ select: { id: true, name: true } }),
    prisma.winery.findMany({ select: { id: true, name: true } }),
    prisma.wineLine.findMany({ select: { id: true, name: true, wineryId: true } }),
    prisma.varietal.findMany({ select: { id: true, name: true } }),
  ]);

  return {
    existingWines,
    intensities,
    moments,
    varietals,
    wineLines,
    wineTypes,
    wineries,
  };
}

function parseWineImportRows(payload: string): WineImportPreviewRow[] {
  const rows = JSON.parse(payload);

  if (!Array.isArray(rows)) {
    throw new Error("El payload del importador es invalido.");
  }

  return rows as WineImportPreviewRow[];
}

async function ensureImportLookups(rows: WineImportPreviewRow[]) {
  const momentNames = uniqueImportNames(rows.flatMap((row) => (row.hasExplicitMoments ? row.momentNames : [])));
  const intensityNames = uniqueImportNames(
    rows.flatMap((row) => (row.hasExplicitIntensity ? row.intensityNames : [])),
  );
  const typeNames = uniqueImportNames(rows.flatMap((row) => (row.hasExplicitType && row.typeName ? [row.typeName] : [])));
  const wineryNames = uniqueImportNames(rows.flatMap((row) => (row.hasExplicitWinery && row.winery ? [row.winery] : [])));
  const varietalNames = uniqueImportNames(
    rows.flatMap((row) => (row.hasExplicitVarietal && row.varietalName ? [row.varietalName] : [])),
  );

  const [moments, intensities, wineTypes, wineries, wineLines, varietals] = await Promise.all([
    prisma.moment.findMany({ select: { id: true, name: true } }),
    prisma.intensity.findMany({ select: { id: true, name: true } }),
    prisma.wineType.findMany({ select: { id: true, name: true } }),
    prisma.winery.findMany({ select: { id: true, name: true } }),
    prisma.wineLine.findMany({ select: { id: true, name: true, wineryId: true } }),
    prisma.varietal.findMany({ select: { id: true, name: true } }),
  ]);

  const momentByName = new Map(moments.map((moment) => [normalizeImportKey(moment.name), moment]));
  const intensityByName = new Map(intensities.map((intensity) => [normalizeImportKey(intensity.name), intensity]));
  const wineTypeByName = new Map(wineTypes.map((type) => [normalizeImportKey(type.name), type]));
  const wineryByName = new Map(wineries.map((winery) => [normalizeImportKey(winery.name), winery]));
  const wineLineByWineryAndName = new Map(
    wineLines.map((line) => [`${line.wineryId}:${normalizeImportKey(line.name)}`, line]),
  );
  const varietalByName = new Map(varietals.map((varietal) => [normalizeImportKey(varietal.name), varietal]));

  for (const name of momentNames) {
    const key = normalizeImportKey(name);
    if (!momentByName.has(key)) {
      const moment = await prisma.moment.create({ data: { name }, select: { id: true, name: true } });
      momentByName.set(key, moment);
    }
  }

  for (const name of intensityNames) {
    const key = normalizeImportKey(name);
    if (!intensityByName.has(key)) {
      const intensity = await prisma.intensity.create({ data: { name }, select: { id: true, name: true } });
      intensityByName.set(key, intensity);
    }
  }

  for (const name of typeNames) {
    const key = normalizeImportKey(name);
    if (!wineTypeByName.has(key)) {
      const wineType = await prisma.wineType.create({ data: { name }, select: { id: true, name: true } });
      wineTypeByName.set(key, wineType);
    }
  }

  for (const name of wineryNames) {
    const key = normalizeImportKey(name);
    if (!wineryByName.has(key)) {
      const winery = await prisma.winery.create({ data: { name }, select: { id: true, name: true } });
      wineryByName.set(key, winery);
    }
  }

  for (const name of varietalNames) {
    const key = normalizeImportKey(name);
    if (!varietalByName.has(key)) {
      const varietal = await prisma.varietal.create({ data: { name }, select: { id: true, name: true } });
      varietalByName.set(key, varietal);
    }
  }

  for (const row of rows) {
    if (!row.winery || !row.wineryLineName) {
      continue;
    }

    const winery = wineryByName.get(normalizeImportKey(row.winery));
    if (!winery) {
      continue;
    }

    const key = `${winery.id}:${normalizeImportKey(row.wineryLineName)}`;
    if (!wineLineByWineryAndName.has(key)) {
      const line = await prisma.wineLine.create({
        data: {
          name: row.wineryLineName,
          wineryId: winery.id,
        },
        select: { id: true, name: true, wineryId: true },
      });
      wineLineByWineryAndName.set(key, line);
    }
  }

  return { intensityByName, momentByName, varietalByName, wineLineByWineryAndName, wineTypeByName, wineryByName };
}

function uniqueImportNames(names: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const name of names) {
    const key = normalizeImportKey(name);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(name);
    }
  }

  return result;
}

function idsForNames(names: string[], lookup: Map<string, { id: string; name: string }>) {
  return names
    .map((name) => lookup.get(normalizeImportKey(name))?.id)
    .filter((id): id is string => Boolean(id));
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
  const rowsToImport = rows.filter((row) => row.action !== "skip");

  if (rowsToImport.length === 0) {
    throw new Error("No hay filas para importar.");
  }

  const invalidRows = rowsToImport.filter((row) => row.errors.length > 0);
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
  const changedWineIds: string[] = [];

  const lookupIds = await ensureImportLookups(rowsToImport);
  const existingWines = await prisma.wine.findMany({ select: { id: true, name: true } });
  const existingIds = new Set(existingWines.map((wine) => wine.id));
  const existingByName = new Map(existingWines.map((wine) => [normalizeImportKey(wine.name), wine]));

  for (const row of rowsToImport) {
    const currentWineId =
      row.wineId && existingIds.has(row.wineId)
        ? row.wineId
        : (existingByName.get(normalizeImportKey(row.name))?.id ?? null);

    const payload = {
      name: row.name,
      priceBox: row.priceBox,
      priceUnit: row.priceUnit,
      unitsPerBox: row.unitsPerBox,
      varietalId: row.varietalName
        ? (lookupIds.varietalByName.get(normalizeImportKey(row.varietalName))?.id ?? null)
        : null,
      wineLineId:
        row.winery && row.wineryLineName
          ? (lookupIds.wineLineByWineryAndName.get(
              `${lookupIds.wineryByName.get(normalizeImportKey(row.winery))?.id ?? ""}:${normalizeImportKey(
                row.wineryLineName,
              )}`,
            )?.id ?? null)
          : null,
      wineryId: row.winery ? (lookupIds.wineryByName.get(normalizeImportKey(row.winery))?.id ?? null) : null,
      winery: row.winery,
    };
    const updatePayload = {
      ...payload,
      ...(row.hasExplicitActive ? { active: row.active } : {}),
      ...(row.hasExplicitDescription ? { description: row.description } : {}),
      ...(row.hasExplicitFeatured ? { featured: row.featured } : {}),
    };
    const momentIds = idsForNames(row.momentNames, lookupIds.momentByName);
    const intensityIds = idsForNames(row.intensityNames, lookupIds.intensityByName);
    const typeId = row.typeName ? (lookupIds.wineTypeByName.get(normalizeImportKey(row.typeName))?.id ?? null) : null;

    try {
      if (currentWineId) {
        await prisma.$transaction(
          async (tx) => {
            await tx.wine.update({
              data: row.hasExplicitImage ? { ...updatePayload, imageUrl: row.imageUrl } : updatePayload,
              where: { id: currentWineId },
            });

            if (row.hasExplicitType) {
              await replaceWineType(tx, currentWineId, typeId);
            }

            if (row.hasExplicitIntensity) {
              await replaceWineIntensities(tx, currentWineId, intensityIds);
            }

            if (row.hasExplicitMoments) {
              await replaceWineMoments(tx, currentWineId, momentIds);
            }
          },
          { maxWait: 10_000, timeout: 30_000 },
        );

        updates += 1;
        changedWineIds.push(currentWineId);
        continue;
      }

      const wine = await prisma.$transaction(
        async (tx) => {
          const created = await tx.wine.create({
            data: {
              ...payload,
              active: row.hasExplicitActive ? row.active : true,
              description: row.hasExplicitDescription ? row.description : null,
              featured: row.hasExplicitFeatured ? row.featured : false,
              imageUrl: row.imageUrl,
            },
            select: { id: true, name: true },
          });

          if (typeId) {
            await replaceWineType(tx, created.id, typeId);
          }

          if (intensityIds.length > 0) {
            await replaceWineIntensities(tx, created.id, intensityIds);
          }

          if (momentIds.length > 0) {
            await replaceWineMoments(tx, created.id, momentIds);
          }

          return created;
        },
        { maxWait: 10_000, timeout: 30_000 },
      );

      existingIds.add(wine.id);
      existingByName.set(normalizeImportKey(wine.name), wine);
      creates += 1;
      changedWineIds.push(wine.id);
    } catch (error) {
      console.error(`[wine-import] fila ${row.line} (${row.name}) fallo:`, error);
      const reason = describeDatabaseError(error);
      const wineLabel = row.name ? `"${row.name}"` : "(sin nombre)";
      const progress = `Procesados antes del fallo: ${creates} creados y ${updates} actualizados.`;
      throw new Error(`Fila ${row.line} ${wineLabel}: ${reason} ${progress}`);
    }
  }

  return { creates, updates, wineIds: changedWineIds };
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
  for (const wineId of new Set(result.wineIds)) {
    revalidateWineDetailPaths(wineId);
  }
  redirect(`/admin/import?imported=${result.creates + result.updates}`);
}

export async function uploadWineImagesAction(
  _state: WineImageImportActionState,
  formData: FormData,
): Promise<WineImageImportActionState> {
  let uploaded = 0;

  try {
    const { supabase } = await requireUser();
    const files = formData.getAll("images").filter((file): file is File => file instanceof File && file.size > 0);
    const wineIds = formData.getAll("wine_ids").map(String);
    const replacements = formData.getAll("replace_existing").map((value) => value === "true");

    if (files.length === 0) {
      throw new Error("Seleccioná al menos una imagen.");
    }

    const wines = await prisma.wine.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        imageUrl: true,
        name: true,
      },
    });
    const validation = validateWineImageImportRows(
      files.map((file, index) => ({
        file,
        replaceExisting: replacements[index] ?? false,
        wineId: wineIds[index] ?? "",
      })),
      wines,
    );

    if (validation.errors.length > 0) {
      throw new Error(validation.errors.join(" "));
    }

    for (const [index, row] of validation.rows.entries()) {
      const path = `wines/${Date.now()}-${index}-${sanitizeFileName(row.file.name)}`;
      const { error } = await supabase.storage.from(WINE_BUCKET).upload(path, row.file, {
        contentType: row.file.type || "image/jpeg",
        upsert: false,
      });

      if (error) {
        throw new Error(error.message);
      }

      const { data } = supabase.storage.from(WINE_BUCKET).getPublicUrl(path);
      await prisma.wine.update({
        data: { imageUrl: data.publicUrl },
        where: { id: row.wine.id },
      });
      revalidateWinePaths(row.wine.id);
      uploaded += 1;
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudieron subir las imagenes." };
  }

  redirect(`/admin/import?images=${uploaded}`);
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
        formData.getAll("intensities").map(String),
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
        formData.getAll("intensities").map(String),
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

export async function bulkWineAction(formData: FormData) {
  const intent = stringValue(formData, "intent");
  const wineIds = stringListValue(formData, "wine_ids");

  await requireUser();

  if (wineIds.length === 0) {
    throw new Error("Seleccioná al menos un vino.");
  }

  if (intent === "activate" || intent === "deactivate") {
    await prisma.wine.updateMany({
      data: { active: intent === "activate" },
      where: { id: { in: wineIds } },
    });
  } else if (intent === "feature" || intent === "unfeature") {
    await prisma.wine.updateMany({
      data: { featured: intent === "feature" },
      where: { id: { in: wineIds } },
    });
  } else if (intent === "discount") {
    const { name, percent } = discountPayload(formData);
    await prisma.$transaction(async (tx) => {
      const discount = await tx.discount.create({
        data: { name, percent },
        select: { id: true },
      });

      await tx.wine.updateMany({
        data: {
          discountId: discount.id,
          discountPercent: percent,
        },
        where: { id: { in: wineIds } },
      });
    });
  } else if (intent === "clear-discount") {
    await prisma.wine.updateMany({
      data: {
        discountId: null,
        discountPercent: null,
      },
      where: { id: { in: wineIds } },
    });
  } else if (intent === "delete") {
    await prisma.wine.deleteMany({ where: { id: { in: wineIds } } });
  } else {
    throw new Error("Accion masiva invalida.");
  }

  revalidateWinePaths();
}

export async function createDiscountAction(formData: FormData) {
  const { name, percent } = discountPayload(formData);
  const wineIds = stringListValue(formData, "wine_ids");

  await requireUser();

  if (wineIds.length === 0) {
    throw new Error("Seleccioná al menos un vino para crear el descuento.");
  }

  await prisma.$transaction(async (tx) => {
    const discount = await tx.discount.create({
      data: { name, percent },
      select: { id: true },
    });

    await tx.wine.updateMany({
      data: {
        discountId: discount.id,
        discountPercent: percent,
      },
      where: { id: { in: wineIds } },
    });
  });

  revalidateWinePaths();
  redirect("/admin/descuentos?created=1");
}

export async function updateDiscountAction(formData: FormData) {
  const discountId = stringValue(formData, "discount_id");
  const { name, percent } = discountPayload(formData);
  const wineIds = stringListValue(formData, "wine_ids");

  await requireUser();

  if (!discountId) {
    throw new Error("Falta el descuento a actualizar.");
  }

  await prisma.$transaction(async (tx) => {
    const discount = await tx.discount.update({
      data: { name, percent },
      select: { active: true },
      where: { id: discountId },
    });

    await replaceDiscountWines(tx, discountId, percent, discount.active, wineIds);
  });

  revalidateWinePaths();
  redirect("/admin/descuentos?updated=1");
}

export async function toggleDiscountActiveAction(formData: FormData) {
  const discountId = stringValue(formData, "discount_id");

  await requireUser();

  if (!discountId) {
    throw new Error("Falta el descuento a pausar o reactivar.");
  }

  const result = await prisma.$queryRaw<Array<{ active: boolean }>>(Prisma.sql`
    WITH toggled AS (
      UPDATE "discounts"
      SET
        "active" = NOT "active",
        "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${discountId}::uuid
      RETURNING "active", "percent"
    ),
    updated_wines AS (
      UPDATE "wines" AS wine
      SET
        "discount_percent" = CASE
          WHEN toggled."active" THEN toggled."percent"
          ELSE NULL
        END,
        "updated_at" = CURRENT_TIMESTAMP
      FROM toggled
      WHERE wine."discount_id" = ${discountId}::uuid
      RETURNING wine."id"
    )
    SELECT "active"
    FROM toggled
  `);

  const active = result[0]?.active;

  if (active == null) {
    throw new Error("El descuento no existe.");
  }

  revalidateWinePaths();
  redirect(`/admin/descuentos?${active ? "reactivated" : "paused"}=1`);
}

export async function deleteDiscountAction(formData: FormData) {
  const discountId = stringValue(formData, "discount_id");

  await requireUser();

  if (!discountId) {
    throw new Error("Falta el descuento a eliminar.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.wine.updateMany({
      data: {
        discountId: null,
        discountPercent: null,
      },
      where: { discountId },
    });

    await tx.discount.delete({ where: { id: discountId } });
  });

  revalidateWinePaths();
  redirect("/admin/descuentos?deleted=1");
}

export async function deleteWineAction(formData: FormData) {
  const wineId = stringValue(formData, "id");

  await requireUser();
  await prisma.wine.delete({ where: { id: wineId } });

  revalidateWinePaths(wineId);
}
