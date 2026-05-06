import Link from "next/link";
import { buildAdvisorWhatsAppLink } from "@/lib/public/whatsapp";
import { WhatsAppButton } from "./whatsapp-button";
import styles from "./site-header.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link aria-label="MDB Wines" className={styles.logo} href="/">
        <span>MDB</span>
        <i aria-hidden="true" className={styles.dot}>{"\u00B7"}</i>
        <span>WINES</span>
      </Link>
      <div className={styles.right}>
        <nav aria-label="Principal" className={styles.nav}>
          <Link href="/wines">Vinos</Link>
          <Link href="/discover">Eleg&iacute; tu vino</Link>
        </nav>
        <WhatsAppButton
          className={`button wa ${styles.pill}`}
          href={buildAdvisorWhatsAppLink("Hola! Quiero asesoramiento para elegir un vino.")}
          items={[]}
          label="Asesorame"
          variant="wa"
        />
      </div>
    </header>
  );
}
