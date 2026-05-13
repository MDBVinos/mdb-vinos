"use client";

import { useState } from "react";
import type { PublicWine } from "@/lib/public/types";
import { useCart, type CartFormat } from "./cart-context";
import styles from "./product-buy-box.module.css";

type ProductBuyBoxProps = {
  wine: PublicWine;
};

const priceFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatPrice(price: number | null) {
  return price == null ? "Consultar precio" : priceFormatter.format(price);
}

export function ProductBuyBox({ wine }: ProductBuyBoxProps) {
  const { addItem, decrementItem, items } = useCart();
  const [added, setAdded] = useState("");
  const canBuyBox = wine.price_box != null;
  const unitId = `${wine.id}:unit`;
  const boxId = `${wine.id}:box`;
  const unitQuantity = items.find((item) => item.id === unitId)?.quantity ?? 0;
  const boxQuantity = items.find((item) => item.id === boxId)?.quantity ?? 0;

  function onAdd(format: CartFormat) {
    addItem({ wine, quantity: 1, format });
    setAdded(format === "box" ? "Caja sumada" : "Unidad sumada");
    window.setTimeout(() => setAdded(""), 1500);
  }

  return (
    <div className={styles.box}>
      <div className={styles.row}>
        <strong>{formatPrice(wine.price_unit)} <span>x unidad</span></strong>
        <button disabled={unitQuantity === 0} onClick={() => decrementItem(unitId)} type="button" aria-label="Restar unidad">
          -
        </button>
        <span className={styles.quantity}>{unitQuantity} {unitQuantity === 1 ? "unidad" : "unidades"}</span>
        <button onClick={() => onAdd("unit")} type="button" aria-label="Sumar unidad">
          +
        </button>
      </div>
      <div className={styles.row}>
        <strong>{formatPrice(wine.price_box)} <span>x caja</span></strong>
        <button disabled={boxQuantity === 0} onClick={() => decrementItem(boxId)} type="button" aria-label="Restar caja">
          -
        </button>
        <span className={styles.quantity}>{boxQuantity} {boxQuantity === 1 ? "caja" : "cajas"}</span>
        <button disabled={!canBuyBox} onClick={() => onAdd("box")} type="button" aria-label="Sumar caja">
          +
        </button>
      </div>
      {added ? <p>{added}</p> : null}
    </div>
  );
}
