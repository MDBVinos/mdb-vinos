"use client";

import { useEffect, useState } from "react";
import { deleteWineAction } from "@/lib/admin/actions";
import { SubmitButton } from "./submit-button";
import styles from "./delete-wine-dialog.module.css";

type DeleteWineDialogProps = {
  wineId: string;
  wineName: string;
};

export function DeleteWineDialog({ wineId, wineName }: DeleteWineDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        aria-label={`Eliminar ${wineName}`}
        className={`danger ${styles.trigger}`}
        type="button"
        title="Eliminar"
        onClick={() => setOpen(true)}
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
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        </svg>
      </button>

      {open && (
        <div className={styles.backdrop} onClick={() => setOpen(false)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <p className={styles.title}>Eliminar vino</p>
            <p className={styles.copy}>
              ¿Seguro que querés eliminar <strong>{wineName}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className={styles.actions}>
              <button type="button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <form action={deleteWineAction}>
                <input type="hidden" name="id" value={wineId} />
                <SubmitButton label="Eliminar definitivamente" loadingLabel="Eliminando..." />
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
