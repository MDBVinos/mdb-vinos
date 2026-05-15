import type { PublicWine } from "./types";

export const WHATSAPP_NUMBER = "5491159431923";
export const GENERAL_WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hola! Quiero consultar por vinos MDB.",
)}`;

export type WhatsAppItem = {
  wine: Pick<PublicWine, "name" | "price_unit" | "price_box" | "units_per_box">;
  quantity: number;
  format: "unit" | "box";
};

const priceFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatPrice(price: number | null | undefined) {
  return price == null ? "precio a confirmar" : priceFormatter.format(price);
}

export function buildWhatsAppMessage(items: WhatsAppItem[]) {
  const lines = items.map((item) => {
    const label = item.format === "box" ? "caja de" : "x";
    const price = item.format === "box" ? item.wine.price_box : item.wine.price_unit;
    const units = item.wine.units_per_box ? ` x ${item.wine.units_per_box} unidades` : "";

    if (item.format === "box") {
      return `* ${item.quantity} ${label} ${item.wine.name}${units} (${formatPrice(price)})`;
    }

    return `* ${item.quantity}${label} ${item.wine.name} (${formatPrice(price)})`;
  });

  return `Hola! Quiero pedir:\n\n${lines.join("\n")}`;
}

export function buildWhatsAppLink(items: WhatsAppItem[]) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(items))}`;
}
