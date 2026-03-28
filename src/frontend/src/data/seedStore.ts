export interface Audiobook {
  id: string;
  name: string;
  description: string;
  price: number;
  priceUSD: number;
  coverEmoji: string;
  duration: string;
  narrator: string;
}

export interface Merch {
  id: string;
  name: string;
  description: string;
  price: number;
  priceUSD: number;
  coverEmoji: string;
  category: string;
}

export const AUDIOBOOKS: Audiobook[] = [
  {
    id: "audio-1",
    name: "The Long Climb",
    description:
      "A raw, deeply moving tale of a young man navigating grief, ambition, and the mountains that refuse to let him go. Narrated with cinematic intimacy, this audiobook is an experience that lingers long after the final chapter.",
    price: 299,
    priceUSD: 3.99,
    coverEmoji: "🏔️",
    duration: "6h 42m",
    narrator: "Arjun Mehra",
  },
  {
    id: "audio-2",
    name: "The Ember Prophecy",
    description:
      "In a world where fire carries memory, one girl discovers she alone can read the ancient embers. A sweeping fantasy that weaves mythology, love, and revolution into an unforgettable auditory journey.",
    price: 299,
    priceUSD: 3.99,
    coverEmoji: "🔥",
    duration: "8h 15m",
    narrator: "Priya Sharma",
  },
  {
    id: "audio-3",
    name: "The Letter in the Rain",
    description:
      "A quiet, devastating love story told through letters never sent. Set across three continents and two decades, this audiobook captures the weight of words unsaid with breathtaking precision.",
    price: 249,
    priceUSD: 2.99,
    coverEmoji: "✉️",
    duration: "5h 28m",
    narrator: "Kavita Nair",
  },
];

export const MERCH_ITEMS: Merch[] = [
  {
    id: "merch-1",
    name: "Mystoryova Mug",
    description:
      "Start your mornings with stories. This premium ceramic mug features the iconic Mystoryova script and the tagline 'Stories That Stay With You' in gold on matte black.",
    price: 599,
    priceUSD: 7.99,
    coverEmoji: "☕",
    category: "Lifestyle",
  },
  {
    id: "merch-2",
    name: "Mystoryova Bookmark Set",
    description:
      "A set of four artisan bookmarks featuring quotes from O. Chiddarwar's most beloved works, printed on premium card with gold foil accents.",
    price: 199,
    priceUSD: 2.99,
    coverEmoji: "🔖",
    category: "Stationery",
  },
  {
    id: "merch-3",
    name: "Art Print – The Long Climb",
    description:
      "A limited-edition A3 art print of the original cover illustration for The Long Climb. Printed on archival matte paper with rich, deep tones. Ready to frame.",
    price: 799,
    priceUSD: 9.99,
    coverEmoji: "🖼️",
    category: "Art",
  },
  {
    id: "merch-4",
    name: "Mystoryova Tote Bag",
    description:
      "A heavy-duty canvas tote bag with the Mystoryova logo silk-screened in gold. Carry your books, your world, your stories — in style.",
    price: 449,
    priceUSD: 5.99,
    coverEmoji: "👜",
    category: "Accessories",
  },
];
