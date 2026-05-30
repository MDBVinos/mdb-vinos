"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  { label: "Hasta $20.000", value: 20000 },
  { label: "Hasta $40.000", value: 40000 },
  { label: "Hasta $60.000", value: 60000 },
  { label: "Hasta $80.000", value: 80000 },
  { label: "Hasta $100.000", value: 100000 },
  { label: "Sin filtro", value: 0 },
];

type SortOrder = "asc" | "desc";

export function RecommendationStepper({ initialMoment, moments, wineTypes, intensities }: RecommendationStepperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialBudget = Number(searchParams.get("budget") ?? 0);
  const initialStep = Number(searchParams.get("step") ?? (initialMoment ? 2 : 1));
  const [step, setStep] = useState(Number.isFinite(initialStep) ? Math.min(Math.max(initialStep, 1), 5) : 1);
  const [moment, setMoment] = useState(initialMoment ?? searchParams.get("moment") ?? "");
  const [budget, setBudget] = useState(Number.isFinite(initialBudget) ? initialBudget : 0);
  const [typeId, setTypeId] = useState(searchParams.get("typeId") ?? "");
  const [intensityId, setIntensityId] = useState(searchParams.get("intensityId") ?? "");
  const [order, setOrder] = useState<SortOrder>(searchParams.get("order") === "asc" ? "asc" : "desc");
  const [loading, setLoading] = useState(false);
  const [wines, setWines] = useState<PublicWine[] | null>(null);

  const discoverHref = useMemo(() => {
    const params = new URLSearchParams();
    if (moment) params.set("moment", moment);
    if (budget > 0) params.set("budget", String(budget));
    if (typeId) params.set("typeId", typeId);
    if (intensityId) params.set("intensityId", intensityId);
    params.set("order", order);
    params.set("step", String(step));
    return `${pathname}?${params.toString()}`;
  }, [budget, intensityId, moment, order, pathname, step, typeId]);

  const syncUrl = useCallback(
    (next: {
      budget?: number;
      intensityId?: string;
      moment?: string;
      order?: SortOrder;
      step?: number;
      typeId?: string;
    }) => {
      const nextBudget = next.budget ?? budget;
      const nextIntensityId = next.intensityId ?? intensityId;
      const nextMoment = next.moment ?? moment;
      const nextOrder = next.order ?? order;
      const nextStep = next.step ?? step;
      const nextTypeId = next.typeId ?? typeId;
      const params = new URLSearchParams();

      if (nextMoment) params.set("moment", nextMoment);
      if (nextBudget > 0) params.set("budget", String(nextBudget));
      if (nextTypeId) params.set("typeId", nextTypeId);
      if (nextIntensityId) params.set("intensityId", nextIntensityId);
      params.set("order", nextOrder);
      params.set("step", String(nextStep));

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [budget, intensityId, moment, order, pathname, router, step, typeId],
  );

  const fetchRecommendations = useCallback(async () => {
    if (!moment) {
      setWines(null);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({ moment });

    if (budget > 0) params.set("budget", String(budget));
    if (typeId) params.set("typeId", typeId);
    if (intensityId) params.set("intensityId", intensityId);
    params.set("order", order);

    try {
      const response = await fetch(`/api/recommendations?${params.toString()}`);
      const data = (await response.json()) as { wines: PublicWine[] };
      setWines(data.wines);
    } catch {
      setWines([]);
    }

    setLoading(false);
  }, [budget, intensityId, moment, order, typeId]);

  useEffect(() => {
    void fetchRecommendations();
  }, [fetchRecommendations]);

  function updateState(next: {
    budget?: number;
    intensityId?: string;
    moment?: string;
    order?: SortOrder;
    step?: number;
    typeId?: string;
  }) {
    if (next.moment !== undefined) setMoment(next.moment);
    if (next.budget !== undefined) setBudget(next.budget);
    if (next.typeId !== undefined) setTypeId(next.typeId);
    if (next.intensityId !== undefined) setIntensityId(next.intensityId);
    if (next.order !== undefined) setOrder(next.order);
    if (next.step !== undefined) setStep(next.step);
    syncUrl(next);
  }

  function reset() {
    setStep(1);
    setMoment("");
    setBudget(0);
    setTypeId("");
    setIntensityId("");
    setOrder("desc");
    setWines(null);
    router.replace(pathname, { scroll: false });
  }

  const preview = moment ? (
    <section className={styles.preview} aria-live="polite">
      <div className={styles.previewHeader}>
        <div>
          <p className={styles.copy}>{loading ? "Buscando opciones..." : `${wines?.length ?? 0} vinos encontrados`}</p>
        </div>
        <div className={styles.sort}>
          <span>Orden</span>
          <button
            className={order === "desc" ? styles.selected : "secondary"}
            onClick={() => updateState({ order: "desc" })}
            type="button"
          >
            Mayor precio
          </button>
          <button
            className={order === "asc" ? styles.selected : "secondary"}
            onClick={() => updateState({ order: "asc" })}
            type="button"
          >
            Menor precio
          </button>
        </div>
      </div>
      {!loading && wines?.length === 0 ? (
        <p className={styles.copy}>No encontramos una coincidencia exacta. Probá con menos filtros.</p>
      ) : null}
      {!loading && wines && wines.length > 0 ? (
        <div className={styles.grid}>
          {wines.map((wine) => (
            <WineCard
              detailHref={`/wine/${wine.id}?from=${encodeURIComponent(discoverHref)}`}
              key={wine.id}
              note={moment}
              wine={wine}
            />
          ))}
        </div>
      ) : null}
    </section>
  ) : null;

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
                  updateState({ moment: item.name, step: 2 });
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
          <div className={styles.stepHeader}>
            <button className="secondary" onClick={() => updateState({ step: 1 })} type="button">
              Volver
            </button>
            <h2>¿Qué presupuesto por unidad tenés?</h2>
          </div>
          <div className={styles.options}>
            {budgets.map((item) => (
              <button
                className={budget === item.value ? styles.selected : "secondary"}
                key={item.label}
                onClick={() => {
                  updateState({ budget: item.value, step: 3 });
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
          <div className={styles.stepHeader}>
            <button className="secondary" onClick={() => updateState({ step: 2 })} type="button">
              Volver
            </button>
            <h2>¿Preferís algún tipo?</h2>
          </div>
          <div className={styles.options}>
            <button
              className={!typeId ? styles.selected : "secondary"}
              onClick={() => {
                updateState({ step: 4, typeId: "" });
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
                  updateState({ step: 4, typeId: type.id });
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
          <div className={styles.stepHeader}>
            <button className="secondary" onClick={() => updateState({ step: 3 })} type="button">
              Volver
            </button>
            <h2>¿Qué intensidad?</h2>
          </div>
          <div className={styles.options}>
            <button
              className={!intensityId ? styles.selected : "secondary"}
              onClick={() => {
                updateState({ intensityId: "", step: 5 });
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
                  updateState({ intensityId: intensity.id, step: 5 });
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
            <div className={styles.resultActions}>
              <button className="secondary" onClick={() => updateState({ step: 4 })} type="button">
                Volver
              </button>
              <button className="secondary" onClick={reset} type="button">
                Empezar de nuevo
              </button>
            </div>
          </div>

          {preview}
        </section>
      ) : null}

      {step !== 5 ? preview : null}
    </div>
  );
}
