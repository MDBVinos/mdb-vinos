"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CartItem } from "./cart-context";
import { useCart } from "./cart-context";
import type { PublicWine } from "@/lib/public/types";
import styles from "./floating-cart.module.css";

const priceFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

type CartGroup = {
  wineId: string;
  name: string;
  image_url: string | null;
  price_unit: number | null;
  price_box: number | null;
  units_per_box: number | null;
  unitItem: CartItem | null;
  boxItem: CartItem | null;
  total: number;
};

function itemPrice(item: CartItem | null) {
  if (!item) {
    return null;
  }

  return item.format === "box" ? item.price_box : item.price_unit;
}

function formatPrice(price: number) {
  return priceFormatter.format(price);
}

function groupToWine(group: CartGroup): PublicWine {
  return {
    id: group.wineId,
    name: group.name,
    winery: null,
    winery_id: null,
    winery_name: null,
    wine_line_id: null,
    wine_line_name: null,
    varietal_id: null,
    varietal_name: null,
    description: null,
    discount_percent: null,
    price_unit: group.price_unit,
    price_box: group.price_box,
    units_per_box: group.units_per_box,
    image_url: group.image_url,
    featured: false,
    active: true,
  };
}

export function FloatingCart() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { addItem, decrementItem, incrementItem, items, totalItems, whatsappLink } = useCart();

  useEffect(() => {
    function onOpenCart() {
      setOpen(true);
    }

    window.addEventListener("mdb:open-cart", onOpenCart);
    return () => window.removeEventListener("mdb:open-cart", onOpenCart);
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, CartGroup>();

    for (const item of items) {
      const existing =
        map.get(item.wineId) ??
        ({
          wineId: item.wineId,
          name: item.name,
          image_url: item.image_url ?? null,
          price_unit: item.price_unit,
          price_box: item.price_box,
          units_per_box: item.units_per_box,
          unitItem: null,
          boxItem: null,
          total: 0,
        } satisfies CartGroup);

      if (item.format === "box") {
        existing.boxItem = item;
      } else {
        existing.unitItem = item;
      }

      const price = itemPrice(item);
      existing.total += price == null ? 0 : price * item.quantity;
      map.set(item.wineId, existing);
    }

    return Array.from(map.values());
  }, [items]);

  if (pathname?.startsWith("/admin") || pathname === "/login") {
    return null;
  }

  const total = groups.reduce((sum, group) => sum + group.total, 0);

  if (!open) {
    return null;
  }

  return (
    <aside className={styles.overlay} aria-label="Carrito de compra">
      <button className={styles.backdrop} onClick={() => setOpen(false)} type="button" aria-label="Cerrar carrito" />
      <section className={styles.panel}>
        <button className={styles.close} onClick={() => setOpen(false)} type="button" aria-label="Cerrar">
          ×
        </button>
        <h2>Confirma tu pedido</h2>

        {groups.length > 0 ? (
          <>
            <div className={styles.heading}>
              <span />
              <span>Nombre del vino</span>
              <span>Cajas</span>
              <span>Unidades</span>
              <span />
            </div>

            <div className={styles.items}>
              {groups.map((group) => (
                <div className={styles.item} key={group.wineId}>
                  <div className={styles.thumb}>
                    {group.image_url ? <img src={group.image_url} alt="" /> : <span>MDB</span>}
                  </div>
                  <strong>{group.name}</strong>

                  <div className={styles.counter}>
                    <span className={styles.counterLabel}>
                      Cajas{group.units_per_box ? ` x ${group.units_per_box} u.` : ""}
                    </span>
                    <button
                      disabled={!group.boxItem}
                      onClick={() => group.boxItem && decrementItem(group.boxItem.id)}
                      type="button"
                    >
                      -
                    </button>
                    <span className={styles.quantity}>{group.boxItem?.quantity ?? 0}</span>
                    <button
                      onClick={() =>
                        group.boxItem ? incrementItem(group.boxItem.id) : addItem({ wine: groupToWine(group), quantity: 1, format: "box" })
                      }
                      type="button"
                    >
                      +
                    </button>
                  </div>

                  <div className={styles.counter}>
                    <span className={styles.counterLabel}>Unidades</span>
                    <button
                      disabled={!group.unitItem}
                      onClick={() => group.unitItem && decrementItem(group.unitItem.id)}
                      type="button"
                    >
                      -
                    </button>
                    <span className={styles.quantity}>{group.unitItem?.quantity ?? 0}</span>
                    <button
                      onClick={() =>
                        group.unitItem ? incrementItem(group.unitItem.id) : addItem({ wine: groupToWine(group), quantity: 1, format: "unit" })
                      }
                      type="button"
                    >
                      +
                    </button>
                  </div>

                  <span className={styles.value}>{group.total > 0 ? formatPrice(group.total) : "$valor"}</span>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <strong>{total > 0 ? formatPrice(total) : "$Total"}</strong>
              <a href={`/thanks?to=${encodeURIComponent(whatsappLink)}`}>
                Confirmar
              </a>
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <p>Todavía no agregaste vinos al carrito.</p>
            <a href={`/thanks?to=${encodeURIComponent(whatsappLink)}`}>
              Consultar
            </a>
          </div>
        )}

        <p className={styles.count}>{totalItems > 0 ? `${totalItems} productos` : ""}</p>
      </section>
    </aside>
  );
}
