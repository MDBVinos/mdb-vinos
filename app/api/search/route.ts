import { NextResponse } from "next/server";
import { searchWinesByName } from "@/lib/public/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const wines = await searchWinesByName(q);

  return NextResponse.json({ wines });
}
