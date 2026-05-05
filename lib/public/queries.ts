import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { intersectIds, toWineView, unique } from "@/lib/wines/format";
import type {
  CatalogFilters,
  PublicIntensity,
  PublicMoment,
  PublicWine,
  PublicWineType,
  RecommendationFilters,
  WineDetails,
} from "./types";

export async function getActiveWines(limit = 6): Promise<PublicWine[]> {
  const wines = await prisma.wine.findMany({
    orderBy: { name: "asc" },
    take: limit,
    where: { active: true },
  });

  return wines.map(toWineView);
}

export async function getPublicOptions() {
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

async function wineIdsForType(typeId: string) {
  const rows = await prisma.wineTypeRelation.findMany({
    select: { wineId: true },
    where: { typeId },
  });

  return unique(rows.map((row) => row.wineId));
}

async function wineIdsForIntensity(intensityId: string) {
  const rows = await prisma.wineIntensity.findMany({
    select: { wineId: true },
    where: { intensityId },
  });

  return unique(rows.map((row) => row.wineId));
}

async function wineIdsForMomentName(momentName: string) {
  const moments = await prisma.moment.findMany({
    select: { id: true },
    where: {
      name: {
        contains: momentName,
        mode: "insensitive",
      },
    },
  });

  const momentIds = moments.map((moment) => moment.id);
  if (momentIds.length === 0) {
    return [];
  }

  const rows = await prisma.wineMoment.findMany({
    select: { wineId: true },
    where: {
      momentId: { in: momentIds },
    },
  });

  return unique(rows.map((row) => row.wineId));
}

export async function getCatalogWines(filters: CatalogFilters = {}): Promise<PublicWine[]> {
  const idGroups: string[][] = [];

  if (filters.momentName) {
    idGroups.push(await wineIdsForMomentName(filters.momentName));
  }

  if (filters.typeId) {
    idGroups.push(await wineIdsForType(filters.typeId));
  }

  const matchingIds = idGroups.length > 0 ? intersectIds(idGroups) : null;
  if (matchingIds && matchingIds.length === 0) {
    return [];
  }

  const wines = await prisma.wine.findMany({
    orderBy: { name: "asc" },
    where: {
      active: true,
      id: matchingIds ? { in: matchingIds } : undefined,
      priceUnit: filters.maxPrice ? { lte: filters.maxPrice } : undefined,
    },
  });

  return wines.map(toWineView);
}

export async function searchWinesByName(search: string): Promise<PublicWine[]> {
  if (search.trim().length < 2) {
    return [];
  }

  const wines = await prisma.wine.findMany({
    orderBy: { name: "asc" },
    take: 8,
    where: {
      active: true,
      name: {
        contains: search.trim(),
        mode: "insensitive",
      },
    },
  });

  return wines.map(toWineView);
}

export async function getRecommendedWines(filters: RecommendationFilters): Promise<PublicWine[]> {
  const idGroups: string[][] = [];

  idGroups.push(await wineIdsForMomentName(filters.momentName));

  if (filters.typeId) {
    idGroups.push(await wineIdsForType(filters.typeId));
  }

  if (filters.intensityId) {
    idGroups.push(await wineIdsForIntensity(filters.intensityId));
  }

  const matchingIds = intersectIds(idGroups);
  if (matchingIds.length === 0) {
    return [];
  }

  const wines = await prisma.wine.findMany({
    orderBy: { priceUnit: "asc" },
    take: 4,
    where: {
      active: true,
      id: { in: matchingIds },
      priceUnit: filters.budget ? { lte: filters.budget } : undefined,
    },
  });

  return wines.map(toWineView);
}

export async function getWineDetails(id: string): Promise<WineDetails> {
  const wine = await prisma.wine.findFirst({
    include: {
      wineIntensities: {
        include: { intensity: true },
        take: 1,
      },
      wineMoments: {
        include: { moment: true },
      },
      wineTypes: {
        include: { wineType: true },
        take: 1,
      },
    },
    where: {
      active: true,
      id,
    },
  });

  if (!wine) {
    notFound();
  }

  return {
    ...toWineView(wine),
    intensity: wine.wineIntensities[0]?.intensity ?? null,
    moments: wine.wineMoments.map((row) => row.moment),
    wineType: wine.wineTypes[0]?.wineType ?? null,
  };
}
