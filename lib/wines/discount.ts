export function normalizeDiscountPercent(discountPercent: number | null | undefined) {
  if (discountPercent == null || !Number.isFinite(discountPercent)) {
    return null;
  }

  const normalized = Math.trunc(discountPercent);
  return normalized >= 1 && normalized <= 99 ? normalized : null;
}

export function hasDiscount(discountPercent: number | null | undefined) {
  return normalizeDiscountPercent(discountPercent) != null;
}

export function discountedPrice(price: number | null, discountPercent: number | null | undefined) {
  const discount = normalizeDiscountPercent(discountPercent);
  if (price == null || discount == null) {
    return price;
  }

  return Math.round(price * ((100 - discount) / 100));
}
