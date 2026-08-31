"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

// -------- Encabezado con botón de volver opcional --------
export function Header({
  title,
  backHref,
  right,
}: {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
      {backHref !== undefined ? (
        <button
          onClick={() => (backHref ? router.push(backHref) : router.back())}
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
        >
          ←
        </button>
      ) : null}
      <h1 className="flex-1 truncate text-lg font-semibold text-slate-900">
        {title}
      </h1>
      {right}
    </header>
  );
}

// -------- Botón primario grande (mobile first) --------
export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    secondary: "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold transition disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    secondary: "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  };
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold transition ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

// -------- Tarjeta simple --------
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

// -------- Input de texto con etiqueta --------
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

// -------- Estados vacíos / carga --------
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
      {children}
    </div>
  );
}

export function Loading() {
  return <div className="p-6 text-center text-slate-400">Cargando…</div>;
}
