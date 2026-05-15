"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { PublicWine } from "@/lib/public/types";
import { buildWhatsAppLink, GENERAL_WHATSAPP_LINK, type WhatsAppItem } from "@/lib/public/whatsapp";

export type CartFormat = "unit" | "box";

export type CartItem = {
  id: string;
  wineId: string;
  name: string;
  image_url?: string | null;
  price_unit: number | null;
  price_box: number | null;
  units_per_box: number | null;
  quantity: number;
  format: CartFormat;
};

type AddToCartInput = {
  wine: PublicWine;
  quantity: number;
  format: CartFormat;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  addItem: (input: AddToCartInput) => void;
  decrementItem: (id: string) => void;
  incrementItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  whatsappLink: string;
};

const CART_STORAGE_KEY = "mdb-wines-cart";
const CartContext = createContext<CartContextValue | null>(null);

function itemId(wineId: string, format: CartFormat) {
  return `${wineId}:${format}`;
}

function itemToWhatsApp(item: CartItem): WhatsAppItem {
  return {
    wine: {
      name: item.name,
      price_box: item.price_box,
      price_unit: item.price_unit,
      units_per_box: item.units_per_box,
    },
    quantity: item.quantity,
    format: item.format,
  };
}

function normalizeQuantity(quantity: number) {
  return Math.max(1, Math.trunc(quantity || 1));
}

function readStoredCart() {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is CartItem => {
        return (
          typeof item?.id === "string" &&
          typeof item.wineId === "string" &&
          typeof item.name === "string" &&
          (item.format === "unit" || item.format === "box") &&
          typeof item.quantity === "number"
        );
      })
      .map((item) => ({
        ...item,
        image_url: item.image_url ?? null,
        price_box: typeof item.price_box === "number" ? item.price_box : null,
        price_unit: typeof item.price_unit === "number" ? item.price_unit : null,
        units_per_box: typeof item.units_per_box === "number" ? item.units_per_box : null,
        quantity: normalizeQuantity(item.quantity),
      }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(readStoredCart());
      setHasLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [hasLoaded, items]);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      totalItems: items.reduce((total, item) => total + item.quantity, 0),
      addItem: ({ wine, quantity, format }) => {
        const safeQuantity = normalizeQuantity(quantity);
        const id = itemId(wine.id, format);

        setItems((current) => {
          const existing = current.find((item) => item.id === id);
          if (existing) {
            return current.map((item) =>
              item.id === id ? { ...item, quantity: item.quantity + safeQuantity } : item,
            );
          }

          return [
            ...current,
            {
              id,
              image_url: wine.image_url,
              wineId: wine.id,
              name: wine.name,
              price_box: wine.price_box,
              price_unit: wine.price_unit,
              units_per_box: wine.units_per_box,
              quantity: safeQuantity,
              format,
            },
          ];
        });
      },
      decrementItem: (id) => {
        setItems((current) =>
          current
            .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
            .filter((item) => item.quantity > 0),
        );
      },
      incrementItem: (id) => {
        setItems((current) =>
          current.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)),
        );
      },
      removeItem: (id) => {
        setItems((current) => current.filter((item) => item.id !== id));
      },
      clearCart: () => setItems([]),
      whatsappLink: items.length > 0 ? buildWhatsAppLink(items.map(itemToWhatsApp)) : GENERAL_WHATSAPP_LINK,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
