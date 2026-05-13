import type { Metadata } from "next";
import { CartProvider } from "@/components/public/cart-context";
import { FloatingCart } from "@/components/public/floating-cart";
import { FloatingWhatsApp } from "@/components/public/floating-whatsapp";
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
