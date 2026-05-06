import type { Metadata } from "next";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600"],
});

const garamond = EB_Garamond({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-garamond",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "MDB Wines",
  description: "Distribuidora de vinos en Buenos Aires. Te asesoramos sin tecnicismos y armas tu pedido por WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${cormorant.variable} ${garamond.variable}`}>
      <body>{children}</body>
    </html>
  );
}
