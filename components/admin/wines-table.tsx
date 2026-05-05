import Link from "next/link";
import { toggleWineActiveAction } from "@/lib/admin/actions";
import type { Wine } from "@/lib/admin/types";
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
            <th>Nombre</th>
            <th>Precio unidad</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {wines.map((wine) => (
            <tr key={wine.id}>
              <td>{wine.name}</td>
              <td>{wine.price_unit == null ? "-" : currencyFormatter.format(wine.price_unit)}</td>
              <td>
                <span className={wine.active ? styles.active : styles.inactive}>
                  {wine.active ? "true" : "false"}
                </span>
              </td>
              <td>
                <div className={styles.actions}>
                  <Link className="button secondary" href={`/admin/edit/${wine.id}`}>
                    Editar
                  </Link>
                  <form action={toggleWineActiveAction}>
                    <input type="hidden" name="id" value={wine.id} />
                    <input type="hidden" name="active" value={String(wine.active)} />
                    <button className={wine.active ? "danger" : undefined} type="submit">
                      {wine.active ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
