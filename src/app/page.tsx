"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listRoutines } from "@/lib/queries/routines";
import type { Routine } from "@/lib/types";
import { Card, LinkButton, Loading, Empty } from "@/components/ui";

export default function HomePage() {
  const [routines, setRoutines] = useState<Routine[] | null>(null);

  useEffect(() => {
    listRoutines().then(setRoutines).catch(() => setRoutines([]));
  }, []);

  return (
    <div className="px-4 pt-6">
      <h1 className="text-3xl font-bold text-slate-900">Gimnasio</h1>
      <p className="mt-1 text-slate-500">Registrá tus entrenamientos</p>

      <div className="mt-6">
        <LinkButton href="/start" className="w-full text-lg">
          + Empezar entrenamiento
        </LinkButton>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Rutinas</h2>
        {routines === null ? (
          <Loading />
        ) : routines.length === 0 ? (
          <Empty>
            Todavía no hay rutinas.{" "}
            <Link href="/routines" className="font-semibold text-brand">
              Crear una
            </Link>
          </Empty>
        ) : (
          <div className="space-y-3">
            {routines.map((r) => (
              <Link key={r.id} href={`/routines/${r.id}`}>
                <Card className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{r.name}</div>
                    {r.description ? (
                      <div className="text-sm text-slate-500">
                        {r.description}
                      </div>
                    ) : null}
                  </div>
                  <span className="text-slate-300">›</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <nav className="mt-8 grid grid-cols-3 gap-3">
        <NavTile href="/routines" label="Rutinas" icon="📋" />
        <NavTile href="/exercises" label="Ejercicios" icon="🏋️" />
        <NavTile href="/history" label="Historial" icon="🕑" />
      </nav>
    </div>
  );
}

function NavTile({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm hover:bg-slate-50"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </Link>
  );
}
