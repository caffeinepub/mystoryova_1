export interface CartItem {
  id: string;
  name: string;
  price: number;
  type: "audiobook" | "merch";
  quantity: number;
  accessLink?: string;
  currency?: "INR" | "USD";
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

export function addToCart(
  item: Omit<CartItem, "quantity"> & { quantity?: number },
) {
  const cart = getCart();
  const existing = cart.find((c) => c.id === item.id);
  if (existing) {
    existing.quantity += item.quantity ?? 1;
    existing.currency = item.currency ?? existing.currency;
    saveCart(cart);
  } else {
    saveCart([...cart, { ...item, quantity: item.quantity ?? 1 }]);
  }
}

export function removeFromCart(id: string) {
  saveCart(getCart().filter((c) => c.id !== id));
}

export function updateQuantity(id: string, qty: number) {
  if (qty <= 0) {
    removeFromCart(id);
    return;
  }
  const cart = getCart();
  const item = cart.find((c) => c.id === id);
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
