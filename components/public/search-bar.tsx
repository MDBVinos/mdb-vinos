"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PublicWine } from "@/lib/public/types";
import styles from "./search-bar.module.css";

const priceFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicWine[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const lastQuery = useRef("");

  useEffect(() => {
    const value = query.trim();

    if (value.length < 2) {
      return;
    }

    const timer = window.setTimeout(async () => {
      lastQuery.current = value;
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        const data = (await response.json()) as { wines: PublicWine[] };

        if (lastQuery.current === value) {
          setResults(data.wines);
        }
      } catch {
        if (lastQuery.current === value) {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  const showDropdown = touched && query.trim().length >= 2;

  return (
    <div className={styles.search}>
      <input
        aria-label="Buscar vino"
        onBlur={() => window.setTimeout(() => setTouched(false), 160)}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          setTouched(true);

          if (nextQuery.trim().length < 2) {
            lastQuery.current = "";
            setResults([]);
            setLoading(false);
          } else {
            setLoading(true);
          }
        }}
        onFocus={() => setTouched(true)}
        placeholder="Buscá por nombre: malbec, cabernet..."
        type="search"
        value={query}
      />

      {showDropdown ? (
        <div className={styles.dropdown}>
          {loading ? <p className={styles.message}>Buscando...</p> : null}
          {!loading && results.length === 0 ? (
            <p className={styles.message}>No encontramos ese vino, probá con otra búsqueda</p>
          ) : null}
          {!loading
            ? results.map((wine) => (
                <Link className={styles.result} href={`/wine/${wine.id}`} key={wine.id}>
                  {wine.image_url ? <img src={wine.image_url} alt="" /> : <span>MDB</span>}
                  <div>
                    <strong>{wine.name}</strong>
                    <small>
                      {wine.price_unit == null ? "Consultar precio" : priceFormatter.format(wine.price_unit)}
                    </small>
                  </div>
                </Link>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
