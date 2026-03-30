import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Book, BookFormat } from "../backend.d";
import { SEED_BOOKS } from "../data/seedBooks";
import { useActor } from "../hooks/useActor";
import { useStorageClient } from "../utils/useStorageClient";

const GENRES = [
  "Literary Fiction",
  "Fantasy",
  "Romance",
  "Thriller",
  "Poetry",
  "Adventure",
  "Other",
];

function icErrMsg(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message.match(/with message:\s*'([^']+)'/s);
    return m ? m[1].slice(0, 120) : err.message.slice(0, 120);
  }
  return String(err).slice(0, 120);
}

function slugify(title: string) {
  return `book-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

interface FormState {
  id: string;
  title: string;
  description: string;
  genre: string;
  coverImageUrl: string;
  featured: boolean;
  audiobookLink: string;
  hasKindle: boolean;
  kindleUrl: string;
  hasPaperback: boolean;
  paperbackUrl: string;
}

const EMPTY_FORM: FormState = {
  id: "",
  title: "",
  description: "",
  genre: "Literary Fiction",
  coverImageUrl: "",
  featured: false,
  audiobookLink: "",
  hasKindle: true,
  kindleUrl: "",
  hasPaperback: false,
  paperbackUrl: "",
};

function formToBook(f: FormState): Book {
  const formats: BookFormat[] = [];
  if (f.hasKindle) formats.push({ __kind__: "kindle", kindle: f.kindleUrl });
  if (f.hasPaperback)
    formats.push({ __kind__: "paperback", paperback: f.paperbackUrl });
  return {
    id: f.id || slugify(f.title),
    title: f.title,
    description: f.description,
    genre: f.genre,
    coverImageUrl: f.coverImageUrl,
    featured: f.featured,
    audiobookLink: f.audiobookLink,
    formats,
  };
}

function bookToForm(b: Book): FormState {
  const kindle = b.formats.find((f) => f.__kind__ === "kindle");
  const pb = b.formats.find((f) => f.__kind__ === "paperback");
  return {
    id: b.id,
    title: b.title,
    description: b.description,
    genre: b.genre,
    coverImageUrl: b.coverImageUrl,
    featured: b.featured,
    audiobookLink: b.audiobookLink ?? "",
    hasKindle: !!kindle,
    kindleUrl: kindle?.__kind__ === "kindle" ? kindle.kindle : "",
    hasPaperback: !!pb,
    paperbackUrl: pb?.__kind__ === "paperback" ? pb.paperback : "",
  };
}

export default function AdminBooks() {
  const { actor } = useActor();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const { uploadImage } = useStorageClient();

  async function load() {
    if (!actor) return;
    try {
      const data = await actor.getBooks();
      setBooks([...data].reverse());
    } catch (_uploadErr) {
      // error ignored, will show empty state
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable
  useEffect(() => {
    if (actor) load();
  }, [actor]);

  function openAdd() {
    setEditBook(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(book: Book) {
    setEditBook(book);
    setForm(bookToForm(book));
    setShowForm(true);
  }

  async function handleSave() {
    if (!actor) return;
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const book = formToBook(form);
      if (editBook) {
        await actor.updateBook(book);
        toast.success("Book updated");
      } else {
        await actor.addBook(book);
        toast.success("Book added");
      }
      setShowForm(false);
    } catch (err) {
      console.error("Admin save error:", err);
      toast.error(`Failed to save: ${icErrMsg(err)}`);
      setSaving(false);
      return;
    }
    setSaving(false);
    await load();
  }

  async function handleDelete() {
    if (!actor || !deleteId) return;
    const idToDelete = deleteId;
    try {
      await actor.deleteBook(idToDelete);
      toast.success("Book deleted");
      setDeleteId(null);
    } catch (err) {
      console.error("Admin save error:", err);
      toast.error(`Delete failed: ${icErrMsg(err)}`);
      return;
    }
    await load();
  }

  async function handleSeedDefaults() {
    if (!actor) return;
    setSaving(true);
    try {
      for (const b of SEED_BOOKS) await actor.addBook(b);
      toast.success(`Seeded ${SEED_BOOKS.length} books`);
      await load();
    } catch (err) {
      console.error("Admin save error:", err);
      toast.error(`Seed failed: ${icErrMsg(err)}`);
    }
    setSaving(false);
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(212,175,55,0.12)",
  };
  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(212,175,55,0.2)",
    color: "#f0ead6",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#555" }}>
          Manage all books on the platform.
        </p>
        <div className="flex gap-2">
          <Button
            data-ocid="admin.books.secondary_button"
            variant="outline"
            size="sm"
            onClick={handleSeedDefaults}
            disabled={saving}
            style={{ borderColor: "rgba(212,175,55,0.2)", color: "#D4AF37" }}
          >
            Load Defaults
          </Button>
          <Button
            data-ocid="admin.books.primary_button"
            size="sm"
            onClick={openAdd}
            style={{
              background: "linear-gradient(135deg, #D4AF37, #F0D060)",
              color: "#0a0a0a",
              fontWeight: 700,
            }}
          >
            <Plus size={15} className="mr-1" /> Add Book
          </Button>
        </div>
      </div>

      {/* Book list */}
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        {loading ? (
          <div className="p-5 flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-14"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div
            data-ocid="admin.books.empty_state"
            className="p-10 text-center"
            style={{ color: "#555" }}
          >
            No books yet. Add one or load defaults.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(212,175,55,0.1)",
                    background: "rgba(0,0,0,0.2)",
                  }}
                >
                  {["Title", "Genre", "Formats", "Featured", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 text-xs uppercase tracking-wider"
                        style={{ color: "#555" }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {books.map((book, i) => (
                  <tr
                    key={book.id}
                    data-ocid={`admin.books.row.${i + 1}`}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    <td
                      className="py-3 px-4 font-semibold"
                      style={{ color: "#f0ead6" }}
                    >
                      {book.title}
                    </td>
                    <td className="py-3 px-4" style={{ color: "#888" }}>
                      {book.genre}
                    </td>
                    <td className="py-3 px-4" style={{ color: "#888" }}>
                      {book.formats.map((f) => f.__kind__).join(", ")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: book.featured
                            ? "rgba(212,175,55,0.15)"
                            : "rgba(255,255,255,0.05)",
                          color: book.featured ? "#D4AF37" : "#555",
                        }}
                      >
                        {book.featured ? "Featured" : "No"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          data-ocid={`admin.books.edit_button.${i + 1}`}
                          onClick={() => openEdit(book)}
                          className="p-1.5 rounded"
                          style={{
                            color: "#D4AF37",
                            background: "rgba(212,175,55,0.08)",
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          data-ocid={`admin.books.delete_button.${i + 1}`}
                          onClick={() => setDeleteId(book.id)}
                          className="p-1.5 rounded"
                          style={{
                            color: "#EF4444",
                            background: "rgba(239,68,68,0.08)",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowForm(false);
          }}
          role="presentation"
        >
          <div
            data-ocid="admin.books.modal"
            className="w-full max-w-xl rounded-2xl p-6 flex flex-col gap-4 my-auto"
            style={{
              background: "#111",
              border: "1px solid rgba(212,175,55,0.2)",
            }}
          >
            <h3
              className="font-bold text-lg"
              style={{
                fontFamily: "Playfair Display, serif",
                color: "#D4AF37",
              }}
            >
              {editBook ? "Edit Book" : "Add New Book"}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Title *
                </Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      title: e.target.value,
                      id: p.id || slugify(e.target.value),
                    }))
                  }
                  placeholder="Book title"
                  style={inputStyle}
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Description *
                </Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Book description"
                  rows={4}
                  style={inputStyle}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Genre
                </Label>
                <Select
                  value={form.genre}
                  onValueChange={(v) => setForm((p) => ({ ...p, genre: v }))}
                >
                  <SelectTrigger style={inputStyle}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: "#1a1a1a",
                      border: "1px solid rgba(212,175,55,0.2)",
                    }}
                  >
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Cover Image
                </Label>
                <div className="flex items-center gap-3 flex-wrap">
                  {form.coverImageUrl &&
                    (form.coverImageUrl.startsWith("data:") ||
                      form.coverImageUrl.startsWith("http")) && (
                      <img
                        src={form.coverImageUrl}
                        alt="cover"
                        className="rounded object-cover"
                        style={{
                          width: 60,
                          height: 60,
                          border: "1px solid rgba(212,175,55,0.3)",
                        }}
                      />
                    )}
                  <label style={{ cursor: "pointer" }}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingCover(true);
                        try {
                          const url = await uploadImage(file);
                          setForm((p) => ({ ...p, coverImageUrl: url }));
                        } catch (uploadErr) {
                          toast.error(
                            `Upload failed: ${uploadErr instanceof Error ? uploadErr.message : String(uploadErr)}`,
                          );
                        } finally {
                          setUploadingCover(false);
                        }
                        e.target.value = "";
                      }}
                    />
                    <span
                      style={{
                        border: "1px solid rgba(212,175,55,0.3)",
                        color: "#D4AF37",
                        background: "rgba(212,175,55,0.06)",
                        borderRadius: 8,
                        padding: "4px 12px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      {uploadingCover ? "Uploading..." : "Upload from Device"}
                    </span>
                  </label>
                </div>
                <Input
                  value={
                    form.coverImageUrl.startsWith("data:")
                      ? ""
                      : form.coverImageUrl
                  }
                  onChange={(e) =>
                    setForm((p) => ({ ...p, coverImageUrl: e.target.value }))
                  }
                  placeholder="Or paste image URL"
                  style={inputStyle}
                  className="mt-1"
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Audiobook Link (optional)
                </Label>
                <Input
                  value={form.audiobookLink}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, audiobookLink: e.target.value }))
                  }
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>

              {/* Formats */}
              <div className="col-span-2">
                <Label
                  className="block mb-2"
                  style={{ color: "#888", fontSize: "0.75rem" }}
                >
                  Formats
                </Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={form.hasKindle}
                      onCheckedChange={(v) =>
                        setForm((p) => ({ ...p, hasKindle: v }))
                      }
                    />
                    <span className="text-sm" style={{ color: "#aaa" }}>
                      Kindle
                    </span>
                    {form.hasKindle && (
                      <Input
                        value={form.kindleUrl}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, kindleUrl: e.target.value }))
                        }
                        placeholder="Kindle URL"
                        className="flex-1"
                        style={inputStyle}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={form.hasPaperback}
                      onCheckedChange={(v) =>
                        setForm((p) => ({ ...p, hasPaperback: v }))
                      }
                    />
                    <span className="text-sm" style={{ color: "#aaa" }}>
                      Paperback
                    </span>
                    {form.hasPaperback && (
                      <Input
                        value={form.paperbackUrl}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            paperbackUrl: e.target.value,
                          }))
                        }
                        placeholder="Paperback URL"
                        className="flex-1"
                        style={inputStyle}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Featured toggle */}
              <div className="col-span-2 flex items-center gap-3">
                <Switch
                  checked={form.featured}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, featured: v }))
                  }
                />
                <Label style={{ color: "#aaa" }}>Featured on homepage</Label>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <Button
                data-ocid="admin.books.cancel_button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
                style={{ borderColor: "rgba(212,175,55,0.2)", color: "#888" }}
              >
                Cancel
              </Button>
              <Button
                data-ocid="admin.books.save_button"
                className="flex-1 font-bold"
                disabled={saving}
                onClick={handleSave}
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                  color: "#0a0a0a",
                }}
              >
                {saving ? "Saving..." : editBook ? "Update Book" : "Add Book"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent
          style={{
            background: "#111",
            border: "1px solid rgba(212,175,55,0.2)",
            color: "#f0ead6",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this book?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "#666" }}>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.books.cancel_button"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#888",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.books.delete_button"
              onClick={handleDelete}
              style={{ background: "#EF4444", color: "#fff" }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
