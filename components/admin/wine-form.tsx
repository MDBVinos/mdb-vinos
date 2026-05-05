"use client";

import { useActionState } from "react";
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
        {initialData?.image_url ? (
          <div className={styles.currentImage}>
            <img src={initialData.image_url} alt={initialData.name} />
            <span>Imagen actual</span>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="image">Subir imagen</label>
          <input id="image" name="image" type="file" accept="image/*" />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Clasificacion</h2>
        <div className={styles.grid}>
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

          <div className="field">
            <label htmlFor="intensity_id">Intensidad</label>
            <select id="intensity_id" name="intensity_id" defaultValue={initialData?.intensityId ?? ""}>
              <option value="">Sin intensidad</option>
              {options.intensities.map((intensity) => (
                <option key={intensity.id} value={intensity.id}>
                  {intensity.name}
                </option>
              ))}
            </select>
          </div>
        </div>

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
