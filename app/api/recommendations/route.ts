import { NextResponse } from "next/server";
import { getRecommendedWines } from "@/lib/public/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const moment = searchParams.get("moment") ?? "";
  const budget = Number(searchParams.get("budget") ?? 0);
  const typeId = searchParams.get("typeId") ?? "";
  const intensityId = searchParams.get("intensityId") ?? "";
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  if (!moment) {
    return NextResponse.json({ wines: [] });
  }

  const wines = await getRecommendedWines({
    momentName: moment,
    budget: budget > 0 ? budget : undefined,
    typeId: typeId || undefined,
    intensityId: intensityId || undefined,
    order,
  });

  return NextResponse.json({ wines });
}
