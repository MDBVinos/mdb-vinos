import Link from "next/link";
import { KitCard } from "@/components/public/kit-card";
import { MomentCard } from "@/components/public/moment-card";
import { SearchBar } from "@/components/public/search-bar";
import { SiteHeader } from "@/components/public/site-header";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { WineCard } from "@/components/public/wine-card";
import { KITS } from "@/lib/public/kits";
import { getActiveWines, getCatalogWines } from "@/lib/public/queries";
import { buildAdvisorWhatsAppLink } from "@/lib/public/whatsapp";
import styles from "./public.module.css";

export const dynamic = "force-dynamic";

const moments = [
  {
    name: "Asado",
    copy: "Un vino que nunca falla en un asado.",
    size: "lg" as const,
  },
  {
    name: "Cita",
    copy: "Perfecto para una primera cita.",
    size: "lg" as const,
  },
  {
    name: "Regalo",
    copy: "Quedas bien seguro si lo llevas de regalo.",
    size: "sm" as const,
  },
  {
    name: "Comida",
    copy: "Para acompanar lo que estes cocinando hoy.",
    size: "sm" as const,
  },
  {
    name: "Juntada",
    copy: "Para una mesa larga, charla y nada mas.",
    size: "sm" as const,
  },
];

const priceFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatPrice(price: number | null) {
  return price == null ? "A consultar" : priceFormatter.format(price);
}

export default async function HomePage() {
  const [featuredWines, ...kitWineLists] = await Promise.all([
    getActiveWines(8),
    ...KITS.map((kit) =>
      getCatalogWines({ momentName: kit.momentName }).then((wines) =>
        wines.slice(0, kit.count),
      ),
    ),
  ]);

  const [heroFeatured, ...restFeatured] = featuredWines;
  const featuredThumbs = restFeatured.slice(0, 3);

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroEdition}>
            <p className="eyebrow">MDB &middot; Distribuidora de vino &middot; Buenos Aires</p>
            <p className="eyebrow">N&deg; 01 / 2026</p>
          </div>
          <div className={styles.heroHeadline}>
            <h1>
              Decinos el plan.
              <br />
              <em>Te decimos qu&eacute; tomar.</em>
            </h1>
            <p className={styles.heroSub}>
              Sin tecnicismos, sin vueltas. Te asesoramos como un amigo que sabe de vino y arm&aacute;s tu pedido por
              WhatsApp en un toque.
            </p>
            <div className={styles.heroActions}>
              <Link className={`button ${styles.heroPrimary}`} href="/discover">
                Eleg&iacute; tu vino
              </Link>
              <Link className={styles.heroLink} href="/wines">
                O ver el cat&aacute;logo
              </Link>
            </div>
          </div>
          <div className={styles.heroSearch}>
            <SearchBar />
            <p>Si ya sab&eacute;s qu&eacute; quer&eacute;s, busc&aacute; por nombre.</p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className="eyebrow">Para el plan que tengas</p>
              <h2>Eleg&iacute; por momento, no por etiqueta.</h2>
            </div>
            <p className={styles.sectionAside}>
              Cinco situaciones reales. En cada una te dejamos botellas que ya probamos y van seguro.
            </p>
          </div>
          <div className={styles.momentsStaggered}>
            {moments.map((moment) => (
              <div
                className={moment.size === "lg" ? styles.momentLarge : styles.momentSmall}
                key={moment.name}
              >
                <MomentCard copy={moment.copy} name={moment.name} size={moment.size} />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className="eyebrow">Combos listos</p>
              <h2>Tres kits que ya armamos por vos.</h2>
            </div>
            <p className={styles.sectionAside}>
              Le dale &laquo;pedir&raquo; y te llega a WhatsApp el combo entero pre-armado, listo para confirmar.
            </p>
          </div>
          <div className={styles.kits}>
            {KITS.map((kit, index) => (
              <KitCard key={kit.slug} kit={kit} wines={kitWineLists[index] ?? []} />
            ))}
          </div>
        </section>

        {heroFeatured ? (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className="eyebrow">Esta semana</p>
                <h2>Lo que estamos recomendando.</h2>
              </div>
              <p className={styles.sectionAside}>
                Botellas que pasaron el filtro nuestro. Las pedimos seguido y nunca decepcionan.
              </p>
            </div>
            <div className={styles.featuredEditorial}>
              <div className={styles.featuredHero}>
                <WineCard note="La de la semana" wine={heroFeatured} />
              </div>
              <div className={styles.featuredThumbs}>
                {featuredThumbs.map((wine) => (
                  <Link className={styles.featuredThumb} href={`/wine/${wine.id}`} key={wine.id}>
                    {wine.image_url ? (
                      <img alt={wine.name} src={wine.image_url} />
                    ) : (
                      <div className={styles.featuredThumbPlaceholder}>MDB</div>
                    )}
                    <div className={styles.featuredThumbBody}>
                      <p className="eyebrow">Tambi&eacute;n probalo</p>
                      <h3>{wine.name}</h3>
                      <p>{wine.winery ?? "Bodega artesanal"}</p>
                    </div>
                    <span className={styles.featuredThumbPrice}>{formatPrice(wine.price_unit)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className={styles.closingBand}>
          <div>
            <p className="eyebrow">No sabes que elegir?</p>
            <h2>Hablanos. Te ayudamos a elegir uno bueno.</h2>
            <p>
              Cont&aacute;nos qu&eacute; pens&aacute;s tomar, con qui&eacute;n y cu&aacute;nto quer&eacute;s gastar.
              Te respondemos por WhatsApp con dos o tres opciones que van seguro.
            </p>
          </div>
          <div className={styles.closingActions}>
            <WhatsAppButton
              href={buildAdvisorWhatsAppLink()}
              items={[]}
              label="Asesorame por WhatsApp"
              variant="wa"
            />
          </div>
        </section>
      </main>
    </>
  );
}
