"use client";

import { useCart } from "./cart-context";
import styles from "./site-header.module.css";

export function HeaderCartButton() {
  const { totalItems } = useCart();

  function openCart() {
    window.dispatchEvent(new Event("mdb:open-cart"));
  }

  return (
    <button className={styles.cartLink} onClick={openCart} type="button" aria-label="Abrir carrito">
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <path d="M7 10h8l7 32h28l6-22H20" />
        <path d="M25 50a4 4 0 1 0 0 .1M48 50a4 4 0 1 0 0 .1" />
      </svg>
      {totalItems > 0 ? <span>{totalItems}</span> : null}
    </button>
  );
}
