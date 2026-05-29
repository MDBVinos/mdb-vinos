"use client";

import { useMemo, useState } from "react";
import type { Wine } from "@/lib/admin/types";
import styles from "./discounts-manager.module.css";

type DiscountWinePickerProps = {
  currentDiscountId?: string;
  selectedWineIds: string[];
  wines: Wine[];
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function DiscountWinePicker({
  currentDiscountId,
  selectedWineIds,
  wines,
}: DiscountWinePickerProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set(selectedWineIds));

  const normalizedQuery = normalizeSearch(query);
  const filteredWines = useMemo(() => {
    if (!normalizedQuery) {
      return wines;
    }

    return wines.filter((wine) => {
      const haystack = [
        wine.name,
        wine.winery_name,
        wine.winery,
        wine.wine_line_name,
        wine.varietal_name,
        wine.discount_name,
      ]
        .filter(Boolean)
        .join(" ");

      return normalizeSearch(haystack).includes(normalizedQuery);
    });
  }, [normalizedQuery, wines]);
  const selectedWines = filteredWines.filter((wine) => selected.has(wine.id));
  const availableWines = filteredWines.filter((wine) => !selected.has(wine.id));

  function toggleWine(wineId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(wineId)) {
        next.delete(wineId);
      } else {
        next.add(wineId);
      }
      return next;
    });
  }

  return (
    <>
      {[...selected].map((wineId) => (
        <input key={wineId} name="wine_ids" type="hidden" value={wineId} />
      ))}

      <label className={styles.search}>
        <span>Buscar vino</span>
        <input
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, bodega, linea o varietal"
          type="search"
          value={query}
        />
      </label>

      <p className={styles.searchCount}>
        {filteredWines.length} {filteredWines.length === 1 ? "resultado" : "resultados"} · {selected.size}{" "}
        {selected.size === 1 ? "seleccionado" : "seleccionados"}
      </p>

      <div className={styles.wineGroups}>
        {filteredWines.length > 0 ? (
          <>
            <WineGroup
              currentDiscountId={currentDiscountId}
              emptyText="No hay vinos seleccionados para esta busqueda."
              onToggle={toggleWine}
              selected={selected}
              title="Seleccionados"
              wines={selectedWines}
            />
            <WineGroup
              currentDiscountId={currentDiscountId}
              emptyText="No quedan vinos disponibles para esta busqueda."
              onToggle={toggleWine}
              selected={selected}
              title="Disponibles"
              wines={availableWines}
            />
          </>
        ) : (
          <p className={styles.noResults}>No encontramos vinos con esa busqueda.</p>
        )}
      </div>
    </>
  );
}

function WineGroup({
  currentDiscountId,
  emptyText,
  onToggle,
  selected,
  title,
  wines,
}: {
  currentDiscountId?: string;
  emptyText: string;
  onToggle: (wineId: string) => void;
  selected: Set<string>;
  title: string;
  wines: Wine[];
}) {
  return (
    <section className={styles.wineGroup}>
      <h4>
        {title} <span>{wines.length}</span>
      </h4>
      {wines.length > 0 ? (
        <div className={styles.wineList}>
          {wines.map((wine) => (
            <label className={styles.wineOption} key={wine.id}>
              <input checked={selected.has(wine.id)} onChange={() => onToggle(wine.id)} type="checkbox" />
              <span>
                <strong>{wine.name}</strong>
                <small>
                  {wine.winery_name ?? wine.winery ?? "Sin bodega"}
                  {wine.wine_line_name ? ` · ${wine.wine_line_name}` : ""}
                  {wine.varietal_name ? ` · ${wine.varietal_name}` : ""}
                  {wine.discount_name && wine.discount_id !== currentDiscountId
                    ? ` · hoy en ${wine.discount_name}`
                    : ""}
                </small>
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className={styles.noResults}>{emptyText}</p>
      )}
    </section>
  );
}
