"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  confirmWineImportAction,
  previewWineImportAction,
  type WineImportActionState,
} from "@/lib/admin/actions";
import { SubmitButton } from "./submit-button";
import styles from "./import-form.module.css";

const initialState: WineImportActionState = {};

export function ImportForm() {
  const [previewState, previewAction] = useActionState(previewWineImportAction, initialState);
  const [confirmState, confirmAction] = useActionState(confirmWineImportAction, initialState);
  const error = confirmState.error ?? previewState.error;
  const preview = previewState.preview;
  const canImport = Boolean(previewState.payload && preview && preview.summary.errors === 0);
  const validRowsToImport = preview ? preview.summary.creates + preview.summary.updates : 0;

  return (
    <div className={styles.wrap}>
      {error ? (
        <p aria-live="polite" className="alert error" role="alert">
          {error}
        </p>
      ) : null}

      <form action={previewAction} className={styles.panel}>
        <div className="field">
          <label htmlFor="file">Archivo Excel</label>
          <input id="file" name="file" type="file" accept=".xlsx" required />
        </div>

        <PendingNotice
          message="Leyendo el Excel y validando filas. Esto puede tardar unos segundos..."
          title="Procesando archivo"
        />

        <div className={styles.footer}>
          <SubmitButton label="Previsualizar" loadingLabel="Leyendo..." />
        </div>
      </form>

      {preview ? (
        <section className={styles.panel}>
          <div className={styles.summary} aria-label="Resumen del importador">
            <SummaryItem label="Filas" value={preview.summary.rows} />
            <SummaryItem label="Nuevos" value={preview.summary.creates} />
            <SummaryItem label="Actualizados" value={preview.summary.updates} />
            <SummaryItem
              label="Errores"
              tone={preview.summary.errors > 0 ? "error" : "default"}
              value={preview.summary.errors}
            />
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Accion</th>
                  <th>Nombre</th>
                  <th>Bodega</th>
                  <th>Tipo</th>
                  <th>Perfil</th>
                  <th>Momentos</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.line}>
                    <td>{row.line}</td>
                    <td>{row.action === "create" ? "Crear" : "Actualizar"}</td>
                    <td>{row.name || "-"}</td>
                    <td>{row.winery ?? "-"}</td>
                    <td>{row.typeName ?? (row.action === "update" ? "Preserva" : "-")}</td>
                    <td>{row.intensityName ?? (row.action === "update" ? "Preserva" : "-")}</td>
                    <td>
                      {row.momentNames.length > 0
                        ? row.momentNames.join(", ")
                        : row.action === "update"
                          ? "Preserva"
                          : "-"}
                    </td>
                    <td>
                      {row.errors.length > 0 ? (
                        <span className={styles.error}>{row.errors.join(" ")}</span>
                      ) : (
                        <span className={styles.ok}>OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form action={confirmAction} className={styles.confirmForm}>
            <input name="payload" type="hidden" value={previewState.payload ?? ""} />
            <PendingNotice
              message={`Importando ${validRowsToImport} ${
                validRowsToImport === 1 ? "vino" : "vinos"
              }. No cierres esta ventana ni recargues la pagina; puede tardar varios segundos segun la cantidad de filas.`}
              title="Importacion en curso"
            />
            <div className={styles.footer}>
              <SubmitButton
                disabled={!canImport}
                label="Confirmar importacion"
                loadingLabel={`Importando ${validRowsToImport} ${
                  validRowsToImport === 1 ? "vino" : "vinos"
                }...`}
              />
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}

function PendingNotice({ message, title }: { message: string; title: string }) {
  const { pending } = useFormStatus();

  if (!pending) {
    return null;
  }

  return (
    <div aria-live="polite" className={styles.pending} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      <div>
        <strong className={styles.pendingTitle}>{title}</strong>
        <p className={styles.pendingMessage}>{message}</p>
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "error";
  value: number;
}) {
  return (
    <div className={tone === "error" ? styles.summaryError : styles.summaryItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
