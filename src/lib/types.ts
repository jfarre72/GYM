// Tipos del dominio GYM. Mapean 1:1 con las tablas gym_* de Supabase.

export type WorkoutStatus = "in_progress" | "completed";

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  notes: string | null;
  created_at: string;
}

export interface Routine {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  exercise_order: number;
  default_sets: number | null;
  default_reps_min: number | null;
  default_reps_max: number | null;
  default_weight: number | null;
  notes: string | null;
}

// RoutineExercise con el ejercicio embebido (join).
export interface RoutineExerciseWithExercise extends RoutineExercise {
  exercise: Exercise;
}

export interface Workout {
  id: string;
  routine_id: string | null;
  workout_date: string;
  started_at: string;
  finished_at: string | null;
  status: WorkoutStatus;
  notes: string | null;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_order: number | null;
  completed: boolean;
  notes: string | null;
}

export interface WorkoutExerciseWithExercise extends WorkoutExercise {
  exercise: Exercise;
}

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  completed: boolean;
  created_at: string;
}
