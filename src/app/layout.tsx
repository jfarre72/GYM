import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gimnasio",
  description: "Registro simple de entrenamientos",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className="mx-auto min-h-screen w-full max-w-md bg-[#f4f6fb] pb-24">
          {children}
        </div>
      </body>
    </html>
  );
}
