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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Music, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Audiobook } from "../backend.d";
import { AUDIOBOOKS } from "../data/seedStore";
import { useActor } from "../hooks/useActor";
import { useStorageClient } from "../utils/useStorageClient";

interface FormState {
  id: string;
  name: string;
  description: string;
  coverEmoji: string;
  duration: string;
  narrator: string;
  priceINR: string;
  priceUSD: string;
  razorpayUrlINR: string;
  razorpayUrlUSD: string;
  isActive: boolean;
  audioFileUrl: string;
}

const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  description: "",
  coverEmoji: "🎧",
  duration: "",
  narrator: "",
  priceINR: "",
  priceUSD: "",
  razorpayUrlINR: "",
  razorpayUrlUSD: "",
  isActive: true,
  audioFileUrl: "",
};

function icErrMsg(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message.match(/with message:\s*'([^']+)'/s);
    return m ? m[1].slice(0, 120) : err.message.slice(0, 120);
  }
  return String(err).slice(0, 120);
}

function formToAudiobook(f: FormState): Audiobook {
  return {
    id: f.id || `audio-${Date.now()}`,
    name: f.name,
    description: f.description,
    coverEmoji: f.coverEmoji,
    duration: f.duration,
    narrator: f.narrator,
    priceINR: BigInt(Math.round(Number(f.priceINR) * 100)),
    priceUSD: BigInt(Math.round(Number(f.priceUSD) * 100)),
    razorpayUrlINR: f.razorpayUrlINR,
    razorpayUrlUSD: f.razorpayUrlUSD,
    isActive: f.isActive,
  };
}

function audiobookToForm(a: Audiobook, audioUrl: string): FormState {
  return {
    id: a.id,
    name: a.name,
    description: a.description,
    coverEmoji: a.coverEmoji,
    duration: a.duration,
    narrator: a.narrator,
    priceINR: (Number(a.priceINR) / 100).toString(),
    priceUSD: (Number(a.priceUSD) / 100).toString(),
    razorpayUrlINR: a.razorpayUrlINR,
    razorpayUrlUSD: a.razorpayUrlUSD,
    isActive: a.isActive,
    audioFileUrl: audioUrl,
  };
}

