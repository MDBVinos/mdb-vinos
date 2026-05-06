import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { toWineView } from "@/lib/wines/format";
import type { Wine, WineFormInitialData, WineFormOptions } from "./types";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function getAdminWines(): Promise<Wine[]> {
  await requireUser();

  const wines = await prisma.wine.findMany({
    orderBy: { name: "asc" },
  });

  return wines.map(toWineView);
}

export async function getWineFormOptions(): Promise<WineFormOptions> {
  await requireUser();

  const [moments, wineTypes, intensities] = await Promise.all([
    prisma.moment.findMany({ orderBy: { name: "asc" } }),
    prisma.wineType.findMany({ orderBy: { name: "asc" } }),
    prisma.intensity.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    moments,
    wineTypes,
    intensities,
  };
}

export async function getWineForEdit(id: string): Promise<WineFormInitialData> {
  await requireUser();

  const wine = await prisma.wine.findUnique({
    include: {
      wineIntensities: {
        select: { intensityId: true },
      },
      wineMoments: {
        select: { momentId: true },
      },
      wineTypes: {
        select: { typeId: true },
        take: 1,
      },
    },
    where: { id },
  });

  if (!wine) {
    notFound();
  }

  return {
    ...toWineView(wine),
    intensityIds: wine.wineIntensities.map((row) => row.intensityId),
    momentIds: wine.wineMoments.map((row) => row.momentId),
    wineTypeId: wine.wineTypes[0]?.typeId ?? "",
  };
}

export async function getWineImageOptions() {
  await requireUser();

  return prisma.wine.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      imageUrl: true,
      name: true,
    },
  });
}
