"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listWorkoutHistory, type WorkoutSummary } from "@/lib/queries/workouts";
import { Header, Card, Loading, Empty } from "@/components/ui";
import { formatDate } from "@/lib/format";

export default function HistoryPage() {
  const [items, setItems] = useState<WorkoutSummary[] | null>(null);

  useEffect(() => {
    listWorkoutHistory().then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <div>
      <Header title="Historial" backHref="/" />
      <div className="space-y-3 p-4">
        {items === null ? (
          <Loading />
        ) : items.length === 0 ? (
          <Empty>Todavía no hay entrenamientos registrados.</Empty>
        ) : (
          items.map(({ workout, routineName, exerciseCount, setCount }) => (
            <Link key={workout.id} href={`/history/${workout.id}`}>
              <Card className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">
                    {formatDate(workout.workout_date)}
                  </div>
                  <div className="text-sm text-slate-600">
                    {routineName ?? "Entrenamiento"}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    {exerciseCount} ejercicios · {setCount} series
                    {workout.status === "in_progress" ? " · en curso" : ""}
                  </div>
                </div>
                <span className="text-slate-300">›</span>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
