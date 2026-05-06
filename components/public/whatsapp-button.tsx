import { buildWhatsAppLink, type WhatsAppItem } from "@/lib/public/whatsapp";

type WhatsAppButtonProps = {
  items: WhatsAppItem[];
  label: string;
  className?: string;
  variant?: "default" | "wa";
  href?: string;
};

function WhatsAppGlyph() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.05 4.91A10.05 10.05 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.45 1.34 4.96L2 22l5.18-1.36A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.67-1.04-5.18-2.95-7.09ZM12 20.07c-1.61 0-3.18-.43-4.55-1.24l-.33-.2-3.07.81.82-3-.21-.34A8.07 8.07 0 1 1 20.07 12c0 4.45-3.62 8.07-8.07 8.07Zm4.4-6.05c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12s-.62.78-.76.94-.28.18-.52.06a6.6 6.6 0 0 1-1.94-1.2 7.32 7.32 0 0 1-1.34-1.66c-.14-.24 0-.36.1-.48.1-.12.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.4-.54-.4h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64a13.4 13.4 0 0 0 1.36.5c.58.18 1.1.16 1.52.1.46-.06 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

export function WhatsAppButton({
  items,
  label,
  className,
  variant = "default",
  href,
}: WhatsAppButtonProps) {
  const finalClassName =
    className ?? (variant === "wa" ? "button wa" : "button");
  const link = href ?? buildWhatsAppLink(items);

  return (
    <a className={finalClassName} href={link} rel="noreferrer" target="_blank">
      {variant === "wa" ? <WhatsAppGlyph /> : null}
      {label}
    </a>
  );
}
