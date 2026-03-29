import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

export default function AdminBio() {
  const { actor } = useActor();
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!actor) return;
    actor
      .getAuthorBio()
      .then((b) => {
        setBio(b);
      })
      .catch(() => {
        // error ignored
      })
      .finally(() => {
        setLoading(false);
      });
  }, [actor]);

  async function handleSave() {
    if (!actor) return;
    setSaving(true);
    try {
      await actor.updateAuthorBio(bio);
      toast.success("Author bio updated");
    } catch {
      toast.error("Failed to save");
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
    <div className="flex flex-col gap-6 max-w-4xl">
      <p className="text-sm" style={{ color: "#555" }}>
        Edit the author biography shown on the public About page.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="rounded-xl p-5 flex flex-col gap-3" style={cardStyle}>
          <Label
            className="text-xs uppercase tracking-widest"
            style={{ color: "#666" }}
          >
            Edit Bio
          </Label>
          <Textarea
            data-ocid="admin.bio.textarea"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write the author biography here..."
            rows={14}
            disabled={loading}
            style={{ ...inputStyle, minHeight: 300, resize: "vertical" }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "#555" }}>
              {bio.length} characters
            </span>
            <Button
              data-ocid="admin.bio.save_button"
              disabled={saving || loading}
              onClick={handleSave}
              style={{
                background: "linear-gradient(135deg, #D4AF37, #F0D060)",
                color: "#0a0a0a",
                fontWeight: 700,
              }}
            >
              {saving ? "Saving..." : "Save Bio"}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl p-5" style={cardStyle}>
          <Label
            className="text-xs uppercase tracking-widest block mb-4"
            style={{ color: "#666" }}
          >
            Preview
          </Label>
          <div
            className="rounded-xl p-5"
            style={{
              background: "rgba(10,10,10,0.8)",
              border: "1px solid rgba(212,175,55,0.1)",
            }}
          >
            <div className="text-center mb-4">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl"
                style={{
                  background: "rgba(212,175,55,0.1)",
                  border: "1px solid rgba(212,175,55,0.2)",
                }}
              >
                ✍️
              </div>
              <h3
                className="font-bold"
                style={{
                  fontFamily: "Playfair Display, serif",
                  color: "#D4AF37",
                }}
              >
                O. Chiddarwar
              </h3>
              <p className="text-xs" style={{ color: "rgba(212,175,55,0.5)" }}>
                Author
              </p>
            </div>
            <div
              className="w-12 h-px mx-auto mb-4"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #D4AF37, transparent)",
              }}
            />
            <p
              className="text-sm leading-relaxed text-center italic"
              style={{
                color: "#aaa",
                fontFamily: "Playfair Display, serif",
                minHeight: 80,
              }}
            >
              {bio || (
                <span style={{ color: "#444" }}>
                  Bio preview will appear here...
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
