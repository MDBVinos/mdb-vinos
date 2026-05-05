import Link from "next/link";
import { SiteHeader } from "@/components/public/site-header";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { getWineDetails } from "@/lib/public/queries";
import styles from "../../public.module.css";

export const dynamic = "force-dynamic";

type WinePageProps = {
  params: Promise<{
    id: string;
  }>;
};

const priceFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatPrice(price: number | null) {
  return price == null ? "Consultar precio" : priceFormatter.format(price);
}

export default async function WinePage({ params }: WinePageProps) {
  const { id } = await params;
  const wine = await getWineDetails(id);

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <Link className="button secondary" href="/wines">
          Volver al catálogo
        </Link>
        <section className={styles.product}>
          <div className={styles.productImage}>
            {wine.image_url ? (
              <img src={wine.image_url} alt={wine.name} />
            ) : (
              <div className={styles.productPlaceholder}>MDB</div>
            )}
          </div>

          <div className={styles.productInfo}>
            <p className={styles.kicker}>MDB Wines</p>
            <h1>{wine.name}</h1>
            <p>{wine.description ?? "Un vino pensado para disfrutar sin complicarte."}</p>

            <div className={styles.priceList}>
              <strong>Unidad: {formatPrice(wine.price_unit)}</strong>
              <strong>Caja: {formatPrice(wine.price_box)}</strong>
            </div>

            <div className={styles.chips}>
              {wine.moments.map((moment) => (
                <span key={moment.id}>{moment.name}</span>
              ))}
              {wine.wineType ? <span>{wine.wineType.name}</span> : null}
              {wine.intensity ? <span>{wine.intensity.name}</span> : null}
            </div>

            <div className={styles.actions}>
              <WhatsAppButton
                items={[{ wine, quantity: 1, format: "unit" }]}
                label="Comprar unidad"
              />
              <WhatsAppButton
                className="button secondary"
                items={[{ wine, quantity: 1, format: "box" }]}
                label="Comprar caja"
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
