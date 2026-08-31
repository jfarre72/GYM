import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase para el navegador (MVP sin autenticación).
// Las variables se leen de .env.local (ver .env.local.example).
//
// Se crea de forma perezosa (lazy) para no romper el build/prerender
// cuando las variables aún no están configuradas: el error solo aparece
// al usar realmente la base de datos, con un mensaje claro.
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copiá .env.local.example a .env.local y completá los valores."
    );
  }
  client = createClient(url, anonKey);
  return client;
}

// Proxy que difiere la creación del cliente hasta el primer uso.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getClient();
    // @ts-expect-error acceso dinámico a las propiedades del cliente
    const value = c[prop];
    return typeof value === "function" ? value.bind(c) : value;
  },
});
