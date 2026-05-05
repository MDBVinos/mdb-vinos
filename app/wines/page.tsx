import Link from "next/link";
import { SearchBar } from "@/components/public/search-bar";
import { SiteHeader } from "@/components/public/site-header";
import { WineCard } from "@/components/public/wine-card";
import { getCatalogWines, getPublicOptions } from "@/lib/public/queries";
import styles from "../public.module.css";

export const dynamic = "force-dynamic";

type WinesPageProps = {
  searchParams: Promise<{
    moment?: string;
    type?: string;
    maxPrice?: string;
  }>;
};

export default async function WinesPage({ searchParams }: WinesPageProps) {
  const params = await searchParams;
  const [options, wines] = await Promise.all([
    getPublicOptions(),
    getCatalogWines({
      momentName: params.moment,
      typeId: params.type,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    }),
  ]);

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.kicker}>Catálogo</p>
            <h1>{params.moment ? `Vinos para ${params.moment}` : "Todos los vinos MDB"}</h1>
          </div>
          <SearchBar />
        </section>

        <form className={styles.filters}>
          {params.moment ? <input name="moment" type="hidden" value={params.moment} /> : null}
          <div className="field">
            <label htmlFor="type">Tipo</label>
            <select defaultValue={params.type ?? ""} id="type" name="type">
              <option value="">Todos</option>
              {options.wineTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="maxPrice">Precio máximo</label>
            <input
              defaultValue={params.maxPrice ?? ""}
              id="maxPrice"
              min="0"
              name="maxPrice"
              placeholder="Ej: 20000"
              type="number"
            />
          </div>
          <button type="submit">Filtrar</button>
        </form>

        {wines.length > 0 ? (
          <section className={styles.grid}>
            {wines.map((wine) => (
              <WineCard key={wine.id} wine={wine} />
            ))}
          </section>
        ) : (
          <section className={styles.section}>
            <p>No encontramos vinos con esos filtros.</p>
            <Link className="button secondary" href="/wines">
              Ver todos
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
