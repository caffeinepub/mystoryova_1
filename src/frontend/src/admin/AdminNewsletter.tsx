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
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Mail, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

export default function AdminNewsletter() {
  const { actor } = useActor();
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteEmail, setDeleteEmail] = useState<string | null>(null);

  async function load() {
    if (!actor) return;
    const data = await actor.getSubscribers();
    setSubscribers(data);
    setLoading(false);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable
  useEffect(() => {
    if (actor) load();
  }, [actor]);

  async function handleRemove() {
    if (!actor || !deleteEmail) return;
    try {
      await actor.removeSubscriber(deleteEmail);
      toast.success("Subscriber removed");
      setDeleteEmail(null);
      await load();
    } catch {
      toast.error("Failed to remove");
    }
  }

  function exportCSV() {
    const csv = ["Email", ...filtered].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = subscribers.filter(
    (e) => !search || e.toLowerCase().includes(search.toLowerCase()),
  );

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
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-5" style={cardStyle}>
          <p
            className="text-xs uppercase tracking-widest mb-2"
            style={{ color: "#666" }}
          >
            Total Subscribers
          </p>
          {loading ? (
            <Skeleton
              className="h-8 w-16"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
          ) : (
            <span className="text-3xl font-bold" style={{ color: "#D4AF37" }}>
              {subscribers.length}
            </span>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          data-ocid="admin.newsletter.search_input"
          style={inputStyle}
        />
        <Button
          data-ocid="admin.newsletter.secondary_button"
          variant="outline"
          size="sm"
          onClick={exportCSV}
          style={{ borderColor: "rgba(212,175,55,0.2)", color: "#D4AF37" }}
        >
          <Download size={14} className="mr-1" /> Export CSV
        </Button>
      </div>

      {/* Subscribers list */}
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        {loading ? (
          <div className="p-5 flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-10"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            data-ocid="admin.newsletter.empty_state"
            className="p-10 text-center"
            style={{ color: "#555" }}
          >
            {search
              ? "No subscribers match your search."
              : "No subscribers yet."}
          </div>
        ) : (
          <div>
            <div
              className="px-4 py-2.5 text-xs uppercase tracking-wider"
              style={{
                background: "rgba(0,0,0,0.2)",
                color: "#555",
                borderBottom: "1px solid rgba(212,175,55,0.1)",
              }}
            >
              Email Address
            </div>
            {filtered.map((email, i) => (
              <div
                key={email}
                data-ocid={`admin.newsletter.row.${i + 1}`}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center gap-3">
                  <Mail size={14} style={{ color: "rgba(212,175,55,0.5)" }} />
                  <span className="text-sm" style={{ color: "#f0ead6" }}>
                    {email}
                  </span>
                </div>
                <button
                  type="button"
                  data-ocid={`admin.newsletter.delete_button.${i + 1}`}
                  onClick={() => setDeleteEmail(email)}
                  className="p-1.5 rounded"
                  style={{
                    color: "#EF4444",
                    background: "rgba(239,68,68,0.08)",
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteEmail}
        onOpenChange={(o) => !o && setDeleteEmail(null)}
      >
        <AlertDialogContent
          style={{
            background: "#111",
            border: "1px solid rgba(212,175,55,0.2)",
            color: "#f0ead6",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Remove subscriber?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "#666" }}>
              {deleteEmail} will be removed from the newsletter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.newsletter.cancel_button"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#888",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.newsletter.delete_button"
              onClick={handleRemove}
              style={{ background: "#EF4444", color: "#fff" }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
