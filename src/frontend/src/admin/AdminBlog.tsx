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
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { BlogPost } from "../backend.d";
import { useActor } from "../hooks/useActor";

const CATEGORIES = [
  "Fiction",
  "Writing Tips",
  "Author Life",
  "Book Reviews",
  "Announcements",
  "Other",
];

function slugify(title: string) {
  return `post-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

interface FormState {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  publishedAt: string;
}

const EMPTY_FORM: FormState = {
  id: "",
  title: "",
  category: "Fiction",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  publishedAt: new Date().toISOString().slice(0, 10),
};

function formToPost(f: FormState): BlogPost {
  return {
    id: f.id || slugify(f.title),
    title: f.title,
    category: f.category,
    excerpt: f.excerpt,
    content: f.content,
    coverImageUrl: f.coverImageUrl,
    publishedAt: BigInt(new Date(f.publishedAt).getTime() * 1_000_000),
  };
}

function postToForm(p: BlogPost): FormState {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    excerpt: p.excerpt,
    content: p.content,
    coverImageUrl: p.coverImageUrl,
    publishedAt: new Date(Number(p.publishedAt) / 1_000_000)
      .toISOString()
      .slice(0, 10),
  };
}

export default function AdminBlog() {
  const { actor } = useActor();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    if (!actor) return;
    const data = await actor.getBlogPosts();
    setPosts([...data].reverse());
    setLoading(false);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable
  useEffect(() => {
    if (actor) load();
  }, [actor]);

  function openAdd() {
    setEditPost(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }
  function openEdit(post: BlogPost) {
    setEditPost(post);
    setForm(postToForm(post));
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
      const post = formToPost(form);
      if (editPost) {
        await actor.updateBlogPost(post);
        toast.success("Post updated");
      } else {
        await actor.addBlogPost(post);
        toast.success("Post created");
      }
      setShowForm(false);
      await load();
    } catch {
      toast.error("Save failed");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!actor || !deleteId) return;
    try {
      await actor.deleteBlogPost(deleteId);
      toast.success("Post deleted");
      setDeleteId(null);
      await load();
    } catch {
      toast.error("Delete failed");
    }
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
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#555" }}>
          Write and manage blog posts.
        </p>
        <Button
          data-ocid="admin.blog.primary_button"
          size="sm"
          onClick={openAdd}
          style={{
            background: "linear-gradient(135deg, #D4AF37, #F0D060)",
            color: "#0a0a0a",
            fontWeight: 700,
          }}
        >
          <Plus size={15} className="mr-1" /> New Post
        </Button>
      </div>

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
        ) : posts.length === 0 ? (
          <div
            data-ocid="admin.blog.empty_state"
            className="p-10 text-center"
            style={{ color: "#555" }}
          >
            No posts yet.
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
                  {["Title", "Category", "Published", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 text-xs uppercase tracking-wider"
                      style={{ color: "#555" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.map((post, i) => (
                  <tr
                    key={post.id}
                    data-ocid={`admin.blog.row.${i + 1}`}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    <td
                      className="py-3 px-4 font-semibold"
                      style={{ color: "#f0ead6" }}
                    >
                      {post.title}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(212,175,55,0.1)",
                          color: "#D4AF37",
                        }}
                      >
                        {post.category}
                      </span>
                    </td>
                    <td className="py-3 px-4" style={{ color: "#888" }}>
                      {new Date(
                        Number(post.publishedAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          data-ocid={`admin.blog.edit_button.${i + 1}`}
                          onClick={() => openEdit(post)}
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
                          data-ocid={`admin.blog.delete_button.${i + 1}`}
                          onClick={() => setDeleteId(post.id)}
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
            data-ocid="admin.blog.modal"
            className="w-full max-w-2xl rounded-2xl p-6 flex flex-col gap-4 my-auto"
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
              {editPost ? "Edit Post" : "New Blog Post"}
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
                  placeholder="Post title"
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Category
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
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
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Published Date
                </Label>
                <Input
                  type="date"
                  value={form.publishedAt}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, publishedAt: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Cover Image URL
                </Label>
                <Input
                  value={form.coverImageUrl}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, coverImageUrl: e.target.value }))
                  }
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Excerpt
                </Label>
                <Textarea
                  value={form.excerpt}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, excerpt: e.target.value }))
                  }
                  placeholder="Short summary..."
                  rows={2}
                  style={inputStyle}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Content *
                </Label>
                <Textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, content: e.target.value }))
                  }
                  placeholder="Full post content..."
                  rows={12}
                  style={{ ...inputStyle, minHeight: 300 }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <Button
                data-ocid="admin.blog.cancel_button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
                style={{ borderColor: "rgba(212,175,55,0.2)", color: "#888" }}
              >
                Cancel
              </Button>
              <Button
                data-ocid="admin.blog.save_button"
                className="flex-1 font-bold"
                disabled={saving}
                onClick={handleSave}
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                  color: "#0a0a0a",
                }}
              >
                {saving
                  ? "Saving..."
                  : editPost
                    ? "Update Post"
                    : "Publish Post"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "#666" }}>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.blog.cancel_button"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#888",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.blog.delete_button"
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
