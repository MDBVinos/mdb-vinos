import Link from "next/link";
import { ProductBuyBox } from "@/components/public/product-buy-box";
import { SiteHeader } from "@/components/public/site-header";
import { getWineDetails } from "@/lib/public/queries";
import styles from "../../public.module.css";

export const dynamic = "force-dynamic";

const priceFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

type WinePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WinePage({ params }: WinePageProps) {
  const { id } = await params;
  const wine = await getWineDetails(id);
  const title = [wine.wine_line_name, wine.varietal_name ?? wine.name].filter(Boolean).join(" - ") || wine.name;
  const wineryName = wine.winery_name ?? wine.winery ?? "Bodega";
  const filterTags = [
    ...wine.moments.map((moment) => `Momento: ${moment.name}`),
    wine.wineType ? `Tipo: ${wine.wineType.name}` : null,
    ...wine.intensities.map((intensity) => `Intensidad: ${intensity.name}`),
    wine.price_unit ? `Unidad: ${priceFormatter.format(wine.price_unit)}` : null,
    wine.price_box ? `Caja: ${priceFormatter.format(wine.price_box)}` : null,
  ].filter((tag): tag is string => Boolean(tag));

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.product}>
          <div className={styles.productImage}>
            {wine.image_url ? (
              <img src={wine.image_url} alt={wine.name} />
            ) : (
              <div className={styles.productPlaceholder}>MDB</div>
            )}
          </div>

          <div className={styles.productInfo}>
            <h1>{title}</h1>
            <p className={styles.productWinery}>
              <span>Bodega</span>
              {wineryName}
            </p>
            <div className={styles.productTags} aria-label="Etiquetas de busqueda inteligente">
              {filterTags.length > 0 ? filterTags.map((tag) => <span key={tag}>{tag}</span>) : <span>Etiqueta</span>}
            </div>
            <p>{wine.description ?? "Descripcion completa"}</p>

            <ProductBuyBox wine={wine} />

            <Link className="button secondary" href="/wines">
              Seguir viendo catálogo
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
