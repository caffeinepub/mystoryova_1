// Razorpay configuration
export const RAZORPAY_KEY_ID = "rzp_live_SVxiRj6Sd6z9bR";

export interface ProductPaymentLink {
  productId: string;
  name: string;
  razorpayUrl: string;
  price: number; // price in paise (INR * 100)
  priceUSD: number; // price in cents (USD * 100)
}

export const AUDIOBOOK_PAYMENT_LINKS: ProductPaymentLink[] = [
  {
    productId: "audio-1",
    name: "The Long Climb - Audiobook",
    razorpayUrl: "https://rzp.io/l/mystoryova-audio-1",
    price: 29900,
    priceUSD: 399,
  },
  {
    productId: "audio-2",
    name: "The Ember Prophecy - Audiobook",
    razorpayUrl: "https://rzp.io/l/mystoryova-audio-2",
    price: 29900,
    priceUSD: 399,
  },
  {
    productId: "audio-3",
    name: "The Letter in the Rain - Audiobook",
    razorpayUrl: "https://rzp.io/l/mystoryova-audio-3",
    price: 24900,
    priceUSD: 299,
  },
];

export const MERCH_PAYMENT_LINKS: ProductPaymentLink[] = [
  {
    productId: "merch-1",
    name: "Mystoryova Mug",
    razorpayUrl: "https://rzp.io/l/mystoryova-mug",
    price: 59900,
    priceUSD: 799,
  },
  {
    productId: "merch-2",
    name: "Mystoryova Bookmark Set",
    razorpayUrl: "https://rzp.io/l/mystoryova-bookmark",
    price: 19900,
    priceUSD: 299,
  },
  {
    productId: "merch-3",
    name: "Art Print – The Long Climb",
    razorpayUrl: "https://rzp.io/l/mystoryova-print1",
    price: 79900,
    priceUSD: 999,
  },
  {
    productId: "merch-4",
    name: "Mystoryova Tote Bag",
    razorpayUrl: "https://rzp.io/l/mystoryova-tote",
    price: 44900,
    priceUSD: 599,
  },
];

/**
 * Opens the Razorpay checkout popup for a given product.
 * Requires the Razorpay script to be loaded (added to index.html).
 */
export function openRazorpayCheckout(options: {
  name: string;
  description: string;
  amount: number; // in smallest unit (paise for INR, cents for USD)
  currency?: "INR" | "USD";
  email?: string;
  contact?: string;
  onSuccess?: (response: Record<string, string>) => void;
  onDismiss?: () => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Razorpay = (window as any).Razorpay;
  if (!Razorpay) {
    alert(
      "Razorpay could not be loaded. Please check your internet connection.",
    );
    return;
  }

  const rzp = new Razorpay({
    key: RAZORPAY_KEY_ID,
    amount: options.amount,
    currency: options.currency ?? "INR",
    name: "Mystoryova",
    description: options.description,
    prefill: {
      email: options.email || "",
      contact: options.contact || "",
    },
    theme: { color: "#B8860B" },
    handler: (response: Record<string, string>) => {
      options.onSuccess?.(response);
    },
    modal: {
      ondismiss: () => {
        options.onDismiss?.();
      },
    },
  });

  rzp.open();
}
