export type DecimalInput = number | string | { toNumber: () => number } | null | undefined;

export type PrismaWineView = {
  active: boolean;
  description: string | null;
  featured: boolean;
  id: string;
  imageUrl: string | null;
  name: string;
  priceBox: DecimalInput;
  priceUnit: DecimalInput;
  unitsPerBox: number | null;
  winery: string | null;
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
    featured: wine.featured,
    id: wine.id,
    image_url: wine.imageUrl,
    name: wine.name,
    price_box: priceToNumber(wine.priceBox),
    price_unit: priceToNumber(wine.priceUnit),
    units_per_box: wine.unitsPerBox,
    winery: wine.winery,
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
