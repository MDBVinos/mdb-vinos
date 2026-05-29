import {
  createDiscountAction,
  deleteDiscountAction,
  updateDiscountAction,
} from "@/lib/admin/actions";
import type { AdminDiscount, Wine } from "@/lib/admin/types";
import { DiscountWinePicker } from "./discount-wine-picker";
import styles from "./discounts-manager.module.css";

type DiscountsManagerProps = {
  discounts: AdminDiscount[];
  wines: Wine[];
};

export function DiscountsManager({ discounts, wines }: DiscountsManagerProps) {
  return (
    <div className={styles.wrap}>
      <section className={styles.panel}>
        <div>
          <h3>Crear descuento</h3>
          <p>Elegí un nombre, porcentaje y los vinos que entran en la promoción.</p>
        </div>
        <DiscountForm action={createDiscountAction} submitLabel="Crear descuento" wines={wines} />
      </section>

      <section className={styles.list}>
        {discounts.length > 0 ? (
          discounts.map((discount) => (
            <article className={styles.panel} key={discount.id}>
              <div className={styles.discountHeader}>
                <div>
                  <p className={styles.kicker}>{discount.wine_count} {discount.wine_count === 1 ? "vino" : "vinos"}</p>
                  <h3>{discount.name}</h3>
                  <p>{discount.percent}% de descuento aplicado.</p>
                </div>
              </div>
              <details className={styles.discountDetails}>
                <summary>
                  <span className={styles.detailLabelOpen}>Ver detalle</span>
                  <span className={styles.detailLabelClose}>Ocultar detalle</span>
                  <span className={styles.detailArrow} aria-hidden="true">↓</span>
                </summary>
                <div className={styles.detailBody}>
                  <form action={deleteDiscountAction} className={styles.deleteForm}>
                    <input type="hidden" name="discount_id" value={discount.id} />
                    <button className="danger" type="submit">
                      Eliminar
                    </button>
                  </form>
                  <DiscountForm
                    action={updateDiscountAction}
                    discount={discount}
                    submitLabel="Guardar cambios"
                    wines={wines}
                  />
                </div>
              </details>
            </article>
          ))
        ) : (
          <div className={styles.empty}>
            <h3>Todavía no hay descuentos</h3>
            <p>Creá el primero desde esta pantalla o seleccionando vinos en la solapa Vinos.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function DiscountForm({
  action,
  discount,
  submitLabel,
  wines,
}: {
  action: (formData: FormData) => void | Promise<void>;
  discount?: AdminDiscount;
  submitLabel: string;
  wines: Wine[];
}) {
  const selectedWineIds = new Set(discount?.wines.map((wine) => wine.id) ?? []);

  return (
    <form action={action} className={styles.form}>
      {discount ? <input type="hidden" name="discount_id" value={discount.id} /> : null}

      <div className={styles.grid}>
        <label className="field">
          <span>Nombre</span>
          <input name="name" required defaultValue={discount?.name ?? ""} placeholder="Ej: Promo Malbec" />
        </label>
        <label className="field">
          <span>Porcentaje</span>
          <input
            defaultValue={discount?.percent ?? ""}
            max="99"
            min="1"
            name="percent"
            placeholder="Ej: 10"
            required
            type="number"
          />
        </label>
      </div>

      <fieldset className={styles.wines}>
        <legend>Vinos del descuento</legend>
        <DiscountWinePicker
          currentDiscountId={discount?.id}
          selectedWineIds={[...selectedWineIds]}
          wines={wines}
        />
      </fieldset>

      <div className={styles.footer}>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
