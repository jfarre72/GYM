import { supabase } from "@/lib/supabase";
import type {
  Routine,
  RoutineExercise,
  RoutineExerciseWithExercise,
} from "@/lib/types";

export async function listRoutines(): Promise<Routine[]> {
  const { data, error } = await supabase
    .from("gym_routines")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getRoutine(id: string): Promise<Routine | null> {
  const { data, error } = await supabase
    .from("gym_routines")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface RoutineInput {
  name: string;
  description: string | null;
}

export async function createRoutine(input: RoutineInput): Promise<Routine> {
  const { data, error } = await supabase
    .from("gym_routines")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateRoutine(
  id: string,
  input: RoutineInput
): Promise<Routine> {
  const { data, error } = await supabase
    .from("gym_routines")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRoutine(id: string): Promise<void> {
  const { error } = await supabase.from("gym_routines").delete().eq("id", id);
  if (error) throw error;
}

// -------- Ejercicios de una rutina (plantilla) --------

export async function listRoutineExercises(
  routineId: string
): Promise<RoutineExerciseWithExercise[]> {
  const { data, error } = await supabase
    .from("gym_routine_exercises")
    .select("*, exercise:gym_exercises(*)")
    .eq("routine_id", routineId)
    .order("exercise_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RoutineExerciseWithExercise[];
}

export interface RoutineExerciseInput {
  routine_id: string;
  exercise_id: string;
  exercise_order: number;
  default_sets: number | null;
  default_reps_min: number | null;
  default_reps_max: number | null;
  default_weight: number | null;
  notes: string | null;
}

export async function addRoutineExercise(
  input: RoutineExerciseInput
): Promise<RoutineExercise> {
  const { data, error } = await supabase
    .from("gym_routine_exercises")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateRoutineExercise(
  id: string,
  patch: Partial<RoutineExerciseInput>
): Promise<void> {
  const { error } = await supabase
    .from("gym_routine_exercises")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteRoutineExercise(id: string): Promise<void> {
  const { error } = await supabase
    .from("gym_routine_exercises")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// Intercambia el exercise_order de dos filas para reordenar (botones ↑ ↓).
export async function swapRoutineExerciseOrder(
  a: RoutineExercise,
  b: RoutineExercise
): Promise<void> {
  await updateRoutineExercise(a.id, { exercise_order: b.exercise_order });
  await updateRoutineExercise(b.id, { exercise_order: a.exercise_order });
}
