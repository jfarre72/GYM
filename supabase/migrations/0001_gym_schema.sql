-- =============================================================
-- Migración: esquema GYM (MVP registro de entrenamientos)
-- =============================================================
-- Crea EXCLUSIVAMENTE tablas con prefijo gym_.
-- NO modifica, reutiliza ni relaciona ninguna tabla pill_*.
--
-- Sin autenticación por ahora (MVP de uso personal).
-- La estructura queda preparada para agregar más adelante:
--   user_id -> auth.users, RLS y multiusuario.
-- =============================================================

-- 1. Ejercicios -----------------------------------------------
create table if not exists gym_exercises (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  muscle_group text,
  notes        text,
  created_at   timestamptz not null default now()
);

-- 2. Rutinas --------------------------------------------------
create table if not exists gym_routines (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- 3. Ejercicios dentro de una rutina (plantilla) --------------
create table if not exists gym_routine_exercises (
  id               uuid primary key default gen_random_uuid(),
  routine_id       uuid not null references gym_routines(id) on delete cascade,
  exercise_id      uuid not null references gym_exercises(id),
  exercise_order   integer not null,
  default_sets     integer,
  default_reps_min integer,
  default_reps_max integer,
  default_weight   numeric,
  notes            text
);

create index if not exists idx_gym_routine_exercises_routine
  on gym_routine_exercises (routine_id, exercise_order);

-- 4. Entrenamientos (sesiones) --------------------------------
create table if not exists gym_workouts (
  id           uuid primary key default gen_random_uuid(),
  routine_id   uuid references gym_routines(id),
  workout_date date not null default current_date,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text not null default 'in_progress', -- in_progress | completed
  notes        text
);

create index if not exists idx_gym_workouts_started_at
  on gym_workouts (started_at desc);

-- 5. Ejercicios concretos de una sesión (fotografía) ----------
create table if not exists gym_workout_exercises (
  id             uuid primary key default gen_random_uuid(),
  workout_id     uuid not null references gym_workouts(id) on delete cascade,
  exercise_id    uuid not null references gym_exercises(id),
  exercise_order integer,
  completed      boolean not null default false,
  notes          text
);

create index if not exists idx_gym_workout_exercises_workout
  on gym_workout_exercises (workout_id, exercise_order);

-- 6. Series realizadas ----------------------------------------
create table if not exists gym_workout_sets (
  id                  uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references gym_workout_exercises(id) on delete cascade,
  set_number          integer not null,
  reps                integer,
  weight              numeric,
  completed           boolean not null default false,
  created_at          timestamptz not null default now()
);

create index if not exists idx_gym_workout_sets_exercise
  on gym_workout_sets (workout_exercise_id, set_number);

-- =============================================================
-- Datos iniciales: rutina "Full Body"
-- =============================================================
do $$
declare
  v_routine_id uuid;
  v_abdominales uuid;
  v_cuadriceps  uuid;
  v_femoral     uuid;
  v_press_banco uuid;
  v_remo        uuid;
  v_jalon       uuid;
  v_hombros     uuid;
begin
  -- Evitar duplicar el seed si ya existe la rutina Full Body.
  if exists (select 1 from gym_routines where name = 'Full Body') then
    return;
  end if;

  insert into gym_exercises (name, muscle_group)
    values ('Abdominales banco declinado', 'Abdomen') returning id into v_abdominales;
  insert into gym_exercises (name, muscle_group)
    values ('Extensión de cuádriceps', 'Cuádriceps') returning id into v_cuadriceps;
  insert into gym_exercises (name, muscle_group)
    values ('Curl femoral', 'Isquiotibiales') returning id into v_femoral;
  insert into gym_exercises (name, muscle_group)
    values ('Press banco plano', 'Pecho') returning id into v_press_banco;
  insert into gym_exercises (name, muscle_group)
    values ('Remo', 'Espalda') returning id into v_remo;
  insert into gym_exercises (name, muscle_group)
    values ('Jalón al pecho', 'Espalda') returning id into v_jalon;
  insert into gym_exercises (name, muscle_group)
    values ('Press hombros con mancuernas', 'Hombros') returning id into v_hombros;

  insert into gym_routines (name, description)
    values ('Full Body', 'Rutina inicial de cuerpo completo') returning id into v_routine_id;

  insert into gym_routine_exercises
    (routine_id, exercise_id, exercise_order, default_sets, default_reps_min, default_reps_max)
  values
    (v_routine_id, v_abdominales, 1, 3, 10, 15),
    (v_routine_id, v_cuadriceps,  2, 3, 8,  12),
    (v_routine_id, v_femoral,     3, 3, 8,  12),
    (v_routine_id, v_press_banco, 4, 4, 6,  10),
    (v_routine_id, v_remo,        5, 3, 8,  12),
    (v_routine_id, v_jalon,       6, 3, 8,  12),
    (v_routine_id, v_hombros,     7, 3, 8,  12);
end $$;

-- =============================================================
-- Row Level Security (RLS)
-- =============================================================
-- Se habilita RLS en todas las tablas gym_* y se agregan políticas
-- PERMISIVAS para los roles anon y authenticated. Esto satisface el
-- chequeo de seguridad de Supabase y mantiene la app funcional en el
-- MVP sin login.
--
-- IMPORTANTE (futuro multiusuario): cuando se agregue autenticación,
-- reemplazar estas políticas abiertas por unas basadas en user_id
-- (p. ej. `using (user_id = auth.uid())`) y quitar el acceso a `anon`.
-- =============================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'gym_exercises',
    'gym_routines',
    'gym_routine_exercises',
    'gym_workouts',
    'gym_workout_exercises',
    'gym_workout_sets'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    -- Política abierta (MVP sin login). Idempotente: se recrea si ya existe.
    execute format('drop policy if exists %I on %I;', t || '_open_access', t);
    execute format(
      'create policy %I on %I for all to anon, authenticated using (true) with check (true);',
      t || '_open_access', t
    );
  end loop;
end $$;
