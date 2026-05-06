import type { KitDefinition } from "@/lib/public/kits";
import type { PublicWine } from "@/lib/public/types";
import { buildKitWhatsAppLink } from "@/lib/public/whatsapp";
import { WhatsAppButton } from "./whatsapp-button";
import styles from "./kit-card.module.css";

type KitCardProps = {
  kit: KitDefinition;
  wines: PublicWine[];
};

const priceFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

function totalEstimate(wines: PublicWine[]) {
  const subtotal = wines.reduce((acc, wine) => acc + (wine.price_unit ?? 0), 0);
  if (subtotal === 0) return null;
  return priceFormatter.format(subtotal);
}

export function KitCard({ kit, wines }: KitCardProps) {
  const items = wines.map((wine) => ({
    wine,
    quantity: 1,
    format: "unit" as const,
  }));
  const link = buildKitWhatsAppLink(kit.title, items);
  const total = totalEstimate(wines);

  return (
    <article className={styles.card} data-slug={kit.slug}>
      <div className={styles.head}>
        <p className="eyebrow">Combo listo</p>
        <h3>{kit.title}</h3>
        <p className={styles.oneLiner}>{kit.oneLiner}</p>
      </div>

      {wines.length > 0 ? (
        <ol className={styles.list}>
          {wines.map((wine, index) => (
            <li key={wine.id}>
              <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.wineName}>{wine.name}</span>
              <span className={styles.winePrice}>
                {wine.price_unit == null ? "A consultar" : priceFormatter.format(wine.price_unit)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.empty}>Estamos curando este kit. Pedinos por WhatsApp y lo armamos a medida.</p>
      )}

      <div className={styles.footer}>
        <div className={styles.total}>
          {total ? (
            <>
              <span className="eyebrow">Total estimado</span>
              <strong>{total}</strong>
            </>
          ) : (
            <>
              <span className="eyebrow">Precio</span>
              <strong>A confirmar</strong>
            </>
          )}
        </div>
        {wines.length > 0 ? (
          <WhatsAppButton
            href={link}
            items={items}
            label="Pedir este kit"
            variant="wa"
          />
        ) : (
          <WhatsAppButton
            items={[]}
            label="Armarlo a medida"
            variant="wa"
          />
        )}
      </div>
    </article>
  );
}
