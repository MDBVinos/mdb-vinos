import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const baseUrl = "https://mdbwines.com";

function absoluteUrl(path: string) {
  return `${baseUrl}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [wines, wineLines] = await Promise.all([
    prisma.wine.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        updatedAt: true,
      },
      where: { active: true },
    }),
    prisma.wineLine.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        updatedAt: true,
      },
      where: {
        wines: {
          some: {
            active: true,
          },
        },
      },
    }),
  ]);

  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/catalogo"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/wines"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/bodegas"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/discover"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  return [
    ...staticRoutes,
    ...wineLines.map((line) => ({
      url: absoluteUrl(`/lineas/${line.id}`),
      lastModified: line.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...wines.map((wine) => ({
      url: absoluteUrl(`/wine/${wine.id}`),
      lastModified: wine.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
