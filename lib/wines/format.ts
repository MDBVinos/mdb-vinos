export type DecimalInput = number | string | { toNumber: () => number } | null | undefined;

export type PrismaWineView = {
  active: boolean;
  description: string | null;
  discountId?: string | null;
  discountPercent?: number | null;
  discount?: { id: string; name: string } | null;
  featured: boolean;
  id: string;
  imageUrl: string | null;
  name: string;
  priceBox: DecimalInput;
  priceUnit: DecimalInput;
  unitsPerBox: number | null;
  winery: string | null;
  wineryId?: string | null;
  wineLineId?: string | null;
  varietalId?: string | null;
  normalizedWinery?: { id: string; name: string } | null;
  wineLine?: { id: string; name: string } | null;
  varietal?: { id: string; name: string } | null;
};

export function priceToNumber(value: DecimalInput) {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return value.toNumber();
}

export function toWineView(wine: PrismaWineView) {
  return {
    active: wine.active,
    description: wine.description,
    discount_id: wine.discount?.id ?? wine.discountId ?? null,
    discount_name: wine.discount?.name ?? null,
    discount_percent: wine.discountPercent ?? null,
    featured: wine.featured,
    id: wine.id,
    image_url: wine.imageUrl,
    name: wine.name,
    price_box: priceToNumber(wine.priceBox),
    price_unit: priceToNumber(wine.priceUnit),
    units_per_box: wine.unitsPerBox,
    winery: wine.winery,
    winery_id: wine.normalizedWinery?.id ?? wine.wineryId ?? null,
    winery_name: wine.normalizedWinery?.name ?? wine.winery ?? null,
    wine_line_id: wine.wineLine?.id ?? wine.wineLineId ?? null,
    wine_line_name: wine.wineLine?.name ?? null,
    varietal_id: wine.varietal?.id ?? wine.varietalId ?? null,
    varietal_name: wine.varietal?.name ?? null,
  };
}

export function unique(values: string[]) {
  return [...new Set(values)];
}

export function intersectIds(groups: string[][]) {
  if (groups.length === 0 || groups.some((group) => group.length === 0)) {
    return [];
  }

  return groups.reduce((acc, group) => acc.filter((id) => group.includes(id)));
}
