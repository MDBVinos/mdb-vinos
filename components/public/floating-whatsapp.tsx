"use client";

import { usePathname } from "next/navigation";
import { GENERAL_WHATSAPP_LINK } from "@/lib/public/whatsapp";
import styles from "./floating-whatsapp.module.css";

export function FloatingWhatsApp() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin") || pathname === "/login" || pathname === "/thanks") {
    return null;
  }

  return (
    <a
      aria-label="WhatsApp"
      className={styles.button}
      href={GENERAL_WHATSAPP_LINK}
      rel="noopener noreferrer"
      target="_blank"
    >
      <img alt="" src="/brand/whatsapp-floating.png" />
    </a>
  );
}
