import Link from "next/link";
import { MomentCard } from "@/components/public/moment-card";
import { SearchBar } from "@/components/public/search-bar";
import { SiteHeader } from "@/components/public/site-header";
import { WineCard } from "@/components/public/wine-card";
import { getActiveWines, getFeaturedWines } from "@/lib/public/queries";
import styles from "./public.module.css";

export const dynamic = "force-dynamic";

const moments = [
  { name: "Asado", copy: "Tintos con presencia para compartir sin vueltas." },
  { name: "Cita", copy: "Algo especial, suave y con buena primera impresion." },
  { name: "Regalo", copy: "Opciones que se sienten pensadas, no improvisadas." },
  { name: "Comida", copy: "Botellas faciles de maridar y disfrutar." },
];

export default async function HomePage() {
  const [recommendedWines, catalogWines] = await Promise.all([getFeaturedWines(4), getActiveWines(12)]);

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1>Descubrí el vino perfecto,</h1>
            <p className={styles.heroSubhead}>Para el momento perfecto.</p>
            <p className={styles.heroText}>
              Asesorate con nuestra busqueda inteligente y encontrá el vino que estas buscando.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.smartButton} href="/discover">
                Busqueda Inteligente
              </Link>
              <Link href="/wines">Ver catálogo</Link>
            </div>
          </div>
          <div className={styles.heroSearch}>
            <SearchBar />
          </div>
        </section>

        <section className={styles.section} id="recomendaciones">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2>Destacados</h2>
            </div>
          </div>
          <div className={styles.recommendationRail}>
            {recommendedWines.map((wine) => (
              <WineCard key={wine.id} wine={wine} />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2>Catálogo</h2>
            </div>
          </div>
          <div className={styles.grid}>
            {catalogWines.map((wine) => (
              <WineCard key={wine.id} wine={wine} />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2>Momentos</h2>
            </div>
          </div>
          <div className={styles.momentGrid}>
            {moments.map((moment) => (
              <MomentCard copy={moment.copy} key={moment.name} name={moment.name} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
