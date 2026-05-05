import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

loadEnvConfig(process.cwd());

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Set DIRECT_URL or DATABASE_URL before running prisma db seed.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const moments = ["Asado", "Cita", "Regalo", "Juntada", "Comida"];
const wineTypes = ["Tinto", "Blanco", "Rosado", "Espumante"];
const intensities = ["Suave", "Medio", "Intenso"];

async function main() {
  for (const name of moments) {
    await prisma.moment.upsert({
      create: { name },
      update: {},
      where: { name },
    });
  }

  for (const name of wineTypes) {
    await prisma.wineType.upsert({
      create: { name },
      update: {},
      where: { name },
    });
  }

  for (const name of intensities) {
    await prisma.intensity.upsert({
      create: { name },
      update: {},
      where: { name },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
