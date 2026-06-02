import type { Metadata } from "next";
import { CartProvider } from "@/components/public/cart-context";
import { FloatingCart } from "@/components/public/floating-cart";
import { FloatingWhatsApp } from "@/components/public/floating-whatsapp";
import "./globals.css";

const siteTitle = "MDB Wines | Vinos Argentinos y Recomendaciones";
const siteDescription =
  "Distribuidora de vinos argentinos. Descubrí el vino perfecto para cada momento y explorá nuestro catálogo online de bodegas y etiquetas seleccionadas.";

export const metadata: Metadata = {
  metadataBase: new URL("https://mdbwines.com"),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName: "MDB Wines",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription,
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
      </body>
    </html>
  );
}
