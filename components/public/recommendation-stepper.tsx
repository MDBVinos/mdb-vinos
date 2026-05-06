"use client";

import { useState } from "react";
import type { PublicIntensity, PublicMoment, PublicWine, PublicWineType } from "@/lib/public/types";
import { WineCard } from "./wine-card";
import styles from "./recommendation-stepper.module.css";

type RecommendationStepperProps = {
  initialMoment?: string;
  moments: PublicMoment[];
  wineTypes: PublicWineType[];
  intensities: PublicIntensity[];
};

const budgets = [
  { label: "Hasta $10.000", value: 10000 },
  { label: "Hasta $20.000", value: 20000 },
  { label: "Hasta $35.000", value: 35000 },
  { label: "Sin filtro", value: 0 },
];

export function RecommendationStepper({ initialMoment, moments, wineTypes, intensities }: RecommendationStepperProps) {
  const [step, setStep] = useState(initialMoment ? 2 : 1);
  const [moment, setMoment] = useState(initialMoment ?? "");
  const [budget, setBudget] = useState(0);
  const [typeId, setTypeId] = useState("");
  const [intensityId, setIntensityId] = useState("");
  const [loading, setLoading] = useState(false);
  const [wines, setWines] = useState<PublicWine[] | null>(null);

  async function recommend(nextIntensityId = intensityId) {
    setLoading(true);
    const params = new URLSearchParams({ moment });

    if (budget > 0) params.set("budget", String(budget));
    if (typeId) params.set("typeId", typeId);
    if (nextIntensityId) params.set("intensityId", nextIntensityId);

    try {
      const response = await fetch(`/api/recommendations?${params.toString()}`);
      const data = (await response.json()) as { wines: PublicWine[] };
      setWines(data.wines);
    } catch {
      setWines([]);
    }

    setLoading(false);
    setStep(5);
  }

  return (
    <div className={styles.box}>
      <div className={styles.progress}>Paso {Math.min(step, 4)} de 4</div>

      {step === 1 ? (
        <section className={styles.step}>
          <h2>¿Para qué ocasión es?</h2>
          <div className={styles.options}>
            {moments.map((item) => (
              <button
                className={moment === item.name ? styles.selected : "secondary"}
                key={item.id}
                onClick={() => {
                  setMoment(item.name);
                  setStep(2);
                }}
                type="button"
              >
                {item.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className={styles.step}>
          <h2>¿Qué presupuesto tenés?</h2>
          <div className={styles.options}>
            {budgets.map((item) => (
              <button
                className={budget === item.value ? styles.selected : "secondary"}
                key={item.label}
                onClick={() => {
                  setBudget(item.value);
                  setStep(3);
                }}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className={styles.step}>
          <h2>¿Preferís algún tipo?</h2>
          <div className={styles.options}>
            <button
              className={!typeId ? styles.selected : "secondary"}
              onClick={() => {
                setTypeId("");
                setStep(4);
              }}
              type="button"
            >
              Me da igual
            </button>
            {wineTypes.map((type) => (
              <button
                className={typeId === type.id ? styles.selected : "secondary"}
                key={type.id}
                onClick={() => {
                  setTypeId(type.id);
                  setStep(4);
                }}
                type="button"
              >
                {type.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className={styles.step}>
          <h2>¿Qué intensidad?</h2>
          <div className={styles.options}>
            <button
              className={!intensityId ? styles.selected : "secondary"}
              onClick={() => {
                setIntensityId("");
                void recommend("");
              }}
              type="button"
            >
              Me da igual
            </button>
            {intensities.map((intensity) => (
              <button
                className={intensityId === intensity.id ? styles.selected : "secondary"}
                key={intensity.id}
                onClick={() => {
                  setIntensityId(intensity.id);
                  void recommend(intensity.id);
                }}
                type="button"
              >
                {intensity.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 5 ? (
        <section className={styles.step}>
          <div className={styles.resultHeader}>
            <h2>Estos vinos van perfecto</h2>
            <button className="secondary" onClick={() => setStep(1)} type="button">
              Empezar de nuevo
            </button>
          </div>

          {loading ? <p className={styles.copy}>Buscando opciones para vos...</p> : null}
          {!loading && wines?.length === 0 ? (
            <p className={styles.copy}>No encontramos una coincidencia exacta. Probá con menos filtros.</p>
          ) : null}
          {!loading && wines && wines.length > 0 ? (
            <div className={styles.grid}>
              {wines.map((wine) => (
                <WineCard key={wine.id} note={`Ideal para ${moment.toLowerCase()}`} wine={wine} />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
