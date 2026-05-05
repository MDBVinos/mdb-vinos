export type DecimalInput = number | string | { toNumber: () => number } | null | undefined;

export type PrismaWineView = {
  active: boolean;
  description: string | null;
  id: string;
  imageUrl: string | null;
  name: string;
  priceBox: DecimalInput;
  priceUnit: DecimalInput;
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
    id: wine.id,
    image_url: wine.imageUrl,
    name: wine.name,
    price_box: priceToNumber(wine.priceBox),
    price_unit: priceToNumber(wine.priceUnit),
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
