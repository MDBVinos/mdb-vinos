"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
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
    imageUrl,
    name,
    priceBox: numberValue(formData, "price_box"),
    priceUnit: numberValue(formData, "price_unit"),
  };
}

async function replaceWineRelations(
  tx: Prisma.TransactionClient,
  wineId: string,
  momentIds: string[],
  wineTypeId: string,
  intensityId: string,
) {
  await Promise.all([
    tx.wineMoment.deleteMany({ where: { wineId } }),
    tx.wineTypeRelation.deleteMany({ where: { wineId } }),
    tx.wineIntensity.deleteMany({ where: { wineId } }),
  ]);

  if (momentIds.length > 0) {
    await tx.wineMoment.createMany({
      data: momentIds.map((momentId) => ({
        momentId,
        wineId,
      })),
      skipDuplicates: true,
    });
  }

  if (wineTypeId) {
    await tx.wineTypeRelation.create({
      data: {
        typeId: wineTypeId,
        wineId,
      },
    });
  }

  if (intensityId) {
    await tx.wineIntensity.create({
      data: {
        intensityId,
        wineId,
      },
    });
  }
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
