import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MDB Wines",
  description: "MDB Wines admin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
