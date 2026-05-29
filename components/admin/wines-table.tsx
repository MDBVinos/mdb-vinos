"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { bulkWineAction, toggleWineActiveAction } from "@/lib/admin/actions";
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
  const [selectedWinery, setSelectedWinery] = useState("");
  const [selectedLine, setSelectedLine] = useState("");
  const [selectedVarietal, setSelectedVarietal] = useState("");
  const [selectedFeatured, setSelectedFeatured] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDiscountOpen, setBulkDiscountOpen] = useState(false);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filterOptions = useMemo(() => {
    return {
      lines: uniqueOptions(wines, "wine_line_id", "wine_line_name"),
      varietals: uniqueOptions(wines, "varietal_id", "varietal_name"),
      wineries: uniqueOptions(wines, "winery_id", "winery_name"),
    };
  }, [wines]);

  const filteredWines = useMemo(() => {
    return wines.filter((wine) => {
      const wineryMatches = !selectedWinery || (selectedWinery === "__none" ? !wine.winery_id : wine.winery_id === selectedWinery);
      const lineMatches = !selectedLine || (selectedLine === "__none" ? !wine.wine_line_id : wine.wine_line_id === selectedLine);
      const varietalMatches =
        !selectedVarietal || (selectedVarietal === "__none" ? !wine.varietal_id : wine.varietal_id === selectedVarietal);
      const featuredMatches =
        !selectedFeatured ||
        (selectedFeatured === "featured" ? wine.featured : !wine.featured);

      return wineryMatches && lineMatches && varietalMatches && featuredMatches;
    });
  }, [selectedFeatured, selectedLine, selectedVarietal, selectedWinery, wines]);

  const visibleIds = filteredWines.map((wine) => wine.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));
  const selectedVisibleCount = visibleIds.filter((id) => selectedSet.has(id)).length;

  function clearFilters() {
    setSelectedWinery("");
    setSelectedLine("");
    setSelectedVarietal("");
    setSelectedFeatured("");
  }

  function toggleWineSelection(wineId: string) {
    setSelectedIds((current) =>
      current.includes(wineId) ? current.filter((id) => id !== wineId) : [...current, wineId],
    );
  }

  function toggleVisibleSelection() {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return [...new Set([...current, ...visibleIds])];
    });
  }

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
    <>
      <section className={styles.controls} aria-label="Filtros de vinos">
        <div className={styles.filters}>
          <FilterSelect
            label="Bodega"
            onChange={setSelectedWinery}
            options={filterOptions.wineries}
            value={selectedWinery}
          />
          <FilterSelect label="Línea" onChange={setSelectedLine} options={filterOptions.lines} value={selectedLine} />
          <FilterSelect
            label="Varietal"
            onChange={setSelectedVarietal}
            options={filterOptions.varietals}
            value={selectedVarietal}
          />
          <FeaturedFilterSelect onChange={setSelectedFeatured} value={selectedFeatured} />
        </div>
        <div className={styles.filterMeta}>
          <span>
            {filteredWines.length} {filteredWines.length === 1 ? "vino visible" : "vinos visibles"}
          </span>
          <button className="secondary" onClick={clearFilters} type="button">
            Limpiar filtros
          </button>
        </div>
      </section>

      {selectedIds.length > 0 ? (
        <section className={styles.bulkBar} aria-label="Acciones masivas">
          <p>
            {selectedIds.length} {selectedIds.length === 1 ? "vino seleccionado" : "vinos seleccionados"}
            {selectedVisibleCount !== selectedIds.length ? ` (${selectedVisibleCount} visibles)` : ""}
          </p>
          <div className={styles.bulkActions}>
            <BulkActionForm intent="activate" selectedIds={selectedIds} label="Activar" />
            <BulkActionForm intent="deactivate" selectedIds={selectedIds} label="Desactivar" />
            <BulkActionForm intent="feature" selectedIds={selectedIds} label="Destacar" />
            <BulkActionForm intent="unfeature" selectedIds={selectedIds} label="Quitar destacado" />
            <button onClick={() => setBulkDiscountOpen(true)} type="button">
              Aplicar descuento
            </button>
            <BulkActionForm intent="clear-discount" selectedIds={selectedIds} label="Quitar descuento" />
            <button className="danger" onClick={() => setBulkDeleteOpen(true)} type="button">
              Eliminar
            </button>
            <button className="secondary" onClick={() => setSelectedIds([])} type="button">
              Quitar selección
            </button>
          </div>
        </section>
      ) : null}

      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.selectCol}>
                <input
                  aria-label="Seleccionar vinos visibles"
                  checked={allVisibleSelected}
                  disabled={visibleIds.length === 0}
                  onChange={toggleVisibleSelection}
                  type="checkbox"
                />
              </th>
              <th className={styles.nameCol}>Nombre</th>
              <th>Bodega</th>
              <th>Línea</th>
              <th>Varietal</th>
              <th>Precio unidad</th>
              <th>Caja</th>
              <th>Desc.</th>
              <th>Activo</th>
              <th className={styles.actionsCol}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredWines.length > 0 ? (
              filteredWines.map((wine) => (
                <tr key={wine.id}>
                  <td className={styles.selectCol}>
                    <input
                      aria-label={`Seleccionar ${wine.name}`}
                      checked={selectedSet.has(wine.id)}
                      onChange={() => toggleWineSelection(wine.id)}
                      type="checkbox"
                    />
                  </td>
                  <td className={styles.nameCol}>{wine.name}</td>
                  <td>{wine.winery_name ?? wine.winery ?? "-"}</td>
                  <td>{wine.wine_line_name ?? "-"}</td>
                  <td>{wine.varietal_name ?? "-"}</td>
                  <td>{wine.price_unit == null ? "-" : currencyFormatter.format(wine.price_unit)}</td>
                  <td>
                    {wine.price_box == null ? "-" : currencyFormatter.format(wine.price_box)}
                    {wine.units_per_box == null ? null : <span className={styles.units}> x {wine.units_per_box}</span>}
                  </td>
                  <td>{wine.discount_percent ? <span className={styles.discount}>{wine.discount_percent}%</span> : "-"}</td>
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
              ))
            ) : (
              <tr>
                <td className={styles.noResults} colSpan={10}>
                  No hay vinos para esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {bulkDeleteOpen ? (
        <div className={styles.backdrop} onClick={() => setBulkDeleteOpen(false)}>
          <div className={styles.dialog} onClick={(event) => event.stopPropagation()}>
            <p className={styles.dialogTitle}>Eliminar vinos seleccionados</p>
            <p className={styles.dialogCopy}>
              ¿Seguro que querés eliminar {selectedIds.length} {selectedIds.length === 1 ? "vino" : "vinos"}? Esta
              acción no se puede deshacer.
            </p>
            <div className={styles.dialogActions}>
              <button className="secondary" onClick={() => setBulkDeleteOpen(false)} type="button">
                Cancelar
              </button>
              <form action={bulkWineAction}>
                <input type="hidden" name="intent" value="delete" />
                {selectedIds.map((id) => (
                  <input key={id} type="hidden" name="wine_ids" value={id} />
                ))}
                <button className="danger" type="submit">
                  Eliminar definitivamente
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {bulkDiscountOpen ? (
        <div className={styles.backdrop} onClick={() => setBulkDiscountOpen(false)}>
          <div className={styles.dialog} onClick={(event) => event.stopPropagation()}>
            <p className={styles.dialogTitle}>Aplicar descuento</p>
            <p className={styles.dialogCopy}>
              Ingresá el porcentaje para {selectedIds.length} {selectedIds.length === 1 ? "vino seleccionado" : "vinos seleccionados"}.
            </p>
            <form action={bulkWineAction} className={styles.discountForm}>
              <input type="hidden" name="intent" value="discount" />
              {selectedIds.map((id) => (
                <input key={id} type="hidden" name="wine_ids" value={id} />
              ))}
              <label>
                <span>Nombre del descuento</span>
                <input name="name" placeholder="Ej: Promo Malbec" required />
              </label>
              <label>
                <span>Descuento porcentual</span>
                <input min="1" max="99" name="percent" placeholder="Ej: 10" required type="number" />
              </label>
              <div className={styles.dialogActions}>
                <button className="secondary" onClick={() => setBulkDiscountOpen(false)} type="button">
                  Cancelar
                </button>
                <button type="submit">Aplicar descuento</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
  value: string;
}) {
  return (
    <label className={styles.filter}>
      <span>{label}</span>
      <select onChange={(event) => onChange(event.currentTarget.value)} value={value}>
        <option value="">Todos</option>
        <option value="__none">Sin {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function FeaturedFilterSelect({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={styles.filter}>
      <span>Destacado</span>
      <select onChange={(event) => onChange(event.currentTarget.value)} value={value}>
        <option value="">Todos</option>
        <option value="featured">Solo destacados</option>
        <option value="unfeatured">No destacados</option>
      </select>
    </label>
  );
}

function BulkActionForm({
  intent,
  label,
  selectedIds,
}: {
  intent: "activate" | "deactivate" | "feature" | "unfeature" | "clear-discount";
  label: string;
  selectedIds: string[];
}) {
  return (
    <form action={bulkWineAction}>
      <input type="hidden" name="intent" value={intent} />
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="wine_ids" value={id} />
      ))}
      <button type="submit">{label}</button>
    </form>
  );
}

function uniqueOptions(wines: Wine[], idKey: keyof Wine, nameKey: keyof Wine) {
  const options = new Map<string, string>();

  for (const wine of wines) {
    const id = wine[idKey];
    const name = wine[nameKey];
    if (typeof id === "string" && id && typeof name === "string" && name) {
      options.set(id, name);
    }
  }

  return [...options.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((first, second) => first.name.localeCompare(second.name, "es"));
}
