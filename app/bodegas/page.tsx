import Link from "next/link";
import { SiteHeader } from "@/components/public/site-header";
import { WineCard } from "@/components/public/wine-card";
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
          <div className={styles.wineryList}>
            {wineries.map((winery) => (
              <section className={styles.winerySection} id={`winery-${winery.id}`} key={winery.id}>
                <div className={styles.wineryHeader}>
                  <h2>{winery.name}</h2>
                  <div className={styles.lineMenu}>
                    {winery.lines.map((line) => (
                      <Link href={`/lineas/${line.id}`} key={line.id}>
                        {line.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className={styles.lineList}>
                  {winery.lines.map((line) => (
                    <section className={styles.lineSection} id={`line-${line.id}`} key={line.id}>
                      <div className={styles.lineHeader}>
                        <h3>{line.name}</h3>
                      </div>
                      <div className={styles.grid}>
                        {line.wines.map((wine) => (
                          <WineCard key={wine.id} wine={wine} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            ))}
          </div>
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
