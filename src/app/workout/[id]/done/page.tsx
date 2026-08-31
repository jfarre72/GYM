"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getWorkout,
  listWorkoutExercises,
  listSetsForWorkout,
} from "@/lib/queries/workouts";
import type { Workout } from "@/lib/types";
import { Header, Card, LinkButton, Loading } from "@/components/ui";
import { formatDuration } from "@/lib/format";

export default function WorkoutDonePage() {
  const { id } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [setCount, setSetCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [w, wes, sets] = await Promise.all([
        getWorkout(id),
        listWorkoutExercises(id),
        listSetsForWorkout(id),
      ]);
      setWorkout(w);
      setExerciseCount(wes.length);
      setSetCount(sets.length);
      setLoading(false);
    })();
  }, [id]);

  if (loading || !workout) {
    return (
      <div>
        <Header title="Resumen" backHref="/" />
        <Loading />
      </div>
    );
  }

  return (
    <div>
      <Header title="Resumen" backHref="/" />
      <div className="p-4">
        <div className="mb-6 text-center">
          <div className="text-5xl">🎉</div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Entrenamiento terminado
          </h2>
        </div>

        <Card>
          <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
            <Stat value={String(exerciseCount)} label="Ejercicios" />
            <Stat value={String(setCount)} label="Series" />
            <Stat
              value={
                workout.finished_at
                  ? formatDuration(workout.started_at, workout.finished_at)
                  : "—"
              }
              label="Duración"
            />
          </div>
        </Card>

        <div className="mt-6 space-y-3">
          <LinkButton href={`/history/${id}`} variant="secondary" className="w-full">
            Ver detalle
          </LinkButton>
          <LinkButton href="/" className="w-full">
            Volver al inicio
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2">
      <div className="text-xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
