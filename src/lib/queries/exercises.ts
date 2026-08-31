import { supabase } from "@/lib/supabase";
import type { Exercise } from "@/lib/types";

export async function listExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from("gym_exercises")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from("gym_exercises")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface ExerciseInput {
  name: string;
  muscle_group: string | null;
  notes: string | null;
}

export async function createExercise(input: ExerciseInput): Promise<Exercise> {
  const { data, error } = await supabase
    .from("gym_exercises")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateExercise(
  id: string,
  input: ExerciseInput
): Promise<Exercise> {
  const { data, error } = await supabase
    .from("gym_exercises")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExercise(id: string): Promise<void> {
  const { error } = await supabase.from("gym_exercises").delete().eq("id", id);
  if (error) throw error;
}
