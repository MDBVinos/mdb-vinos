"use client";

import { useState } from "react";
import type { PublicWine } from "@/lib/public/types";
import { discountedPrice, hasDiscount } from "@/lib/wines/discount";
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

function PriceLabel({ label, price, wine }: { label: string; price: number | null; wine: PublicWine }) {
  const finalPrice = discountedPrice(price, wine.discount_percent);
  const discounted = hasDiscount(wine.discount_percent) && price != null && finalPrice !== price;

  return (
    <strong>
      {discounted ? <del>{formatPrice(price)}</del> : null}
      {formatPrice(finalPrice)} <span>{label}</span>
    </strong>
  );
}

function boxText(unitsPerBox: number | null) {
  return unitsPerBox ? `x caja de ${unitsPerBox} unidades` : "x caja";
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
    setAdded(format === "box" ? `Caja${wine.units_per_box ? ` x ${wine.units_per_box} u.` : ""} sumada` : "Unidad sumada");
    window.setTimeout(() => setAdded(""), 1500);
  }

  return (
    <div className={styles.box}>
      <div className={styles.row}>
        <PriceLabel label="x unidad" price={wine.price_unit} wine={wine} />
        <button disabled={unitQuantity === 0} onClick={() => decrementItem(unitId)} type="button" aria-label="Restar unidad">
          -
        </button>
        <span className={styles.quantity}>{unitQuantity} {unitQuantity === 1 ? "unidad" : "unidades"}</span>
        <button onClick={() => onAdd("unit")} type="button" aria-label="Sumar unidad">
          +
        </button>
      </div>
      <div className={styles.row}>
        <PriceLabel label={boxText(wine.units_per_box)} price={wine.price_box} wine={wine} />
        <button disabled={boxQuantity === 0} onClick={() => decrementItem(boxId)} type="button" aria-label="Restar caja">
          -
        </button>
        <span className={styles.quantity}>
          {boxQuantity} {boxQuantity === 1 ? "caja" : "cajas"}
          {wine.units_per_box ? ` x ${wine.units_per_box} u.` : ""}
        </span>
        <button disabled={!canBuyBox} onClick={() => onAdd("box")} type="button" aria-label="Sumar caja">
          +
        </button>
      </div>
      {added ? <p>{added}</p> : null}
    </div>
  );
}
