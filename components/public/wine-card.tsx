import Link from "next/link";
import type { PublicWine } from "@/lib/public/types";
import { WhatsAppButton } from "./whatsapp-button";
import styles from "./wine-card.module.css";

type WineCardProps = {
  wine: PublicWine;
  note?: string;
};

const priceFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatPrice(price: number | null) {
  return price == null ? "Consultar precio" : priceFormatter.format(price);
}

export function WineCard({ wine, note = "Un vino que nunca falla" }: WineCardProps) {
  return (
    <article className={styles.card}>
      <Link className={styles.imageLink} href={`/wine/${wine.id}`}>
        {wine.image_url ? (
          <img src={wine.image_url} alt={wine.name} />
        ) : (
          <div className={styles.placeholder}>MDB</div>
        )}
      </Link>

      <div className={styles.body}>
        <p className={styles.note}>{note}</p>
        <h3>
          <Link href={`/wine/${wine.id}`}>{wine.name}</Link>
        </h3>
        <p className={styles.description}>{wine.description ?? "Elegilo sin complicarte."}</p>
        <div className={styles.footer}>
          <strong>{formatPrice(wine.price_unit)}</strong>
          <WhatsAppButton
            items={[{ wine, quantity: 1, format: "unit" }]}
            label="Pedir por WhatsApp"
            variant="wa"
          />
        </div>
      </div>
    </article>
  );
}
