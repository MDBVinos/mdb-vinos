import Link from "next/link";
import { toggleWineActiveAction } from "@/lib/admin/actions";
import type { Wine } from "@/lib/admin/types";
import { DeleteWineDialog } from "./delete-wine-dialog";
import styles from "./wines-table.module.css";

type WinesTableProps = {
  wines: Wine[];
};

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  style: "currency",
});

export function WinesTable({ wines }: WinesTableProps) {
  if (wines.length === 0) {
    return (
      <div className={styles.empty}>
        <h2>Todavia no hay vinos cargados</h2>
        <Link className="button" href="/admin/new">
          Crear primer vino
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.nameCol}>Nombre</th>
            <th>Bodega</th>
            <th>Precio unidad</th>
            <th>Caja</th>
            <th>Activo</th>
            <th className={styles.actionsCol}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {wines.map((wine) => (
            <tr key={wine.id}>
              <td className={styles.nameCol}>{wine.name}</td>
              <td>{wine.winery ?? "-"}</td>
              <td>{wine.price_unit == null ? "-" : currencyFormatter.format(wine.price_unit)}</td>
              <td>
                {wine.price_box == null ? "-" : currencyFormatter.format(wine.price_box)}
                {wine.units_per_box == null ? null : <span className={styles.units}> x {wine.units_per_box}</span>}
              </td>
              <td>
                <span className={wine.active ? styles.active : styles.inactive}>
                  {wine.active ? "true" : "false"}
                </span>
              </td>
              <td className={styles.actionsCol}>
                <div className={styles.actions}>
                  <form action={toggleWineActiveAction}>
                    <input type="hidden" name="id" value={wine.id} />
                    <input type="hidden" name="active" value={String(wine.active)} />
                    <button
                      className={`${styles.toggleButton} ${wine.active ? "danger" : ""}`.trim()}
                      type="submit"
                    >
                      {wine.active ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                  <Link
                    aria-label={`Editar ${wine.name}`}
                    className={`button secondary ${styles.iconButton}`}
                    href={`/admin/edit/${wine.id}`}
                    title="Editar"
                  >
                    <svg
                      aria-hidden="true"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                    </svg>
                  </Link>
                  <DeleteWineDialog wineId={wine.id} wineName={wine.name} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
