"use client";

import { useState } from "react";
import type { WineryCatalog } from "@/lib/public/types";
import { WineCard } from "./wine-card";
import styles from "@/app/public.module.css";

type WineryAccordionProps = {
  wineries: WineryCatalog[];
};

export function WineryAccordion({ wineries }: WineryAccordionProps) {
  const [openLineId, setOpenLineId] = useState<string | null>(null);

  return (
    <div className={styles.wineryList}>
      {wineries.map((winery) => (
        <section className={styles.winerySection} id={`winery-${winery.id}`} key={winery.id}>
          <div className={styles.wineryHeader}>
            <h2>{winery.name}</h2>
          </div>

          <div className={styles.lineList}>
            {winery.lines.map((line) => {
              const isOpen = openLineId === line.id;

              return (
                <section className={styles.lineSection} id={`line-${line.id}`} key={line.id}>
                  <button
                    aria-controls={`line-panel-${line.id}`}
                    aria-expanded={isOpen}
                    className={styles.lineToggle}
                    onClick={() => setOpenLineId(isOpen ? null : line.id)}
                    type="button"
                  >
                    <span>{line.name}</span>
                    <small>{line.wines.length} {line.wines.length === 1 ? "vino" : "vinos"}</small>
                  </button>

                  {isOpen ? (
                    <div className={styles.linePanel} id={`line-panel-${line.id}`}>
                      <div className={styles.grid}>
                        {line.wines.map((wine) => (
                          <WineCard key={wine.id} wine={wine} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
