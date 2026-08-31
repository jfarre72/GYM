// Utilidades de formato (fechas y duración) en español.

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Duración entre dos instantes -> "1h 08min" o "45min".
export function formatDuration(
  start: string | Date,
  end: string | Date
): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const totalMin = Math.max(0, Math.round((e - s) / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  return `${m}min`;
}
