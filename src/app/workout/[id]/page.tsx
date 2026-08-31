"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getWorkout,
  listWorkoutExercises,
  listSetsForWorkout,
  setWorkoutExerciseCompleted,
  addSet,
  updateSet,
  deleteSet,
  applyWeightToExercise,
  finishWorkout,
} from "@/lib/queries/workouts";
import { listRoutineExercises } from "@/lib/queries/routines";
import type {
  Workout,
  WorkoutExerciseWithExercise,
  WorkoutSet,
  RoutineExerciseWithExercise,
} from "@/lib/types";
import { Header, Button, Loading } from "@/components/ui";
import { formatDate } from "@/lib/format";

export default function WorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<WorkoutExerciseWithExercise[]>([]);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [targets, setTargets] = useState<
    Record<string, RoutineExerciseWithExercise>
  >({});
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    (async () => {
      const w = await getWorkout(id);
      setWorkout(w);
      const wes = await listWorkoutExercises(id);
      setExercises(wes);

      // Objetivos (series/reps) tomados de la rutina para guía visual.
      const targetMap: Record<string, RoutineExerciseWithExercise> = {};
      if (w?.routine_id) {
        const re = await listRoutineExercises(w.routine_id);
        for (const r of re) targetMap[r.exercise_id] = r;
      }
      setTargets(targetMap);

      // Asegurar que cada ejercicio tenga sus series iniciales creadas.
      let allSets = await listSetsForWorkout(id);
      for (const we of wes) {
        const existing = allSets.filter((s) => s.workout_exercise_id === we.id);
        if (existing.length === 0) {
          const defaultSets = targetMap[we.exercise_id]?.default_sets ?? 3;
          for (let n = 1; n <= defaultSets; n++) {
            await addSet(we.id, n, null);
          }
        }
      }
      allSets = await listSetsForWorkout(id);
      setSets(allSets);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const doneCount = exercises.filter((e) => e.completed).length;

  function setsFor(weId: string): WorkoutSet[] {
    return sets
      .filter((s) => s.workout_exercise_id === weId)
      .sort((a, b) => a.set_number - b.set_number);
  }

  function patchLocalSet(setId: string, patch: Partial<WorkoutSet>) {
    setSets((prev) =>
      prev.map((s) => (s.id === setId ? { ...s, ...patch } : s))
    );
  }

  async function onChangeSet(
    setId: string,
    patch: Partial<Pick<WorkoutSet, "reps" | "weight" | "completed">>
  ) {
    patchLocalSet(setId, patch);
    await updateSet(setId, patch);
  }

  async function onAddSet(we: WorkoutExerciseWithExercise) {
    const current = setsFor(we.id);
    const nextNumber = (current[current.length - 1]?.set_number ?? 0) + 1;
    // Sugerir el peso de la última serie para cargar más rápido.
    const lastWeight = current[current.length - 1]?.weight ?? null;
    const created = await addSet(we.id, nextNumber, lastWeight);
    setSets((prev) => [...prev, created]);
  }

  async function onDeleteSet(setId: string) {
    await deleteSet(setId);
    setSets((prev) => prev.filter((s) => s.id !== setId));
  }

  async function onApplySameWeight(we: WorkoutExerciseWithExercise) {
    const current = setsFor(we.id);
    const first = current.find((s) => s.weight != null);
    const value = first?.weight;
    const input = prompt(
      "Aplicar el mismo peso (kg) a todas las series:",
      value != null ? String(value) : ""
    );
    if (input == null) return;
    const weight = Number(input.replace(",", "."));
    if (Number.isNaN(weight)) return;
    await applyWeightToExercise(we.id, weight);
    setSets((prev) =>
      prev.map((s) =>
        s.workout_exercise_id === we.id ? { ...s, weight } : s
      )
    );
  }

  async function onToggleExercise(
    we: WorkoutExerciseWithExercise,
    completed: boolean
  ) {
    setExercises((prev) =>
      prev.map((e) => (e.id === we.id ? { ...e, completed } : e))
    );
    await setWorkoutExerciseCompleted(we.id, completed);
    // Al completar, colapsar la tarjeta para avanzar al siguiente.
    if (completed) setCollapsed((c) => ({ ...c, [we.id]: true }));
  }

  async function onFinish() {
    if (!confirm("¿Finalizar el entrenamiento?")) return;
    setFinishing(true);
    try {
      await finishWorkout(id);
      router.replace(`/workout/${id}/done`);
    } catch {
      setFinishing(false);
      alert("No se pudo finalizar.");
    }
  }

  if (loading || !workout) {
    return (
      <div>
        <Header title="Entrenamiento" backHref="/" />
        <Loading />
      </div>
    );
  }

  return (
    <div>
      <Header title="Entrenamiento" backHref="/" />
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="text-sm text-slate-500">
          {formatDate(workout.workout_date)}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="font-semibold text-slate-800">Progreso</span>
          <span className="font-semibold text-brand">
            {doneCount} / {exercises.length} ejercicios
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{
              width: `${
                exercises.length
                  ? (doneCount / exercises.length) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-3 p-4">
        {exercises.map((we, i) => {
          const target = targets[we.exercise_id];
          const exSets = setsFor(we.id);
          const isCollapsed = collapsed[we.id];
          return (
            <div
              key={we.id}
              className={`rounded-2xl border bg-white shadow-sm ${
                we.completed
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2 p-4">
                <div className="min-w-0">
                  <div className="text-base font-bold uppercase text-slate-900">
                    {i + 1}. {we.exercise.name}
                  </div>
                  {target ? (
                    <div className="mt-0.5 text-sm text-slate-500">
                      Objetivo: {formatTarget(target)}
                    </div>
                  ) : null}
                </div>
                <button
                  onClick={() =>
                    setCollapsed((c) => ({ ...c, [we.id]: !c[we.id] }))
                  }
                  className="shrink-0 rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100"
                  aria-label={isCollapsed ? "Expandir" : "Colapsar"}
                >
                  {isCollapsed ? "▾" : "▴"}
                </button>
              </div>

              {!isCollapsed ? (
                <div className="px-4 pb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="grid flex-1 grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 text-xs font-medium uppercase text-slate-400">
                      <span>Serie</span>
                      <span>Kg</span>
                      <span>Reps</span>
                      <span className="text-center">✓</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {exSets.map((s) => (
                      <div
                        key={s.id}
                        className="grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2"
                      >
                        <span className="text-center font-semibold text-slate-500">
                          {s.set_number}
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="kg"
                          className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-2 text-center text-lg font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                          value={s.weight ?? ""}
                          onChange={(e) =>
                            patchLocalSet(s.id, {
                              weight:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                          onBlur={(e) =>
                            onChangeSet(s.id, {
                              weight:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="reps"
                          className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-2 text-center text-lg font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                          value={s.reps ?? ""}
                          onChange={(e) =>
                            patchLocalSet(s.id, {
                              reps:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                          onBlur={(e) =>
                            onChangeSet(s.id, {
                              reps:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                        />
                        <button
                          onClick={() =>
                            onChangeSet(s.id, { completed: !s.completed })
                          }
                          className={`flex h-12 w-full items-center justify-center rounded-xl border text-lg ${
                            s.completed
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 bg-white text-slate-300"
                          }`}
                          aria-label="Serie completada"
                        >
                          ✓
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => onAddSet(we)}
                      className="!min-h-[44px] flex-1 px-3 text-sm"
                    >
                      + Agregar serie
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => onApplySameWeight(we)}
                      className="!min-h-[44px] flex-1 px-3 text-sm"
                    >
                      Usar mismo peso
                    </Button>
                    {exSets.length > 0 ? (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          onDeleteSet(exSets[exSets.length - 1].id)
                        }
                        className="!min-h-[44px] px-3 text-sm"
                      >
                        − Quitar
                      </Button>
                    ) : null}
                  </div>

                  <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl bg-slate-50 p-3">
                    <input
                      type="checkbox"
                      checked={we.completed}
                      onChange={(e) => onToggleExercise(we, e.target.checked)}
                      className="h-5 w-5 accent-emerald-500"
                    />
                    <span className="font-medium text-slate-700">
                      Ejercicio terminado
                    </span>
                  </label>
                </div>
              ) : null}
            </div>
          );
        })}

        <Button
          onClick={onFinish}
          disabled={finishing}
          className="mt-4 w-full text-lg"
        >
          {finishing ? "Finalizando…" : "FINALIZAR ENTRENAMIENTO"}
        </Button>
      </div>
    </div>
  );
}

function formatTarget(re: RoutineExerciseWithExercise): string {
  const parts: string[] = [];
  if (re.default_sets != null) parts.push(`${re.default_sets} series`);
  if (re.default_reps_min != null && re.default_reps_max != null)
    parts.push(`${re.default_reps_min}-${re.default_reps_max} reps`);
  return parts.join(" · ") || "—";
}
