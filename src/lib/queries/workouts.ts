import { supabase } from "@/lib/supabase";
import type {
  Workout,
  WorkoutExercise,
  WorkoutExerciseWithExercise,
  WorkoutSet,
} from "@/lib/types";
import { listRoutineExercises } from "@/lib/queries/routines";

// Comienza un entrenamiento a partir de una rutina:
// 1. crea el registro en gym_workouts
// 2. copia los ejercicios de la rutina hacia gym_workout_exercises
//    (fotografía histórica, independiente de futuros cambios en la rutina)
export async function startWorkout(routineId: string): Promise<Workout> {
  const routineExercises = await listRoutineExercises(routineId);

  const { data: workout, error: workoutError } = await supabase
    .from("gym_workouts")
    .insert({ routine_id: routineId, status: "in_progress" })
    .select("*")
    .single();
  if (workoutError) throw workoutError;

  if (routineExercises.length > 0) {
    const rows = routineExercises.map((re) => ({
      workout_id: workout.id,
      exercise_id: re.exercise_id,
      exercise_order: re.exercise_order,
      completed: false,
    }));
    const { error: weError } = await supabase
      .from("gym_workout_exercises")
      .insert(rows);
    if (weError) throw weError;
  }

  return workout;
}

export async function getWorkout(id: string): Promise<Workout | null> {
  const { data, error } = await supabase
    .from("gym_workouts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listWorkoutExercises(
  workoutId: string
): Promise<WorkoutExerciseWithExercise[]> {
  const { data, error } = await supabase
    .from("gym_workout_exercises")
    .select("*, exercise:gym_exercises(*)")
    .eq("workout_id", workoutId)
    .order("exercise_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WorkoutExerciseWithExercise[];
}

export async function setWorkoutExerciseCompleted(
  id: string,
  completed: boolean
): Promise<void> {
  const { error } = await supabase
    .from("gym_workout_exercises")
    .update({ completed })
    .eq("id", id);
  if (error) throw error;
}

// -------- Series --------

export async function listSetsForWorkout(
  workoutId: string
): Promise<WorkoutSet[]> {
  // Trae todas las series de todos los ejercicios del entrenamiento en una query.
  const { data, error } = await supabase
    .from("gym_workout_sets")
    .select("*, gym_workout_exercises!inner(workout_id)")
    .eq("gym_workout_exercises.workout_id", workoutId)
    .order("set_number", { ascending: true });
  if (error) throw error;
  // Quitamos la relación embebida usada solo para filtrar.
  return (data ?? []).map(({ gym_workout_exercises, ...rest }) => rest as WorkoutSet);
}

export async function addSet(
  workoutExerciseId: string,
  setNumber: number,
  weight: number | null
): Promise<WorkoutSet> {
  const { data, error } = await supabase
    .from("gym_workout_sets")
    .insert({
      workout_exercise_id: workoutExerciseId,
      set_number: setNumber,
      weight,
      completed: false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateSet(
  id: string,
  patch: Partial<Pick<WorkoutSet, "reps" | "weight" | "completed">>
): Promise<void> {
  const { error } = await supabase
    .from("gym_workout_sets")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSet(id: string): Promise<void> {
  const { error } = await supabase.from("gym_workout_sets").delete().eq("id", id);
  if (error) throw error;
}

// Aplica el mismo peso a todas las series de un ejercicio ("Usar mismo peso").
export async function applyWeightToExercise(
  workoutExerciseId: string,
  weight: number
): Promise<void> {
  const { error } = await supabase
    .from("gym_workout_sets")
    .update({ weight })
    .eq("workout_exercise_id", workoutExerciseId);
  if (error) throw error;
}

export async function finishWorkout(id: string): Promise<Workout> {
  const { data, error } = await supabase
    .from("gym_workouts")
    .update({ status: "completed", finished_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

// -------- Historial --------

export interface WorkoutSummary {
  workout: Workout;
  routineName: string | null;
  exerciseCount: number;
  setCount: number;
}

export async function listWorkoutHistory(): Promise<WorkoutSummary[]> {
  const { data, error } = await supabase
    .from("gym_workouts")
    .select(
      "*, routine:gym_routines(name), gym_workout_exercises(id, gym_workout_sets(id))"
    )
    .order("started_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const exercises = row.gym_workout_exercises ?? [];
    const setCount = exercises.reduce(
      (acc: number, e: any) => acc + (e.gym_workout_sets?.length ?? 0),
      0
    );
    const { routine, gym_workout_exercises, ...workout } = row;
    return {
      workout: workout as Workout,
      routineName: routine?.name ?? null,
      exerciseCount: exercises.length,
      setCount,
    };
  });
}
