import { RecommendationStepper } from "@/components/public/recommendation-stepper";
import { SiteHeader } from "@/components/public/site-header";
import { getPublicOptions } from "@/lib/public/queries";
import styles from "../public.module.css";

export const dynamic = "force-dynamic";

type DiscoverPageProps = {
  searchParams: Promise<{
    moment?: string;
  }>;
};

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const [{ moment }, options] = await Promise.all([searchParams, getPublicOptions()]);

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.section}>
          <div className={styles.introPanel}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <p className={styles.kicker}>Recomendaciones</p>
                <h1>Encontramos el vino para tu plan</h1>
              </div>
            </div>
            <p className={styles.searchHint}>
              Contanos el momento y te acercamos opciones comprables en tarjetas.
            </p>
          </div>
          <RecommendationStepper
            initialMoment={moment}
            intensities={options.intensities}
            moments={options.moments}
            wineTypes={options.wineTypes}
          />
        </section>
      </main>
    </>
  );
}
