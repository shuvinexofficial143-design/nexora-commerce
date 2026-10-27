"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { calculateCartTotals, clampQuantity, makeLineId } from "@/lib/cart-utils";
import type { CartLine, CartProductSnapshot, SavedLine, WishlistItem } from "@/types/cart";
import type { CheckoutPreviewLine } from "@/lib/commerce/checkout-preview";
import { variantSignature } from "@/lib/commerce/product-variants";
import { MiniCart } from "@/components/cart/mini-cart";
import { buildCartAdmissionRequest, assertCartAdmission } from "@/lib/commerce/cart-admission";
import { fetchCheckoutPreview } from "@/lib/api/checkout-preview-client";

type AddOptions = { color?: string; size?: string; quantity?: number; choices?: Record<string,string> };
type CartContextValue = {
  lines: CartLine[]; saved: SavedLine[]; wishlist: WishlistItem[]; coupon: string; hydrated: boolean; totals: ReturnType<typeof calculateCartTotals>;
  applyVerifiedPrices: (products: CheckoutPreviewLine[]) => void; addVerifiedItem: (product: CartProductSnapshot, options?: AddOptions) => Promise<void>; addItem: (product: CartProductSnapshot, options?: AddOptions) => void; removeItem: (lineId: string) => void; setQuantity: (lineId: string, quantity: number) => void; saveForLater: (lineId: string) => void; moveSavedToCart: (lineId: string) => void; removeSaved: (lineId: string) => void; toggleWishlist: (product: CartProductSnapshot) => void; removeWishlist: (id: string) => void; moveWishlistToCart: (id: string) => void; isWishlisted: (id: string) => boolean; applyCoupon: (code: string) => Promise<{ ok: boolean; message: string }>; clearCoupon: () => void; clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "nexora-commerce-state-v1";
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const linesRef = useRef(lines);
  const verifyingRef = useRef(false);
  useEffect(() => { linesRef.current = lines; }, [lines]); const [saved, setSaved] = useState<SavedLine[]>([]); const [wishlist, setWishlist] = useState<WishlistItem[]>([]); const [coupon, setCoupon] = useState(""); const [couponDiscount, setCouponDiscount] = useState(0); const [hydrated, setHydrated] = useState(false); const [miniOpen, setMiniOpen] = useState(false);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { lines?: CartLine[]; saved?: SavedLine[]; wishlist?: WishlistItem[]; coupon?: string };
          setLines(Array.isArray(parsed.lines) ? parsed.lines.map(line => ({
            ...line, lineId: makeLineId(line.id, line.color, line.size, line.choices),
          })) : []);
          setSaved(Array.isArray(parsed.saved) ? parsed.saved : []);
          setWishlist(Array.isArray(parsed.wishlist) ? parsed.wishlist : []);
          setCoupon(typeof parsed.coupon === "string" ? parsed.coupon : "");
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => { if (!hydrated) return; localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, saved, wishlist, coupon })); }, [lines, saved, wishlist, coupon, hydrated]);
  useEffect(() => {
    if (!hydrated || !coupon) return;
    let active = true;
    const subtotal = calculateCartTotals(lines).subtotal;
    void fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon, subtotal }),
    }).then(async (response) => {
      const result = await response.json() as { ok?: boolean; data?: { valid: boolean; discountMinor: number } };
      if (active) setCouponDiscount(response.ok && result.ok && result.data?.valid ? result.data.discountMinor / 100 : 0);
    }).catch(() => { if (active) setCouponDiscount(0); });
    return () => { active = false; };
  }, [hydrated, coupon, lines]);
  const addItem = useCallback((product: CartProductSnapshot, options: AddOptions = {}) => { if (product.stock === "out-of-stock") return; const lineId = makeLineId(product.id, options.color, options.size, options.choices); setLines((current) => { const found = current.find((line) => line.lineId === lineId); if (found) return current.map((line) => line.lineId === lineId ? { ...line, quantity: clampQuantity(line.quantity + (options.quantity || 1)) } : line); return [...current, { ...product, lineId, quantity: clampQuantity(options.quantity || 1), color: options.color, size: options.size, choices: options.choices }]; }); setMiniOpen(true); }, []);
  // Desktop and mobile buy controls share one live SKU preflight.
  const addVerifiedItem = useCallback(async (product: CartProductSnapshot, options: AddOptions = {}) => {
    if (verifyingRef.current) throw new Error("Another SKU is being checked. Please retry.");
    verifyingRef.current = true;
    const snapshot = JSON.stringify(linesRef.current);
    try {
      const request = buildCartAdmissionRequest(product, options.choices, linesRef.current, options.quantity ?? 1);
      const quote = await fetchCheckoutPreview(request);
      assertCartAdmission(quote, request);
      if (JSON.stringify(linesRef.current) !== snapshot)
        throw new Error("Your bag changed during verification. Please retry.");
      addItem(product, options);
    } finally {
      verifyingRef.current = false;
    }
  }, [addItem]);
  // Prices are updated only when the customer approves the current DB quote.
  const applyVerifiedPrices = useCallback((products: CheckoutPreviewLine[]) => {
    const key = (slug: string, choices: Record<string,string> | undefined) =>
      slug + ":" + variantSignature(choices);
    const byChoice = new Map(products.filter(row => row.unitPriceMinor !== null)
      .map(row => [key(row.slug, row.options), row]));
    setLines(current => current.map(line => {
      const verified = byChoice.get(key(line.slug, line.choices));
      return verified && verified.unitPriceMinor !== null
        ? { ...line, name: verified.name, price: verified.unitPriceMinor / 100,
            stock: verified.availableStock <= 0 ? "out-of-stock" as const
              : verified.availableStock <= 8 ? "low-stock" as const : "in-stock" as const }
        : line;
    }));
  }, []);
  const removeItem = useCallback((lineId: string) => setLines((current) => current.filter((line) => line.lineId !== lineId)), []); const setQuantity = useCallback((lineId: string, quantity: number) => setLines((current) => current.map((line) => line.lineId === lineId ? { ...line, quantity: clampQuantity(quantity) } : line)), []);
  const saveForLater = useCallback((lineId: string) => { const line = lines.find((item) => item.lineId === lineId); if (!line) return; setSaved((items) => [{ ...line, savedAt: new Date().toISOString() }, ...items.filter((item) => item.lineId !== lineId)]); setLines((current) => current.filter((item) => item.lineId !== lineId)); }, [lines]);
  const moveSavedToCart = useCallback((lineId: string) => { const line = saved.find((item) => item.lineId === lineId); if (!line) return; addItem(line, { color: line.color, size: line.size, choices: line.choices, quantity: line.quantity }); setSaved((current) => current.filter((item) => item.lineId !== lineId)); }, [saved, addItem]);
  const removeSaved = useCallback((lineId: string) => setSaved((current) => current.filter((item) => item.lineId !== lineId)), []); const toggleWishlist = useCallback((product: CartProductSnapshot) => { setWishlist((current) => current.some((item) => item.id === product.id) ? current.filter((item) => item.id !== product.id) : [{ ...product, addedAt: new Date().toISOString() }, ...current]); }, []); const removeWishlist = useCallback((id: string) => setWishlist((current) => current.filter((item) => item.id !== id)), []);
  const moveWishlistToCart = useCallback((id: string) => { const item = wishlist.find((entry) => entry.id === id); if (item) addItem(item); }, [wishlist, addItem]); const isWishlisted = useCallback((id: string) => wishlist.some((item) => item.id === id), [wishlist]);
  const applyCoupon = useCallback(async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return { ok: false, message: "Enter a coupon code." };
    try {
      const subtotal = calculateCartTotals(lines).subtotal;
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized, subtotal }),
      });
      const payload = await response.json() as {
        ok?: boolean; data?: { valid: boolean; discountMinor: number }; error?: string;
      };
      if (!response.ok || !payload.ok || !payload.data?.valid) {
        return { ok: false, message: payload.error || "This coupon is not valid for your cart." };
      }
      setCoupon(normalized);
      setCouponDiscount(payload.data.discountMinor / 100);
      return { ok: true, message: normalized + " applied successfully." };
    } catch {
      return { ok: false, message: "Could not check coupon right now. Try again." };
    }
  }, [lines]);
  const clearCoupon = useCallback(() => { setCoupon(""); setCouponDiscount(0); }, []); const clearCart = useCallback(() => { setLines([]); setCoupon(""); setCouponDiscount(0); setMiniOpen(false); }, []); const totals = useMemo(() => calculateCartTotals(lines, coupon, couponDiscount), [lines, coupon, couponDiscount]);
  const value = useMemo<CartContextValue>(() => ({ lines, saved, wishlist, coupon, hydrated, totals, applyVerifiedPrices, addVerifiedItem, addItem, removeItem, setQuantity, saveForLater, moveSavedToCart, removeSaved, toggleWishlist, removeWishlist, moveWishlistToCart, isWishlisted, applyCoupon, clearCoupon, clearCart }), [lines, saved, wishlist, coupon, hydrated, totals, applyVerifiedPrices, addVerifiedItem, addItem, removeItem, setQuantity, saveForLater, moveSavedToCart, removeSaved, toggleWishlist, removeWishlist, moveWishlistToCart, isWishlisted, applyCoupon, clearCoupon, clearCart]);
  return <CartContext.Provider value={value}>{children}<MiniCart open={miniOpen} onClose={() => setMiniOpen(false)} /></CartContext.Provider>;
}
export function useCart() { const value = useContext(CartContext); if (!value) throw new Error("useCart must be used inside CartProvider"); return value; }
