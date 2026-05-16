import Link from "next/link";
import { SiteHeader } from "@/components/public/site-header";
import { WineryAccordion } from "@/components/public/winery-accordion";
import { getWineryCatalog } from "@/lib/public/queries";
import styles from "../public.module.css";

export const dynamic = "force-dynamic";

export default async function WineriesPage() {
  const wineries = await getWineryCatalog();

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        {wineries.length > 0 ? (
          <section className={styles.section}>
            <WineryAccordion wineries={wineries} />
          </section>
        ) : (
          <section className={styles.section}>
            <p>Todavía no hay bodegas normalizadas. Importá la base Excel para ver esta vista.</p>
            <Link className="button secondary" href="/wines">
              Ver vinos
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
