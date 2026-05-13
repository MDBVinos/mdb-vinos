"use client";

import { type ChangeEvent, type DragEvent, useActionState, useEffect, useRef, useState } from "react";
import type { ActionState, WineFormInitialData, WineFormOptions } from "@/lib/admin/types";
import { SubmitButton } from "./submit-button";
import styles from "./wine-form.module.css";

type WineFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  mode: "create" | "edit";
  options: WineFormOptions;
  initialData?: WineFormInitialData;
};

export function WineForm({ action, mode, options, initialData }: WineFormProps) {
  const [state, formAction] = useActionState(action, {});
  const [selectedWineryId, setSelectedWineryId] = useState(initialData?.winery_id ?? "");
  const [selectedImage, setSelectedImage] = useState<{ name: string; previewUrl: string; size: number } | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const availableWineLines = selectedWineryId
    ? options.wineLines.filter((line) => line.wineryId === selectedWineryId)
    : options.wineLines;

  useEffect(() => {
    return () => {
      if (selectedImage?.previewUrl) {
        URL.revokeObjectURL(selectedImage.previewUrl);
      }
    };
  }, [selectedImage]);

  function setImageFile(file: File | null) {
    if (selectedImage?.previewUrl) {
      URL.revokeObjectURL(selectedImage.previewUrl);
    }

    if (!file || !file.type.startsWith("image/")) {
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      setSelectedImage(null);
      return;
    }

    setSelectedImage({
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      size: file.size,
    });
  }

  function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    setImageFile(event.currentTarget.files?.[0] ?? null);
  }

  function onImageDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingImage(false);

    const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith("image/")) ?? null;
    if (!file || !imageInputRef.current || typeof DataTransfer === "undefined") {
      setImageFile(file);
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(file);
    imageInputRef.current.files = transfer.files;
    setImageFile(file);
  }

  function clearSelectedImage() {
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    setImageFile(null);
  }

  return (
    <form action={formAction} className={styles.form}>
      {state.error ? <p className="alert error">{state.error}</p> : null}

      {initialData ? (
        <>
          <input type="hidden" name="id" value={initialData.id} />
          <input type="hidden" name="current_image_url" value={initialData.image_url ?? ""} />
        </>
      ) : null}

      <section className={styles.section}>
        <h2>Datos principales</h2>
        <div className={styles.grid}>
          <div className="field">
            <label htmlFor="name">Nombre</label>
            <input id="name" name="name" defaultValue={initialData?.name ?? ""} required />
          </div>

          <div className="field">
            <label htmlFor="winery">Bodega</label>
            <input id="winery" name="winery" defaultValue={initialData?.winery ?? ""} />
          </div>

          <div className="field">
            <label htmlFor="price_unit">Precio unidad</label>
            <input
              id="price_unit"
              name="price_unit"
              type="number"
              min="0"
              step="0.01"
              defaultValue={initialData?.price_unit ?? ""}
            />
          </div>

          <div className="field">
            <label htmlFor="price_box">Precio caja</label>
            <input
              id="price_box"
              name="price_box"
              type="number"
              min="0"
              step="0.01"
              defaultValue={initialData?.price_box ?? ""}
            />
          </div>

          <div className="field">
            <label htmlFor="units_per_box">Unidades por caja</label>
            <input
              id="units_per_box"
              name="units_per_box"
              type="number"
              min="0"
              step="1"
              defaultValue={initialData?.units_per_box ?? ""}
            />
          </div>

          <label className={styles.checkbox}>
            <input name="featured" type="checkbox" defaultChecked={initialData?.featured ?? false} />
            Destacado
          </label>

          <label className={styles.checkbox}>
            <input name="active" type="checkbox" defaultChecked={initialData?.active ?? true} />
            Activo
          </label>
        </div>

        <div className="field">
          <label htmlFor="description">Descripcion</label>
          <textarea id="description" name="description" defaultValue={initialData?.description ?? ""} />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Imagen</h2>
        {selectedImage ? (
          <div className={styles.currentImage}>
            <img src={selectedImage.previewUrl} alt="" />
            <span>
              {selectedImage.name} · {Math.ceil(selectedImage.size / 1024)} KB
            </span>
          </div>
        ) : initialData?.image_url ? (
          <div className={styles.currentImage}>
            <img src={initialData.image_url} alt={initialData.name} />
            <span>Imagen actual</span>
          </div>
        ) : null}

        <label
          className={`${styles.dropzone} ${isDraggingImage ? styles.dropzoneActive : ""}`.trim()}
          htmlFor="image"
          onDragEnter={() => setIsDraggingImage(true)}
          onDragLeave={() => setIsDraggingImage(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onImageDrop}
        >
          <span className={styles.dropTitle}>Soltar imagen</span>
          <span className={styles.dropCopy}>o seleccionar archivo</span>
          <span className={styles.dropCopy}>Usá una imagen vertical de botella, con fondo limpio, para que entre completa en la tarjeta.</span>
          <input
            accept="image/*"
            className={styles.fileInput}
            id="image"
            name="image"
            onChange={onImageChange}
            ref={imageInputRef}
            type="file"
          />
        </label>

        {selectedImage ? (
          <div className={styles.imageActions}>
            <button className="secondary" onClick={clearSelectedImage} type="button">
              Quitar imagen
            </button>
          </div>
        ) : null}
      </section>

      <section className={styles.section}>
        <h2>Clasificacion</h2>
        <div className={styles.grid}>
          <div className="field">
            <label htmlFor="winery_id">Bodega normalizada</label>
            <select
              id="winery_id"
              name="winery_id"
              onChange={(event) => setSelectedWineryId(event.currentTarget.value)}
              value={selectedWineryId}
            >
              <option value="">Sin bodega</option>
              {options.wineries.map((winery) => (
                <option key={winery.id} value={winery.id}>
                  {winery.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="wine_line_id">Línea</label>
            <select id="wine_line_id" name="wine_line_id" defaultValue={initialData?.wine_line_id ?? ""}>
              <option value="">Sin línea</option>
              {availableWineLines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="varietal_id">Varietal</label>
            <select id="varietal_id" name="varietal_id" defaultValue={initialData?.varietal_id ?? ""}>
              <option value="">Sin varietal</option>
              {options.varietals.map((varietal) => (
                <option key={varietal.id} value={varietal.id}>
                  {varietal.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="wine_type_id">Tipo de vino</label>
            <select id="wine_type_id" name="wine_type_id" defaultValue={initialData?.wineTypeId ?? ""}>
              <option value="">Sin tipo</option>
              {options.wineTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className={styles.fieldset}>
          <legend>Perfiles</legend>
          <div className={styles.checkGrid}>
            {options.intensities.map((intensity) => (
              <label key={intensity.id} className={styles.checkbox}>
                <input
                  name="intensities"
                  type="checkbox"
                  value={intensity.id}
                  defaultChecked={initialData?.intensityIds.includes(intensity.id) ?? false}
                />
                {intensity.name}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend>Momentos</legend>
          <div className={styles.checkGrid}>
            {options.moments.map((moment) => (
              <label key={moment.id} className={styles.checkbox}>
                <input
                  name="moments"
                  type="checkbox"
                  value={moment.id}
                  defaultChecked={initialData?.momentIds.includes(moment.id) ?? false}
                />
                {moment.name}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <div className={styles.footer}>
        <SubmitButton
          label={mode === "create" ? "Crear vino" : "Guardar cambios"}
          loadingLabel={mode === "create" ? "Creando..." : "Guardando..."}
        />
      </div>
    </form>
  );
}
