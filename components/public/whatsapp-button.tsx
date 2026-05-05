import { buildWhatsAppLink, type WhatsAppItem } from "@/lib/public/whatsapp";

type WhatsAppButtonProps = {
  items: WhatsAppItem[];
  label: string;
  className?: string;
};

export function WhatsAppButton({ items, label, className }: WhatsAppButtonProps) {
  return (
    <a className={className ?? "button"} href={buildWhatsAppLink(items)} rel="noreferrer" target="_blank">
      {label}
    </a>
  );
}
