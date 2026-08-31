"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listRoutines } from "@/lib/queries/routines";
import { startWorkout } from "@/lib/queries/workouts";
import type { Routine } from "@/lib/types";
import { Header, Card, Button, Loading, Empty } from "@/components/ui";
import { formatDate } from "@/lib/format";

export default function StartPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[] | null>(null);
  const [selected, setSelected] = useState<Routine | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    listRoutines().then(setRoutines);
  }, []);

  async function begin() {
    if (!selected) return;
    setStarting(true);
    try {
      const workout = await startWorkout(selected.id);
      router.push(`/workout/${workout.id}`);
    } catch (e) {
      setStarting(false);
      alert("No se pudo iniciar el entrenamiento.");
    }
  }

  return (
    <div>
      <Header title="Empezar entrenamiento" backHref="/" />
      <div className="p-4">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          ¿Qué rutina vas a hacer hoy?
        </h2>

        {routines === null ? (
          <Loading />
        ) : routines.length === 0 ? (
          <Empty>No hay rutinas. Creá una en la sección Rutinas.</Empty>
        ) : (
          <div className="space-y-3">
            {routines.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="w-full text-left"
              >
                <Card
                  className={
                    selected?.id === r.id
                      ? "border-brand ring-2 ring-brand/30"
                      : ""
                  }
                >
                  <div className="font-semibold text-slate-900">{r.name}</div>
                  {r.description ? (
                    <div className="text-sm text-slate-500">
                      {r.description}
                    </div>
                  ) : null}
                </Card>
              </button>
            ))}
          </div>
        )}

        {selected ? (
          <div className="mt-8">
            <Card className="text-center">
              <div className="text-xl font-bold text-slate-900">
                {selected.name}
              </div>
              <div className="mt-1 text-slate-500">
                {formatDate(new Date())}
              </div>
            </Card>
            <Button
              onClick={begin}
              disabled={starting}
              className="mt-4 w-full text-lg"
            >
              {starting ? "Iniciando…" : "COMENZAR ENTRENAMIENTO"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
