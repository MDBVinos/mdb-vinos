"use client";

import { type ChangeEvent, type DragEvent, useActionState, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  confirmWineImportAction,
  previewWineImportAction,
  uploadWineImagesAction,
  type WineImportActionState,
  type WineImageImportActionState,
} from "@/lib/admin/actions";
import type { WineImageImportOption } from "@/lib/admin/image-import";
import { SubmitButton } from "./submit-button";
import styles from "./import-form.module.css";

const initialState: WineImportActionState = {};
const imageInitialState: WineImageImportActionState = {};

type ImportFormProps = {
  imageWines: WineImageImportOption[];
};

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_MIN_WIDTH = 800;
const IMAGE_MIN_HEIGHT = 800;
const IMAGE_MIN_RATIO = 0.9;
const IMAGE_MAX_RATIO = 1.1;

type ImageRow = {
  error: string | null;
  file: File;
  height: number;
  id: string;
  previewUrl: string;
  replaceExisting: boolean;
  width: number;
  wineId: string;
};

export function ImportForm({ imageWines }: ImportFormProps) {
  const [previewState, previewAction] = useActionState(previewWineImportAction, initialState);
  const [confirmState, confirmAction] = useActionState(confirmWineImportAction, initialState);
  const [imageState, imageAction] = useActionState(uploadWineImagesAction, imageInitialState);
  const [imageRows, setImageRows] = useState<ImageRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const wineById = useMemo(() => new Map(imageWines.map((wine) => [wine.id, wine])), [imageWines]);
  const error = confirmState.error ?? previewState.error;
  const preview = previewState.preview;
  const canImport = Boolean(previewState.payload && preview && preview.summary.errors === 0);
  const validRowsToImport = preview ? preview.summary.creates + preview.summary.updates : 0;

  function syncImageInput(nextRows: ImageRow[]) {
    setImageRows(nextRows);

    if (!imageInputRef.current || typeof DataTransfer === "undefined") {
      return;
    }

    const transfer = new DataTransfer();
    nextRows.forEach((row) => transfer.items.add(row.file));
    imageInputRef.current.files = transfer.files;
  }

  async function addImageFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const nextRows = await Promise.all(
      Array.from(files).map(async (file, index) => {
        const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
        const metadata = previewUrl ? await readImageMetadata(previewUrl) : { height: 0, width: 0 };

        return {
          error: validateImageFile(file, metadata.width, metadata.height),
          file,
          height: metadata.height,
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${file.name}-${file.size}-${file.lastModified}-${index}`,
          previewUrl,
          replaceExisting: false,
          width: metadata.width,
          wineId: "",
        };
      }),
    );

    syncImageInput([...imageRows, ...nextRows]);
  }

  function onImageInputChange(event: ChangeEvent<HTMLInputElement>) {
    void addImageFiles(event.currentTarget.files);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    void addImageFiles(event.dataTransfer.files);
  }

  function removeImageRow(id: string) {
    const row = imageRows.find((item) => item.id === id);
    if (row?.previewUrl) {
      URL.revokeObjectURL(row.previewUrl);
    }
    syncImageInput(imageRows.filter((item) => item.id !== id));
  }

  function updateImageRow(id: string, patch: Partial<ImageRow>) {
    syncImageInput(
      imageRows.map((row) => {
        if (row.id !== id) {
          return row;
        }

        const nextRow = { ...row, ...patch };
        const selectedWine = wineById.get(nextRow.wineId);
        return selectedWine?.imageUrl ? nextRow : { ...nextRow, replaceExisting: false };
      }),
    );
  }

  return (
    <div className={styles.wrap}>
      {error ? (
        <p aria-live="polite" className="alert error" role="alert">
          {error}
        </p>
      ) : null}

      <form action={previewAction} className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Archivo Excel</h3>
            <p>Subi tu base o descargá una plantilla con las columnas correctas.</p>
          </div>
          <a className="button secondary" href="/admin/import/template">
            Descargar ejemplo
          </a>
        </div>
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
            <SummaryItem label="Omitidos" tone={preview.summary.skips > 0 ? "warning" : "default"} value={preview.summary.skips} />
            <SummaryItem label="Avisos" tone={preview.summary.warnings > 0 ? "warning" : "default"} value={preview.summary.warnings} />
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
                  <th>Línea</th>
                  <th>Varietal</th>
                  <th>Tipo</th>
                  <th>Perfil</th>
                  <th>Momentos</th>
                  <th>Activo</th>
                  <th>Descripcion</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.line}>
                    <td>{row.line}</td>
                    <td>
                      {row.action === "create" ? "Crear" : row.action === "update" ? "Actualizar" : "Omitir"}
                    </td>
                    <td>{row.name || "-"}</td>
                    <td>{row.winery ?? "-"}</td>
                    <td>{row.wineryLineName ?? (row.action === "update" ? "Preserva" : "-")}</td>
                    <td>{row.varietalName ?? (row.action === "update" ? "Preserva" : "-")}</td>
                    <td>{row.typeName ?? (row.action === "update" ? "Preserva" : "-")}</td>
                    <td>
                      {row.intensityNames.length > 0
                        ? row.intensityNames.join(", ")
                        : row.action === "update"
                          ? "Preserva"
                          : "-"}
                    </td>
                    <td>
                      {row.momentNames.length > 0
                        ? row.momentNames.join(", ")
                        : row.action === "update"
                          ? "Preserva"
                          : "-"}
                    </td>
                    <td>{row.hasExplicitActive ? (row.active ? "Si" : "No") : row.action === "update" ? "Preserva" : "Si"}</td>
                    <td>{row.description ? "Si" : row.action === "update" ? "Preserva" : "-"}</td>
                    <td>
                      {row.errors.length > 0 ? (
                        <span className={styles.error}>{row.errors.join(" ")}</span>
                      ) : row.warnings.length > 0 ? (
                        <span className={styles.warning}>{row.warnings.join(" ")}</span>
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

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Imagenes</h3>
            <p>Asignacion manual para cargar varias fotos de productos.</p>
          </div>
        </div>

        {imageState.error ? (
          <p aria-live="polite" className="alert error" role="alert">
            {imageState.error}
          </p>
        ) : null}

        <form action={imageAction} className={styles.imageForm}>
          <label
            className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`.trim()}
            htmlFor="images"
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
          >
            <span className={styles.dropTitle}>Soltar imagenes</span>
            <span className={styles.dropCopy}>o seleccionar archivos</span>
            <span className={styles.dropCopy}>
              Imagenes cuadradas 800x800 px, fondo transparente o limpio, botella centrada, maximo 5 MB.
            </span>
            <input
              accept="image/*"
              className={styles.fileInput}
              id="images"
              multiple
              name="images"
              onChange={onImageInputChange}
              ref={imageInputRef}
              type="file"
            />
          </label>

          {imageRows.length > 0 ? (
            <div className={styles.imageRows}>
              {imageRows.map((row, index) => {
                const selectedWine = wineById.get(row.wineId);
                return (
                  <div className={styles.imageRow} key={row.id}>
                    <div className={styles.thumb}>
                      {row.previewUrl ? <img src={row.previewUrl} alt="" /> : <span>IMG</span>}
                    </div>
                    <div className={styles.imageMeta}>
                      <strong>{row.file.name}</strong>
                      <span>
                        {row.width}x{row.height}px · {Math.ceil(row.file.size / 1024)} KB
                      </span>
                      {row.error ? <span className={styles.imageError}>{row.error}</span> : null}
                    </div>
                    <div className="field">
                      <label htmlFor={`wine-image-${row.id}`}>Vino</label>
                      <select
                        id={`wine-image-${row.id}`}
                        name="wine_ids"
                        onChange={(event) => updateImageRow(row.id, { wineId: event.currentTarget.value })}
                        required
                        value={row.wineId}
                      >
                        <option value="">Elegir vino</option>
                        {imageWines.map((wine) => (
                          <option key={wine.id} value={wine.id}>
                            {wine.name}
                            {wine.imageUrl ? " (con imagen)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input name="replace_existing" type="hidden" value={String(row.replaceExisting)} />
                    <div className={styles.replaceCell}>
                      {selectedWine?.imageUrl ? (
                        <label className={styles.checkbox}>
                          <input
                            checked={row.replaceExisting}
                            onChange={(event) =>
                              updateImageRow(row.id, { replaceExisting: event.currentTarget.checked })
                            }
                            type="checkbox"
                          />
                          Reemplazar actual
                        </label>
                      ) : (
                        <span>{row.wineId ? "Sin imagen actual" : "Pendiente"}</span>
                      )}
                    </div>
                    <button
                      className={`secondary ${styles.removeButton}`}
                      onClick={() => removeImageRow(row.id)}
                      type="button"
                    >
                      Quitar
                    </button>
                    <span className={styles.rowNumber}>{index + 1}</span>
                  </div>
                );
              })}
            </div>
          ) : null}

          <PendingNotice
            message={`Subiendo ${imageRows.length} ${imageRows.length === 1 ? "imagen" : "imagenes"}.`}
            title="Subida en curso"
          />

          <div className={styles.footer}>
            <SubmitButton
              disabled={imageRows.length === 0 || imageRows.some((row) => row.error)}
              label="Subir imagenes"
              loadingLabel="Subiendo..."
            />
          </div>
        </form>
      </section>
    </div>
  );
}

function readImageMetadata(src: string) {
  return new Promise<{ height: number; width: number }>((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ height: image.naturalHeight, width: image.naturalWidth });
    image.onerror = () => resolve({ height: 0, width: 0 });
    image.src = src;
  });
}

function validateImageFile(file: File, width: number, height: number) {
  if (file.size > IMAGE_MAX_BYTES) {
    return "Supera los 5 MB. Usá una version mas liviana.";
  }

  if (width < IMAGE_MIN_WIDTH || height < IMAGE_MIN_HEIGHT) {
    return "Minimo 800x800 px.";
  }

  const ratio = width / height;
  if (ratio < IMAGE_MIN_RATIO || ratio > IMAGE_MAX_RATIO) {
    return "Debe ser cuadrada tipo 800x800 px.";
  }

  return null;
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
  tone?: "default" | "error" | "warning";
  value: number;
}) {
  const className =
    tone === "error" ? styles.summaryError : tone === "warning" ? styles.summaryWarning : styles.summaryItem;

  return (
    <div className={className}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
