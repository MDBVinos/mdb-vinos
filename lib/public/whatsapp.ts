import type { PublicWine } from "./types";

export const WHATSAPP_NUMBER = "5491159431923";

export type WhatsAppItem = {
  wine: Pick<PublicWine, "name" | "price_unit" | "price_box">;
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

function buildItemLines(items: WhatsAppItem[]) {
  return items.map((item) => {
    const label = item.format === "box" ? "caja de" : "x";
    const price = item.format === "box" ? item.wine.price_box : item.wine.price_unit;

    if (item.format === "box") {
      return `* ${item.quantity} ${label} ${item.wine.name} (${formatPrice(price)})`;
    }

    return `* ${item.quantity}${label} ${item.wine.name} (${formatPrice(price)})`;
  });
}

export function buildWhatsAppMessage(items: WhatsAppItem[]) {
  const lines = buildItemLines(items);
  return `Hola! Quiero pedir:\n\n${lines.join("\n")}`;
}

export function buildWhatsAppLink(items: WhatsAppItem[]) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(items))}`;
}

export function buildKitWhatsAppMessage(kitTitle: string, items: WhatsAppItem[]) {
  const lines = buildItemLines(items);
  return `Hola! Quiero el ${kitTitle}:\n\n${lines.join("\n")}`;
}

export function buildKitWhatsAppLink(kitTitle: string, items: WhatsAppItem[]) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildKitWhatsAppMessage(kitTitle, items))}`;
}

export function buildAdvisorWhatsAppLink(message = "Hola! Necesito ayuda para elegir un vino.") {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
