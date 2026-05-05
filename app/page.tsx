import Link from "next/link";
import { MomentCard } from "@/components/public/moment-card";
import { SearchBar } from "@/components/public/search-bar";
import { SiteHeader } from "@/components/public/site-header";
import { WineCard } from "@/components/public/wine-card";
import { getActiveWines } from "@/lib/public/queries";
import styles from "./public.module.css";

export const dynamic = "force-dynamic";

const moments = [
  { name: "Asado", copy: "Tintos con presencia para compartir sin vueltas." },
  { name: "Cita", copy: "Algo especial, suave y con buena primera impresion." },
  { name: "Regalo", copy: "Opciones que se sienten pensadas, no improvisadas." },
  { name: "Comida", copy: "Botellas faciles de maridar y disfrutar." },
];

export default async function HomePage() {
  const wines = await getActiveWines(6);

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Cada momento marida con un vino</p>
            <h1>Encontrá el vino perfecto para cada momento</h1>
            <p>
              MDB te ayuda a elegir sin complicarte. Decinos el plan, el presupuesto y te acercamos
              opciones listas para pedir por WhatsApp.
            </p>
            <div className={styles.actions}>
              <Link className="button" href="/discover">
                Elegí tu vino
              </Link>
              <Link className="button secondary" href="/wines">
                Ver catálogo
              </Link>
            </div>
          </div>
          <div className={styles.heroPanel}>
            <SearchBar />
            <p>Si ya sabés qué querés, buscalo por nombre.</p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.kicker}>Recomendador</p>
            <h2>Elegí por momento</h2>
          </div>
          <div className={styles.momentGrid}>
            {moments.map((moment) => (
              <MomentCard copy={moment.copy} key={moment.name} name={moment.name} />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.kicker}>Destacados</p>
            <h2>Vinos para resolver bien</h2>
          </div>
          <div className={styles.grid}>
            {wines.map((wine) => (
              <WineCard key={wine.id} note="Perfecto para sorprender" wine={wine} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
