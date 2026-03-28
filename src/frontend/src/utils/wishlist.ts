const KEY = "mystoryova_wishlist";

export function getWishlist(): string[] {
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addToWishlist(id: string): void {
  const list = getWishlist();
  if (!list.includes(id)) {
    localStorage.setItem(KEY, JSON.stringify([...list, id]));
  }
}

export function removeFromWishlist(id: string): void {
  const list = getWishlist().filter((i) => i !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function isInWishlist(id: string): boolean {
  return getWishlist().includes(id);
}

export function toggleWishlist(id: string): boolean {
  if (isInWishlist(id)) {
    removeFromWishlist(id);
    return false;
  }
  addToWishlist(id);
  return true;
}
