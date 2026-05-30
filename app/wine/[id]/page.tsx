import Link from "next/link";
import { ProductBuyBox } from "@/components/public/product-buy-box";
import { SiteHeader } from "@/components/public/site-header";
import { getWineDetails } from "@/lib/public/queries";
import { discountedPrice } from "@/lib/wines/discount";
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
  searchParams: Promise<{
    from?: string;
  }>;
};

export default async function WinePage({ params, searchParams }: WinePageProps) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const wine = await getWineDetails(id);
  const returnToDiscover = from?.startsWith("/discover") ? from : null;
  const title = [wine.wine_line_name, wine.varietal_name ?? wine.name].filter(Boolean).join(" - ") || wine.name;
  const wineryName = wine.winery_name ?? wine.winery ?? "Bodega";
  const unitPrice = discountedPrice(wine.price_unit, wine.discount_percent);
  const boxPrice = discountedPrice(wine.price_box, wine.discount_percent);
  const filterTags = [
    ...wine.moments.map((moment) => `Momento: ${moment.name}`),
    wine.wineType ? `Tipo: ${wine.wineType.name}` : null,
    ...wine.intensities.map((intensity) => `Intensidad: ${intensity.name}`),
    unitPrice ? `Unidad: ${priceFormatter.format(unitPrice)}` : null,
    boxPrice
      ? `Caja${wine.units_per_box ? ` x ${wine.units_per_box} unidades` : ""}: ${priceFormatter.format(boxPrice)}`
      : null,
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

            <Link className="button secondary" href={returnToDiscover ?? "/wines"}>
              {returnToDiscover ? "Volver a búsqueda inteligente" : "Seguir viendo catálogo"}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
