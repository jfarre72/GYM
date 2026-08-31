"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getRoutine,
  listRoutineExercises,
  addRoutineExercise,
  deleteRoutineExercise,
  updateRoutineExercise,
  swapRoutineExerciseOrder,
} from "@/lib/queries/routines";
import { listExercises } from "@/lib/queries/exercises";
import type {
  Routine,
  RoutineExerciseWithExercise,
  Exercise,
} from "@/lib/types";
import {
  Header,
  Card,
  Button,
  Field,
  inputClass,
  Loading,
  Empty,
  LinkButton,
} from "@/components/ui";
import { Modal } from "@/components/Modal";

export default function RoutineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [items, setItems] = useState<RoutineExerciseWithExercise[] | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  async function reload() {
    const [r, list] = await Promise.all([
      getRoutine(id),
      listRoutineExercises(id),
    ]);
    setRoutine(r);
    setItems(list);
  }
  useEffect(() => {
    reload();
    listExercises().then(setAllExercises);
  }, [id]);

  async function move(index: number, dir: -1 | 1) {
    if (!items) return;
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    await swapRoutineExerciseOrder(items[index], items[target]);
    await reload();
  }

  async function remove(re: RoutineExerciseWithExercise) {
    if (!confirm(`¿Quitar "${re.exercise.name}" de la rutina?`)) return;
    await deleteRoutineExercise(re.id);
    await reload();
  }

  if (routine === null || items === null) {
    return (
      <div>
        <Header title="Rutina" backHref="/routines" />
        <Loading />
      </div>
    );
  }

  return (
    <div>
      <Header title={routine.name} backHref="/routines" />
      <div className="p-4">
        {routine.description ? (
          <p className="mb-4 text-slate-500">{routine.description}</p>
        ) : null}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Ejercicios</h2>
          <Button
            onClick={() => setShowAdd(true)}
            className="!min-h-[40px] px-3"
          >
            + Agregar
          </Button>
        </div>

        {items.length === 0 ? (
          <Empty>Esta rutina no tiene ejercicios todavía.</Empty>
        ) : (
          <div className="space-y-3">
            {items.map((re, i) => (
              <Card key={re.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 disabled:opacity-30"
                    aria-label="Subir"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 disabled:opacity-30"
                    aria-label="Bajar"
                  >
                    ↓
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">
                    {i + 1}. {re.exercise.name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {formatTarget(re)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => remove(re)}
                  className="!min-h-[40px] px-2"
                >
                  🗑️
                </Button>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6">
          <LinkButton href="/start" variant="secondary" className="w-full">
            Empezar entrenamiento con esta rutina
          </LinkButton>
        </div>
      </div>

      {showAdd ? (
        <AddExerciseModal
          routineId={id}
          nextOrder={(items[items.length - 1]?.exercise_order ?? 0) + 1}
          exercises={allExercises}
          onClose={() => setShowAdd(false)}
          onAdded={async () => {
            setShowAdd(false);
            await reload();
          }}
        />
      ) : null}
    </div>
  );
}

function formatTarget(re: RoutineExerciseWithExercise): string {
  const parts: string[] = [];
  if (re.default_sets != null) parts.push(`${re.default_sets} series`);
  if (re.default_reps_min != null && re.default_reps_max != null)
    parts.push(`${re.default_reps_min}-${re.default_reps_max} reps`);
  else if (re.default_reps_min != null) parts.push(`${re.default_reps_min} reps`);
  return parts.join(" · ") || "Sin objetivo definido";
}

function AddExerciseModal({
  routineId,
  nextOrder,
  exercises,
  onClose,
  onAdded,
}: {
  routineId: string;
  nextOrder: number;
  exercises: Exercise[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? "");
  const [sets, setSets] = useState("3");
  const [repsMin, setRepsMin] = useState("8");
  const [repsMax, setRepsMax] = useState("12");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!exerciseId) return;
    setSaving(true);
    try {
      await addRoutineExercise({
        routine_id: routineId,
        exercise_id: exerciseId,
        exercise_order: nextOrder,
        default_sets: sets ? Number(sets) : null,
        default_reps_min: repsMin ? Number(repsMin) : null,
        default_reps_max: repsMax ? Number(repsMax) : null,
        default_weight: null,
        notes: null,
      });
      onAdded();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Agregar ejercicio" onClose={onClose}>
      {exercises.length === 0 ? (
        <Empty>
          No hay ejercicios. Creá alguno primero en la sección Ejercicios.
        </Empty>
      ) : (
        <div className="space-y-3">
          <Field label="Ejercicio">
            <select
              className={inputClass}
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                  {ex.muscle_group ? ` (${ex.muscle_group})` : ""}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Series">
              <input
                type="number"
                inputMode="numeric"
                className={inputClass}
                value={sets}
                onChange={(e) => setSets(e.target.value)}
              />
            </Field>
            <Field label="Reps mín">
              <input
                type="number"
                inputMode="numeric"
                className={inputClass}
                value={repsMin}
                onChange={(e) => setRepsMin(e.target.value)}
              />
            </Field>
            <Field label="Reps máx">
              <input
                type="number"
                inputMode="numeric"
                className={inputClass}
                value={repsMax}
                onChange={(e) => setRepsMax(e.target.value)}
              />
            </Field>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving} className="flex-1">
              Agregar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
