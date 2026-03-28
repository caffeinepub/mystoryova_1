import type { Book } from "../backend.d";

export const SEED_BOOKS: Book[] = [
  {
    id: "book-1",
    title: "The Long Climb",
    description:
      "A gripping tale of perseverance and self-discovery as one man conquers not just a mountain, but the demons within. O. Chiddarwar weaves a narrative that resonates long after the last page.",
    genre: "Literary Fiction",
    coverImageUrl: "",
    featured: true,
    audiobookLink: "",
    formats: [
      {
        __kind__: "kindle",
        kindle: "https://www.amazon.com/author/o.chiddarwar",
      },
      {
        __kind__: "paperback",
        paperback: "https://www.amazon.com/author/o.chiddarwar",
      },
    ],
  },
  {
    id: "book-2",
    title: "The Ember Prophecy",
    description:
      "In a world where ancient prophecies collide with modern reality, a reluctant hero must choose between destiny and desire. An epic fantasy that burns with passion and purpose.",
    genre: "Fantasy",
    coverImageUrl: "",
    featured: true,
    audiobookLink: "",
    formats: [
      {
        __kind__: "kindle",
        kindle: "https://www.amazon.com/author/o.chiddarwar",
      },
      {
        __kind__: "paperback",
        paperback: "https://www.amazon.com/author/o.chiddarwar",
      },
    ],
  },
  {
    id: "book-3",
    title: "The Letter in the Rain",
    description:
      "A love story that transcends time and circumstance, told through letters found in an old house. Each page drips with nostalgia and longing.",
    genre: "Romance",
    coverImageUrl: "",
    featured: true,
    audiobookLink: "",
    formats: [
      {
        __kind__: "kindle",
        kindle: "https://www.amazon.com/author/o.chiddarwar",
      },
      {
        __kind__: "paperback",
        paperback: "https://www.amazon.com/author/o.chiddarwar",
      },
    ],
  },
  {
    id: "book-4",
    title: "Shadows of Tomorrow",
    description:
      "A psychological thriller that keeps you guessing until the very last sentence. Reality and illusion blur in this masterful tale of suspense.",
    genre: "Thriller",
    coverImageUrl: "",
    featured: false,
    formats: [
      {
        __kind__: "kindle",
        kindle: "https://www.amazon.com/author/o.chiddarwar",
      },
      {
        __kind__: "paperback",
        paperback: "https://www.amazon.com/author/o.chiddarwar",
      },
    ],
  },
  {
    id: "book-5",
    title: "Whispers of the Wind",
    description:
      "A lyrical collection of poetry that captures the ephemeral beauty of life, love, and loss. Each verse is a window into the soul.",
    genre: "Poetry",
    coverImageUrl: "",
    featured: false,
    formats: [
      {
        __kind__: "kindle",
        kindle: "https://www.amazon.com/author/o.chiddarwar",
      },
    ],
  },
  {
    id: "book-6",
    title: "Beyond the Horizon",
    description:
      "An adventure that takes you to the edges of the known world and beyond. Courage, friendship, and discovery drive this exhilarating journey.",
    genre: "Adventure",
    coverImageUrl: "",
    featured: false,
    formats: [
      {
        __kind__: "kindle",
        kindle: "https://www.amazon.com/author/o.chiddarwar",
      },
      {
        __kind__: "paperback",
        paperback: "https://www.amazon.com/author/o.chiddarwar",
      },
    ],
  },
];
