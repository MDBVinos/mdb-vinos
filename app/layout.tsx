import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { CartProvider } from "@/components/public/cart-context";
import { FloatingCart } from "@/components/public/floating-cart";
import { FloatingWhatsApp } from "@/components/public/floating-whatsapp";
import "./globals.css";

const siteTitle = "MDB Wines | Vinos Argentinos y Recomendaciones";
const siteDescription =
  "Distribuidora de vinos argentinos. Descubrí el vino perfecto para cada momento y explorá nuestro catálogo online de bodegas y etiquetas seleccionadas.";
const siteUrl = "https://mdbwines.com";
const socialImage = `${siteUrl}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "MDB Wines",
    images: [socialImage],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [socialImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          {children}
          <FloatingCart />
          <FloatingWhatsApp />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
