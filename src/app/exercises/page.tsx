"use client";

import { useEffect, useState } from "react";
import {
  listExercises,
  createExercise,
  updateExercise,
  deleteExercise,
  type ExerciseInput,
} from "@/lib/queries/exercises";
import type { Exercise } from "@/lib/types";
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

const EMPTY: ExerciseInput = { name: "", muscle_group: "", notes: "" };

export default function ExercisesPage() {
  const [items, setItems] = useState<Exercise[] | null>(null);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExerciseInput>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function reload() {
    setItems(await listExercises());
  }
  useEffect(() => {
    reload();
  }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  }
  function openEdit(ex: Exercise) {
    setEditing(ex);
    setForm({
      name: ex.name,
      muscle_group: ex.muscle_group ?? "",
      notes: ex.notes ?? "",
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload: ExerciseInput = {
      name: form.name.trim(),
      muscle_group: form.muscle_group?.trim() || null,
      notes: form.notes?.trim() || null,
    };
    try {
      if (editing) await updateExercise(editing.id, payload);
      else await createExercise(payload);
      setShowForm(false);
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function remove(ex: Exercise) {
    if (!confirm(`¿Eliminar "${ex.name}"?`)) return;
    await deleteExercise(ex.id);
    await reload();
  }

  return (
    <div>
      <Header
        title="Ejercicios"
        backHref="/"
        right={
          <Button onClick={openNew} className="!min-h-[40px] px-3">
            + Nuevo
          </Button>
        }
      />
      <div className="space-y-3 p-4">
        {items === null ? (
          <Loading />
        ) : items.length === 0 ? (
          <Empty>Todavía no hay ejercicios.</Empty>
        ) : (
          items.map((ex) => (
            <Card key={ex.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-900">
                  {ex.name}
                </div>
                {ex.muscle_group ? (
                  <div className="text-sm text-slate-500">{ex.muscle_group}</div>
                ) : null}
                {ex.notes ? (
                  <div className="text-sm text-slate-400">{ex.notes}</div>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  onClick={() => openEdit(ex)}
                  className="!min-h-[40px] px-3"
                >
                  ✏️
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => remove(ex)}
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
          title={editing ? "Editar ejercicio" : "Nuevo ejercicio"}
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
            <Field label="Grupo muscular">
              <input
                className={inputClass}
                value={form.muscle_group ?? ""}
                onChange={(e) =>
                  setForm({ ...form, muscle_group: e.target.value })
                }
              />
            </Field>
            <Field label="Notas">
              <textarea
                className={inputClass}
                rows={2}
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
