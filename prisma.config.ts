import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

loadEnvConfig(process.cwd());

const isGenerateCommand = process.argv.includes("generate");
const prismaCliUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!prismaCliUrl && !isGenerateCommand) {
  throw new Error("Set DIRECT_URL or DATABASE_URL before running Prisma database commands.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: prismaCliUrl ?? "postgresql://postgres:postgres@localhost:5432/postgres",
  },
});
