import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const icon = await readFile(join(process.cwd(), "app", "icon.png"));

  return new NextResponse(icon, {
    headers: {
      "Content-Type": "image/png",
    },
  });
}
