"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HeaderWinery } from "@/lib/public/types";
import styles from "./site-header.module.css";

type BodegaDropdownProps = {
  wineries: HeaderWinery[];
};

export function BodegaDropdown({ wineries }: BodegaDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className={styles.dropdownWrap} ref={wrapperRef}>
      <button
        aria-expanded={open}
        aria-haspopup="true"
        className={styles.navButton}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        Bodegas
      </button>

      {open ? (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownIntro}>
            <span>Bodegas</span>
            <strong>Elegí una bodega y entrá por línea</strong>
          </div>

          {wineries.length > 0 ? (
            <div className={styles.wineryMenu}>
              {wineries.map((winery) => (
                <section className={styles.wineryMenuGroup} key={winery.id}>
                  <Link href={`/bodegas#winery-${winery.id}`} onClick={() => setOpen(false)}>
                    {winery.name}
                  </Link>
                  <div>
                    {winery.lines.map((line) => (
                      <Link href={`/lineas/${line.id}`} key={line.id} onClick={() => setOpen(false)}>
                        {line.name}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p className={styles.emptyMenu}>Todavía no hay bodegas cargadas.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
