"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/data/products";
import { formatPrice } from "@/data/products";
import { MAX_QUANTITY, type CartChange } from "@/lib/order";

export type CartItem = Product & { quantity: number };

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  itemCount: number;
  subtotal: number;
  lastAdded: CartItem | null;
  dismissAdded: () => void;
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  increaseItem: (id: string) => void;
  decreaseItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyChanges: (changes: CartChange[]) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const STORAGE_KEY = "tesoria-cart-v1";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Recuperar el carrito guardado (para que no se pierda al recargar)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // si el almacenamiento no está disponible, seguimos con carrito vacío
    }
    setHydrated(true);
  }, []);

  // Guardar cada cambio
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignorar
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    return {
      items,
      isOpen,
      itemCount,
      subtotal,
      lastAdded,
      dismissAdded() {
        setLastAdded(null);
      },
      addItem(product) {
        const existing = items.find((item) => item.id === product.id);
        setLastAdded({
          ...product,
          quantity: Math.min((existing?.quantity ?? 0) + 1, MAX_QUANTITY),
        });
        setItems((current) => {
          const found = current.find((item) => item.id === product.id);
          if (found) {
            return current.map((item) =>
              item.id === product.id
                ? {
                    ...item,
                    quantity: Math.min(item.quantity + 1, MAX_QUANTITY),
                  }
                : item,
            );
          }
          return [...current, { ...product, quantity: 1 }];
        });
      },
      removeItem(id) {
        setItems((current) => current.filter((item) => item.id !== id));
      },
      increaseItem(id) {
        setItems((current) =>
          current.map((item) =>
            item.id === id
              ? { ...item, quantity: Math.min(item.quantity + 1, MAX_QUANTITY) }
              : item,
          ),
        );
      },
      setQuantity(id, quantity) {
        if (!Number.isFinite(quantity)) return;
        const clamped = Math.min(
          Math.max(Math.floor(quantity), 1),
          MAX_QUANTITY,
        );
        setItems((current) =>
          current.map((item) =>
            item.id === id ? { ...item, quantity: clamped } : item,
          ),
        );
      },
      decreaseItem(id) {
        setItems((current) =>
          current
            .map((item) =>
              item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
            )
            .filter((item) => item.quantity > 0),
        );
      },
      clearCart() {
        setItems([]);
      },
      applyChanges(changes) {
        setItems((current) =>
          current.flatMap((item) => {
            const change = changes.find((c) => c.id === item.id);
            if (!change) return [item];
            if (change.kind === "agotado") return [];
            return [
              { ...item, price: change.price, priceLabel: formatPrice(change.price) },
            ];
          }),
        );
      },
      openCart() {
        setIsOpen(true);
      },
      closeCart() {
        setIsOpen(false);
      },
      toggleCart() {
        setIsOpen((open) => !open);
      },
    };
  }, [items, isOpen, lastAdded]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }
  return context;
}
