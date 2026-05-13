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
    <a className={styles.button} href={GENERAL_WHATSAPP_LINK} aria-label="WhatsApp">
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <path d="M32 7C18.7 7 8 17.4 8 30.2c0 4.4 1.3 8.5 3.6 12L8.7 56l14.2-3.3A25 25 0 0 0 32 54c13.3 0 24-10.4 24-23.2S45.3 7 32 7Z" />
        <path d="M23.2 20.2c.7-1.5 1.3-1.5 2.1-1.5h1.6c.5 0 1.2.2 1.8 1.3.7 1.5 2.2 5 2.4 5.4.2.4.3.8 0 1.3-.3.6-.5.8-.9 1.3-.4.5-.8.9-.3 1.7.5.8 2.1 3.4 4.5 5.5 3 2.6 5.6 3.4 6.4 3.8.8.4 1.3.3 1.8-.2.6-.7 2-2.3 2.5-3.1.5-.8 1.1-.7 1.8-.4.8.3 5 2.3 5.8 2.8.8.4 1.4.6 1.6 1 .2.4.2 2.3-.6 4.5-.8 2.2-4.4 4.2-6.2 4.3-1.7.1-3.9.2-10.5-2.4-8.8-3.5-14.5-12.2-14.9-12.8-.4-.5-3.6-4.7-3.6-9s2.2-6.4 2.9-7.3Z" />
      </svg>
    </a>
  );
}
