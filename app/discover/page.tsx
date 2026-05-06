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
          <div className={styles.sectionHeader}>
            <p className={styles.kicker}>Elegí sin complicarte</p>
            <h1>Encontramos el vino para tu plan</h1>
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
