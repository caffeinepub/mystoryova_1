export interface CartItem {
  id: string;
  cartKey: string; // unique key: id + size + color
  name: string;
  price: number;
  type: "audiobook" | "merch";
  quantity: number;
  accessLink?: string;
  currency?: "INR" | "USD";
  selectedSize?: string;
  selectedColor?: string;
}

const CART_KEY = "mystoryova_cart";

function notifyUpdate() {
  window.dispatchEvent(new CustomEvent("cart-update"));
}

export function getCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  notifyUpdate();
}

export function makeCartKey(id: string, size?: string, color?: string): string {
  return [id, size ?? "", color ?? ""].join("|");
}

export function addToCart(
  item: Omit<CartItem, "quantity" | "cartKey"> & { quantity?: number },
) {
  const cart = getCart();
  const key = makeCartKey(item.id, item.selectedSize, item.selectedColor);
  const existing = cart.find((c) => c.cartKey === key);
  if (existing) {
    existing.quantity += item.quantity ?? 1;
    existing.currency = item.currency ?? existing.currency;
    saveCart(cart);
  } else {
    saveCart([
      ...cart,
      { ...item, cartKey: key, quantity: item.quantity ?? 1 },
    ]);
  }
}

export function removeFromCart(cartKey: string) {
  saveCart(getCart().filter((c) => c.cartKey !== cartKey));
}

export function updateQuantity(cartKey: string, qty: number) {
  if (qty <= 0) {
    removeFromCart(cartKey);
    return;
  }
  const cart = getCart();
  const item = cart.find((c) => c.cartKey === cartKey);
  if (item) {
    item.quantity = qty;
    saveCart(cart);
  }
}

export function clearCart() {
  saveCart([]);
}

export function getCartCount(): number {
  return getCart().reduce((sum, c) => sum + c.quantity, 0);
}
