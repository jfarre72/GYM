"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getWorkout,
  listWorkoutExercises,
  listSetsForWorkout,
} from "@/lib/queries/workouts";
import type {
  Workout,
  WorkoutExerciseWithExercise,
  WorkoutSet,
} from "@/lib/types";
import { Header, Card, Loading } from "@/components/ui";
import { formatDate, formatDuration } from "@/lib/format";

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<WorkoutExerciseWithExercise[]>([]);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [w, wes, s] = await Promise.all([
        getWorkout(id),
        listWorkoutExercises(id),
        listSetsForWorkout(id),
      ]);
      setWorkout(w);
      setExercises(wes);
      setSets(s);
      setLoading(false);
    })();
  }, [id]);

  if (loading || !workout) {
    return (
      <div>
        <Header title="Entrenamiento" backHref="/history" />
        <Loading />
      </div>
    );
  }

  function setsFor(weId: string) {
    return sets
      .filter((s) => s.workout_exercise_id === weId)
      .sort((a, b) => a.set_number - b.set_number);
  }

  return (
    <div>
      <Header title="Entrenamiento" backHref="/history" />
      <div className="p-4">
        <Card className="mb-4">
          <div className="text-lg font-bold text-slate-900">
            {formatDate(workout.workout_date)}
          </div>
          <div className="text-sm text-slate-500">
            {exercises.length} ejercicios · {sets.length} series
            {workout.finished_at
              ? ` · ${formatDuration(workout.started_at, workout.finished_at)}`
              : " · en curso"}
          </div>
        </Card>

        <div className="space-y-3">
          {exercises.map((we) => {
            const exSets = setsFor(we.id);
            return (
              <Card key={we.id}>
                <div className="mb-2 font-semibold text-slate-900">
                  {we.exercise.name}
                </div>
                {exSets.length === 0 ? (
                  <div className="text-sm text-slate-400">Sin series</div>
                ) : (
                  <div className="space-y-1">
                    {exSets.map((s) => (
                      <div key={s.id} className="text-slate-700">
                        {s.weight != null ? `${s.weight} kg` : "—"} ×{" "}
                        {s.reps != null ? s.reps : "—"}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