export default function AdminStoreAudiobooks() {
  const { actor } = useActor();
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Audiobook | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const { uploadImage } = useStorageClient();
  const audioInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    if (!actor) return;
    try {
      const [data, allSettings] = await Promise.all([
        actor.getAudiobooks(),
        actor.getAllSettings(),
      ]);
      setAudiobooks([...data].reverse());
      const urls: Record<string, string> = {};
      for (const s of allSettings) {
        if (s.key.startsWith("audioFile_")) {
          urls[s.key.replace("audioFile_", "")] = s.value;
        }
      }
      setAudioUrls(urls);
    } catch {
      // error ignored
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable
  useEffect(() => {
    if (actor) load();
  }, [actor]);

  function openAdd() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }
  function openEdit(a: Audiobook) {
    setEditItem(a);
    setForm(audiobookToForm(a, audioUrls[a.id] ?? ""));
    setShowForm(true);
  }

  function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) {
      toast.error(
        "Audio file too large (max 1MB). Use an external URL instead for larger files.",
      );
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((p) => ({ ...p, audioFileUrl: ev.target?.result as string }));
      toast.success("Audio file loaded");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleSave() {
    if (!actor) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const ab = formToAudiobook(form);
      if (editItem) {
        await actor.updateAudiobook(ab);
        toast.success("Updated");
      } else {
        await actor.createAudiobook(ab);
        toast.success("Audiobook created");
      }
      // Save audio file URL as a setting
      await actor.updateSetting({
        key: `audioFile_${ab.id}`,
        value: form.audioFileUrl,
      });
      setShowForm(false);
    } catch (err) {
      console.error("Admin save error:", err);
      toast.error(`Save failed: ${icErrMsg(err)}`);
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
      await actor.deleteAudiobook(idToDelete);
      // Clear audio setting
      await actor.updateSetting({ key: `audioFile_${idToDelete}`, value: "" });
      toast.success("Deleted");
      setDeleteId(null);
    } catch (err) {
      console.error("Admin save error:", err);
      toast.error(`Delete failed: ${icErrMsg(err)}`);
      return;
    }
    await load();
  }

  async function seedDefaults() {
    if (!actor) return;
    setSaving(true);
    try {
      for (const ab of AUDIOBOOKS) {
        await actor.createAudiobook({
          id: ab.id,
          name: ab.name,
          description: ab.description,
          coverEmoji: ab.coverEmoji,
          duration: ab.duration,
          narrator: ab.narrator,
          priceINR: BigInt(ab.price * 100),
          priceUSD: BigInt(Math.round(ab.priceUSD * 100)),
          razorpayUrlINR: "",
          razorpayUrlUSD: "",
          isActive: true,
        });
      }
      toast.success(`Seeded ${AUDIOBOOKS.length} audiobooks`);
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
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#555" }}>
          Manage audiobook listings in the store.
        </p>
        <div className="flex gap-2">
          {audiobooks.length === 0 && (
            <Button
              data-ocid="admin.audiobooks.secondary_button"
              variant="outline"
              size="sm"
              onClick={seedDefaults}
              disabled={saving}
              style={{ borderColor: "rgba(212,175,55,0.2)", color: "#D4AF37" }}
            >
              Seed Defaults
            </Button>
          )}
          <Button
            data-ocid="admin.audiobooks.primary_button"
            size="sm"
            onClick={openAdd}
            style={{
              background: "linear-gradient(135deg, #D4AF37, #F0D060)",
              color: "#0a0a0a",
              fontWeight: 700,
            }}
          >
            <Plus size={15} className="mr-1" /> Add Audiobook
          </Button>
        </div>
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
        ) : audiobooks.length === 0 ? (
          <div
            data-ocid="admin.audiobooks.empty_state"
            className="p-10 text-center"
            style={{ color: "#555" }}
          >
            No audiobooks yet. Add one or seed defaults.
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
                  {[
                    "Name",
                    "Narrator",
                    "Duration",
                    "Audio",
                    "Price INR",
                    "Price USD",
                    "Active",
                    "Actions",
                  ].map((h) => (
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
                {audiobooks.map((ab, i) => (
                  <tr
                    key={ab.id}
                    data-ocid={`admin.audiobooks.row.${i + 1}`}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    <td
                      className="py-3 px-4 font-semibold"
                      style={{ color: "#f0ead6" }}
                    >
                      {ab.coverEmoji &&
                      (ab.coverEmoji.startsWith("data:") ||
                        ab.coverEmoji.startsWith("http")) ? (
                        <img
                          src={ab.coverEmoji}
                          alt={ab.name}
                          className="inline-block rounded object-cover mr-2"
                          style={{
                            width: 32,
                            height: 32,
                            verticalAlign: "middle",
                          }}
                        />
                      ) : (
                        <span className="mr-1">{ab.coverEmoji}</span>
                      )}
                      {ab.name}
                    </td>
                    <td className="py-3 px-4" style={{ color: "#888" }}>
                      {ab.narrator}
                    </td>
                    <td className="py-3 px-4" style={{ color: "#888" }}>
                      {ab.duration}
                    </td>
                    <td className="py-3 px-4">
                      {audioUrls[ab.id] ? (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"
                          style={{
                            background: "rgba(34,197,94,0.12)",
                            color: "#22C55E",
                          }}
                        >
                          <Music size={10} /> Set
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "#444" }}>
                          —
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4" style={{ color: "#D4AF37" }}>
                      ₹{(Number(ab.priceINR) / 100).toFixed(0)}
                    </td>
                    <td className="py-3 px-4" style={{ color: "#D4AF37" }}>
                      ${(Number(ab.priceUSD) / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: ab.isActive
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(239,68,68,0.1)",
                          color: ab.isActive ? "#22C55E" : "#EF4444",
                        }}
                      >
                        {ab.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          data-ocid={`admin.audiobooks.edit_button.${i + 1}`}
                          onClick={() => openEdit(ab)}
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
                          data-ocid={`admin.audiobooks.delete_button.${i + 1}`}
                          onClick={() => setDeleteId(ab.id)}
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
            data-ocid="admin.audiobooks.modal"
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
              {editItem ? "Edit Audiobook" : "Add Audiobook"}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Name *
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Audiobook name"
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Cover Image / Emoji
                </Label>
                <div className="flex items-center gap-3 flex-wrap">
                  {form.coverEmoji &&
                    (form.coverEmoji.startsWith("data:") ||
                      form.coverEmoji.startsWith("http")) && (
                      <img
                        src={form.coverEmoji}
                        alt="cover"
                        className="rounded object-cover"
                        style={{
                          width: 50,
                          height: 50,
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
                          setForm((p) => ({ ...p, coverEmoji: url }));
                        } catch {
                          toast.error("Failed to upload image");
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
                {(!form.coverEmoji ||
                  (!form.coverEmoji.startsWith("data:") &&
                    !form.coverEmoji.startsWith("http"))) && (
                  <Input
                    value={form.coverEmoji}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, coverEmoji: e.target.value }))
                    }
                    placeholder="Or enter emoji e.g. 🎧"
                    style={inputStyle}
                    className="mt-1"
                  />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Duration
                </Label>
                <Input
                  value={form.duration}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, duration: e.target.value }))
                  }
                  placeholder="6h 42m"
                  style={inputStyle}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Narrator
                </Label>
                <Input
                  value={form.narrator}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, narrator: e.target.value }))
                  }
                  placeholder="Narrator name"
                  style={inputStyle}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Description
                </Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                  placeholder="Audiobook description"
                  style={inputStyle}
                />
              </div>

              {/* Audio File Upload */}
              <div className="col-span-2 flex flex-col gap-2">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Audio File / Preview
                </Label>
                <div
                  className="rounded-xl p-4 flex flex-col gap-3"
                  style={{
                    background: "rgba(212,175,55,0.04)",
                    border: "1px solid rgba(212,175,55,0.15)",
                  }}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleAudioUpload}
                    />
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      style={{
                        border: "1px solid rgba(212,175,55,0.3)",
                        color: "#D4AF37",
                        background: "rgba(212,175,55,0.06)",
                        borderRadius: 8,
                        padding: "6px 16px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Music size={13} /> Upload Audio File
                    </button>
                    <span style={{ color: "#555", fontSize: "0.7rem" }}>
                      Max 1MB · MP3, WAV, M4A
                    </span>
                  </div>
                  <Input
                    value={
                      form.audioFileUrl.startsWith("data:")
                        ? ""
                        : form.audioFileUrl
                    }
                    onChange={(e) =>
                      setForm((p) => ({ ...p, audioFileUrl: e.target.value }))
                    }
                    placeholder="Or paste audio URL (e.g. https://...)"
                    style={inputStyle}
                  />
                  {form.audioFileUrl && (
                    <div className="flex flex-col gap-2">
                      {/* biome-ignore lint/a11y/useMediaCaption: audio file preview */}
                      <audio
                        controls
                        src={form.audioFileUrl}
                        style={{ width: "100%", height: 36, opacity: 0.85 }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, audioFileUrl: "" }))
                        }
                        style={{
                          color: "#EF4444",
                          background: "transparent",
                          border: "none",
                          fontSize: "0.7rem",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        Remove audio
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Price INR (₹)
                </Label>
                <Input
                  type="number"
                  value={form.priceINR}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, priceINR: e.target.value }))
                  }
                  placeholder="299"
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Price USD ($)
                </Label>
                <Input
                  type="number"
                  value={form.priceUSD}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, priceUSD: e.target.value }))
                  }
                  placeholder="3.99"
                  style={inputStyle}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Razorpay URL (INR)
                </Label>
                <Input
                  value={form.razorpayUrlINR}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, razorpayUrlINR: e.target.value }))
                  }
                  placeholder="https://rzp.io/..."
                  style={inputStyle}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label style={{ color: "#888", fontSize: "0.75rem" }}>
                  Razorpay URL (USD)
                </Label>
                <Input
                  value={form.razorpayUrlUSD}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, razorpayUrlUSD: e.target.value }))
                  }
                  placeholder="https://rzp.io/..."
                  style={inputStyle}
                />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, isActive: v }))
                  }
                />
                <Label style={{ color: "#aaa" }}>
                  Active (visible in store)
                </Label>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <Button
                data-ocid="admin.audiobooks.cancel_button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
                style={{ borderColor: "rgba(212,175,55,0.2)", color: "#888" }}
              >
                Cancel
              </Button>
              <Button
                data-ocid="admin.audiobooks.save_button"
                className="flex-1 font-bold"
                disabled={saving}
                onClick={handleSave}
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                  color: "#0a0a0a",
                }}
              >
                {saving ? "Saving..." : editItem ? "Update" : "Create"}
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
            <AlertDialogTitle>Delete this audiobook?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "#666" }}>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.audiobooks.cancel_button"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#888",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.audiobooks.delete_button"
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
