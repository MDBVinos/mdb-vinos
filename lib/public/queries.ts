import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { intersectIds, priceToNumber, toWineView, unique } from "@/lib/wines/format";
import type {
  CatalogFilters,
  PublicIntensity,
  PublicMoment,
  PublicWine,
  PublicWineType,
  HeaderWinery,
  RecommendationFilters,
  WineDetails,
  WineryCatalog,
  WineLineDetails,
} from "./types";

const wineCatalogInclude = {
  normalizedWinery: true,
  varietal: true,
  wineLine: true,
};

type LineWithPrices = {
  name: string;
  wines: Array<{ priceUnit: Parameters<typeof priceToNumber>[0] }>;
};

function compareNameWithOthersLast(first: { name: string }, second: { name: string }) {
  const firstIsOther = first.name.trim().toLowerCase() === "otros";
  const secondIsOther = second.name.trim().toLowerCase() === "otros";

  if (firstIsOther && !secondIsOther) {
    return 1;
  }

  if (!firstIsOther && secondIsOther) {
    return -1;
  }

  return first.name.localeCompare(second.name, "es");
}

function maxLineUnitPrice(line: LineWithPrices) {
  const prices = line.wines
    .map((wine) => priceToNumber(wine.priceUnit))
    .filter((price): price is number => price != null);

  return prices.length === 0 ? null : Math.max(...prices);
}

function compareLinesByPremiumPrice(first: LineWithPrices, second: LineWithPrices) {
  const firstPrice = maxLineUnitPrice(first);
  const secondPrice = maxLineUnitPrice(second);

  if (firstPrice == null && secondPrice == null) {
    return first.name.localeCompare(second.name, "es");
  }

  if (firstPrice == null) {
    return 1;
  }

  if (secondPrice == null) {
    return -1;
  }

  if (firstPrice !== secondPrice) {
    return secondPrice - firstPrice;
  }

  return first.name.localeCompare(second.name, "es");
}

export async function getActiveWines(limit = 6): Promise<PublicWine[]> {
  const wines = await prisma.wine.findMany({
    include: wineCatalogInclude,
    orderBy: { name: "asc" },
    take: limit,
    where: { active: true },
  });

  return wines.map(toWineView);
}

export async function getFeaturedWines(limit = 6): Promise<PublicWine[]> {
  const featured = await prisma.wine.findMany({
    include: wineCatalogInclude,
    orderBy: { name: "asc" },
    take: limit,
    where: {
      active: true,
      featured: true,
    },
  });

  if (featured.length >= limit) {
    return featured.map(toWineView);
  }

  const fallback = await prisma.wine.findMany({
    include: wineCatalogInclude,
    orderBy: { name: "asc" },
    take: limit - featured.length,
    where: {
      active: true,
      id: { notIn: featured.map((wine) => wine.id) },
    },
  });

  return [...featured, ...fallback].map(toWineView);
}

export async function getPublicOptions() {
  const [moments, wineTypes, intensities, wineries, wineLines, varietals] = await Promise.all([
    prisma.moment.findMany({ orderBy: { name: "asc" } }),
    prisma.wineType.findMany({ orderBy: { name: "asc" } }),
    prisma.intensity.findMany({ orderBy: { name: "asc" } }),
    prisma.winery.findMany({ orderBy: { name: "asc" } }),
    prisma.wineLine.findMany({ orderBy: { name: "asc" } }),
    prisma.varietal.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    moments,
    varietals,
    wineTypes,
    wineLines,
    wineries,
    intensities,
  };
}

export async function getHeaderWineries(): Promise<HeaderWinery[]> {
  const wineries = await prisma.winery.findMany({
    include: {
      wineLines: {
        include: {
          wines: {
            select: { priceUnit: true },
            where: { active: true },
          },
        },
        orderBy: { name: "asc" },
        where: {
          wines: {
            some: {
              active: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
    where: {
      wineLines: {
        some: {
          wines: {
            some: {
              active: true,
            },
          },
        },
      },
    },
  });

  return wineries
    .sort(compareNameWithOthersLast)
    .map((winery) => ({
      id: winery.id,
      name: winery.name,
      lines: [...winery.wineLines].sort(compareLinesByPremiumPrice).map((line) => ({
        id: line.id,
        name: line.name,
        wineryId: line.wineryId,
      })),
    }));
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
    include: wineCatalogInclude,
    orderBy: { name: "asc" },
    where: {
      active: true,
      id: matchingIds ? { in: matchingIds } : undefined,
      priceUnit: filters.maxPrice ? { lte: filters.maxPrice } : undefined,
    },
  });

  return wines.map(toWineView);
}

export async function searchWines(search: string): Promise<PublicWine[]> {
  if (search.trim().length < 2) {
    return [];
  }

  const query = search.trim();
  const wines = await prisma.wine.findMany({
    include: wineCatalogInclude,
    orderBy: { name: "asc" },
    take: 8,
    where: {
      active: true,
      OR: [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          winery: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          normalizedWinery: {
            is: {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
        },
        {
          wineLine: {
            is: {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
        },
        {
          varietal: {
            is: {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
        },
      ],
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
    include: wineCatalogInclude,
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
      ...wineCatalogInclude,
      wineIntensities: {
        include: { intensity: true },
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
    intensities: wine.wineIntensities.map((row) => row.intensity),
    moments: wine.wineMoments.map((row) => row.moment),
    wineType: wine.wineTypes[0]?.wineType ?? null,
  };
}

export async function getWineryCatalog(): Promise<WineryCatalog[]> {
  const wineries = await prisma.winery.findMany({
    include: {
      wineLines: {
        include: {
          wines: {
            include: wineCatalogInclude,
            orderBy: [{ varietal: { name: "asc" } }, { name: "asc" }],
            where: { active: true },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return wineries
    .sort(compareNameWithOthersLast)
    .map((winery) => ({
      id: winery.id,
      name: winery.name,
      lines: winery.wineLines
        .sort(compareLinesByPremiumPrice)
        .map((line) => ({
          id: line.id,
          name: line.name,
          wineryId: line.wineryId,
          wines: line.wines.map(toWineView),
        }))
        .filter((line) => line.wines.length > 0),
    }))
    .filter((winery) => winery.lines.length > 0);
}

export async function getWineLineDetails(id: string): Promise<WineLineDetails> {
  const line = await prisma.wineLine.findFirst({
    include: {
      winery: true,
      wines: {
        include: wineCatalogInclude,
        orderBy: [{ varietal: { name: "asc" } }, { name: "asc" }],
        where: { active: true },
      },
    },
    where: { id },
  });

  if (!line || line.wines.length === 0) {
    notFound();
  }

  return {
    id: line.id,
    name: line.name,
    wineryId: line.wineryId,
    winery: line.winery ? { id: line.winery.id, name: line.winery.name } : null,
    wines: line.wines.map(toWineView),
  };
}
