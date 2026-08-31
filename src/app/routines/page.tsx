"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  type RoutineInput,
} from "@/lib/queries/routines";
import type { Routine } from "@/lib/types";
import {
  Header,
  Card,
  Button,
  Field,
  inputClass,
  Loading,
  Empty,
} from "@/components/ui";
import { Modal } from "@/components/Modal";

const EMPTY: RoutineInput = { name: "", description: "" };

export default function RoutinesPage() {
  const [items, setItems] = useState<Routine[] | null>(null);
  const [editing, setEditing] = useState<Routine | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RoutineInput>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function reload() {
    setItems(await listRoutines());
  }
  useEffect(() => {
    reload();
  }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  }
  function openEdit(r: Routine) {
    setEditing(r);
    setForm({ name: r.name, description: r.description ?? "" });
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload: RoutineInput = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
    };
    try {
      if (editing) await updateRoutine(editing.id, payload);
      else await createRoutine(payload);
      setShowForm(false);
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function remove(r: Routine) {
    if (!confirm(`¿Eliminar la rutina "${r.name}"?`)) return;
    await deleteRoutine(r.id);
    await reload();
  }

  return (
    <div>
      <Header
        title="Rutinas"
        backHref="/"
        right={
          <Button onClick={openNew} className="!min-h-[40px] px-3">
            + Nueva
          </Button>
        }
      />
      <div className="space-y-3 p-4">
        {items === null ? (
          <Loading />
        ) : items.length === 0 ? (
          <Empty>Todavía no hay rutinas.</Empty>
        ) : (
          items.map((r) => (
            <Card key={r.id} className="flex items-center justify-between gap-2">
              <Link href={`/routines/${r.id}`} className="min-w-0 flex-1">
                <div className="truncate font-semibold text-slate-900">
                  {r.name}
                </div>
                {r.description ? (
                  <div className="truncate text-sm text-slate-500">
                    {r.description}
                  </div>
                ) : null}
              </Link>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  onClick={() => openEdit(r)}
                  className="!min-h-[40px] px-3"
                >
                  ✏️
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => remove(r)}
                  className="!min-h-[40px] px-3"
                >
                  🗑️
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {showForm ? (
        <Modal
          title={editing ? "Editar rutina" : "Nueva rutina"}
          onClose={() => setShowForm(false)}
        >
          <div className="space-y-3">
            <Field label="Nombre">
              <input
                className={inputClass}
                value={form.name}
                autoFocus
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Descripción">
              <textarea
                className={inputClass}
                rows={2}
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </Field>
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={save}
                disabled={saving || !form.name.trim()}
                className="flex-1"
              >
                Guardar
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
