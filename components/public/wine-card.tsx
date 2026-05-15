"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicWine } from "@/lib/public/types";
import { useCart, type CartFormat } from "./cart-context";
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

function boxLabel(unitsPerBox: number | null) {
  return unitsPerBox ? `Valor caja x ${unitsPerBox} u.` : "Valor caja";
}

export function WineCard({ wine, note = "Etiqueta" }: WineCardProps) {
  const { addItem, decrementItem, items } = useCart();
  const [added, setAdded] = useState(false);
  const canBuyBox = wine.price_box != null;
  const lineAndVarietal = [wine.wine_line_name, wine.varietal_name ?? wine.name].filter(Boolean).join(" · ");
  const wineryName = wine.winery_name ?? wine.winery ?? "Bodega";
  const momentDescription =
    note && note !== "Etiqueta" ? `Ideal para ${note.toLowerCase()}.` : "Pensado para acompañar tus momentos.";
  const unitId = `${wine.id}:unit`;
  const boxId = `${wine.id}:box`;
  const unitQuantity = items.find((item) => item.id === unitId)?.quantity ?? 0;
  const boxQuantity = items.find((item) => item.id === boxId)?.quantity ?? 0;

  function onAdd(format: CartFormat) {
    addItem({ wine, quantity: 1, format });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

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
        <Link className={styles.wineName} href={`/wine/${wine.id}`}>
          {lineAndVarietal || wine.name}
        </Link>
        <p className={styles.winery}>{wineryName}</p>

        <div className={styles.prices}>
          <div className={styles.priceRow}>
            <strong>Valor unidad</strong>
            <span>{formatPrice(wine.price_unit)}</span>
          </div>
          <div className={styles.priceRow}>
            <strong>{boxLabel(wine.units_per_box)}</strong>
            <span>{formatPrice(wine.price_box)}</span>
          </div>
        </div>

        <div className={styles.quantities}>
          <div className={styles.quantityRow}>
            <span>{unitQuantity} {unitQuantity === 1 ? "unidad" : "unidades"}</span>
            <button disabled={unitQuantity === 0} onClick={() => decrementItem(unitId)} type="button" aria-label="Restar unidad">
              -
            </button>
            <button onClick={() => onAdd("unit")} type="button" aria-label="Sumar unidad">
              +
            </button>
          </div>
          <div className={styles.quantityRow}>
            <span>
              {boxQuantity} {boxQuantity === 1 ? "caja" : "cajas"}
              {wine.units_per_box ? ` x ${wine.units_per_box} u.` : ""}
            </span>
            <button disabled={boxQuantity === 0} onClick={() => decrementItem(boxId)} type="button" aria-label="Restar caja">
              -
            </button>
            <button disabled={!canBuyBox} onClick={() => onAdd("box")} type="button" aria-label="Sumar caja">
              +
            </button>
          </div>
        </div>

        <p className={styles.momentDescription}>{momentDescription}</p>
        {added ? <p className={styles.added}>Sumado</p> : null}
      </div>
    </article>
  );
}
