import { SiteHeader } from "@/components/public/site-header";
import { WineCard } from "@/components/public/wine-card";
import { getWineLineDetails } from "@/lib/public/queries";
import styles from "../../public.module.css";

export const dynamic = "force-dynamic";

type LinePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LinePage({ params }: LinePageProps) {
  const { id } = await params;
  const line = await getWineLineDetails(id);

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.section}>
          <div className={styles.lineLanding}>
            <h1>{line.name}</h1>
            <p>{line.winery?.name ?? "Bodega"}</p>
            <div className={styles.grid}>
              {line.wines.map((wine) => (
                <WineCard key={wine.id} wine={wine} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
