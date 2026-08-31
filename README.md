# Gimnasio — Registro de entrenamientos (MVP)

App web simple y mobile-first para registrar entrenamientos de gimnasio.
Sin login (MVP de uso personal), pensada para evolucionar más adelante hacia
multiusuario con autenticación y RLS.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Supabase** (PostgreSQL)
- **Tailwind CSS** — diseño limpio, mobile first

## Base de datos

Todas las tablas usan el prefijo `gym_` y son **completamente independientes**
de las tablas `pill_*` de la app "Pastillero" (que **no** se tocan).

- `gym_exercises` — catálogo de ejercicios
- `gym_routines` — rutinas
- `gym_routine_exercises` — ejercicios de una rutina (plantilla, con orden)
- `gym_workouts` — sesiones de entrenamiento
- `gym_workout_exercises` — fotografía de los ejercicios de una sesión
- `gym_workout_sets` — series realizadas (reps + peso)

Al comenzar un entrenamiento se **copian** los ejercicios de la rutina hacia
`gym_workout_exercises`, de modo que el registro histórico no depende de
cambios futuros en la rutina.

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear la base de datos en Supabase ejecutando la migración
   `supabase/migrations/0001_gym_schema.sql` en el **SQL Editor** de tu
   proyecto. Crea solo las tablas `gym_*` y una rutina inicial "Full Body".

3. Configurar variables de entorno:

   ```bash
   cp .env.local.example .env.local
   ```

   Completar con la URL y la anon key del proyecto Supabase
   (Project Settings → API).

4. Levantar en desarrollo:

   ```bash
   npm run dev
   ```

   Abrir http://localhost:3000

## Funcionalidades

- Crear / editar / eliminar **ejercicios** y **rutinas**
- Agregar ejercicios a una rutina, con objetivo (series y rango de reps)
- Reordenar ejercicios con botones ↑ ↓
- Empezar un entrenamiento desde una rutina
- Registrar series con **reps** y **peso** (teclado numérico en celular)
- "Usar mismo peso" para aplicar un peso a todas las series de un ejercicio
- Marcar series y ejercicios como completados; colapsar la tarjeta al terminar
- Finalizar el entrenamiento (guarda fecha, hora y duración)
- Consultar el **historial** y el detalle de entrenamientos anteriores

## Estructura del código

```
src/
  app/                 # páginas (App Router)
    page.tsx           # inicio
    exercises/         # ejercicios
    routines/          # rutinas y detalle
    start/             # empezar entrenamiento
    workout/[id]/      # entrenamiento en curso + resumen (/done)
    history/           # historial y detalle
  components/          # UI reutilizable (botones, tarjetas, modal, header)
  lib/
    supabase.ts        # cliente Supabase (lazy)
    types.ts           # tipos del dominio
    format.ts          # utilidades de fecha/duración
    queries/           # consultas Supabase por dominio
```

## Seguridad (RLS)

La migración **habilita Row Level Security** en todas las tablas `gym_*` y
crea políticas **permisivas** para los roles `anon` y `authenticated`. Esto
satisface el chequeo de seguridad de Supabase y mantiene la app funcional en
el MVP sin login.

> ⚠️ Con estas políticas abiertas, cualquiera con la anon key puede
> leer/escribir las tablas `gym_*`. Es aceptable para un MVP personal, no para
> producción con datos de terceros.

Al ejecutar la migración en Supabase podés elegir **"Run and enable RLS"**: la
migración ya deja RLS activo con las políticas necesarias para que la app ande.

## Preparado para el futuro (sin implementar aún)

La estructura permite agregar más adelante sin rediseñar:

- `user_id` referenciando `auth.users`
- Reemplazar las políticas abiertas por políticas por usuario
  (`using (user_id = auth.uid())`) y quitar el acceso a `anon`
- Autenticación, perfiles, multiusuario
