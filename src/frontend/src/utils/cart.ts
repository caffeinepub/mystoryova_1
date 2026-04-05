export interface CartItem {
  id: string; // unique cart key: productId_size_color
  productId: string; // original product ID for Razorpay / shipping lookups
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

/**
 * Add an item to the cart. Each unique combination of productId + size + color
 * is stored as a separate line item. Passing the same combination again
 * increments the quantity instead of duplicating the row.
 */
export function addToCart(
  item: Omit<CartItem, "id" | "quantity"> & { quantity?: number },
) {
  const cartId = `${item.productId}_${item.selectedSize ?? ""}_${item.selectedColor ?? ""}`;
  const cart = getCart();
  const existing = cart.find((c) => c.id === cartId);
  if (existing) {
    existing.quantity += item.quantity ?? 1;
    existing.currency = item.currency ?? existing.currency;
    saveCart(cart);
  } else {
    saveCart([...cart, { ...item, id: cartId, quantity: item.quantity ?? 1 }]);
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
