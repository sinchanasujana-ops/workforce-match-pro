import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Trash2, Upload, ShieldCheck, ExternalLink, BadgeCheck, Clock, XCircle } from "lucide-react";

export const BUCKET = "worker-documents";

export type DocumentKind = "id_proof" | "certificate" | "other";

export const DOC_KINDS: { value: DocumentKind; label: string }[] = [
  { value: "id_proof", label: "ID proof (Aadhaar, voter ID…)" },
  { value: "certificate", label: "Skill certificate / ITI" },
  { value: "other", label: "Other document" },
];

export const KIND_LABEL: Record<DocumentKind, string> = {
  id_proof: "ID proof",
  certificate: "Certificate",
  other: "Document",
};

export type WorkerDocument = {
  id: string;
  worker_id: string;
  kind: DocumentKind;
  label: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  verification_status: VerificationStatus;
  verified_at: string | null;
  verification_note: string | null;
};

export type VerificationStatus = "pending" | "verified" | "rejected";

export function VerificationBadge({ status, note }: { status: VerificationStatus; note?: string | null }) {
  const map = {
    verified: { label: "Verified", Icon: BadgeCheck, cls: "border-primary/40 bg-primary/10 text-primary" },
    pending: { label: "Pending review", Icon: Clock, cls: "border-accent/40 bg-accent/10 text-accent-foreground" },
    rejected: { label: "Not accepted", Icon: XCircle, cls: "border-destructive/40 bg-destructive/10 text-destructive" },
  }[status ?? "pending"];
  const { label, Icon, cls } = map;
  return (
    <span
      title={note ?? undefined}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";

export function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function openDocument(filePath: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 300);
  if (error || !data?.signedUrl) {
    toast.error("Could not open this document");
    return;
  }
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

export function WorkerDocuments({ userId }: { userId: string | undefined }) {
  const [docs, setDocs] = useState<WorkerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<DocumentKind>("id_proof");
  const [label, setLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userId) {
      setDocs([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    void supabase
      .from("worker_documents")
      .select("*")
      .eq("worker_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setDocs((data ?? []) as WorkerDocument[]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!userId || !file) {
      toast.error("Choose a file first");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File is too large — max 5 MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
    if (upErr) {
      setUploading(false);
      toast.error(upErr.message);
      return;
    }
    const { data, error } = await supabase
      .from("worker_documents")
      .insert({
        worker_id: userId,
        kind,
        label: label.trim().slice(0, 100),
        file_path: path,
        file_name: file.name.slice(0, 200),
        file_size: file.size,
        mime_type: file.type || null,
      })
      .select("*")
      .single();
    setUploading(false);
    if (error || !data) {
      await supabase.storage.from(BUCKET).remove([path]);
      toast.error(error?.message ?? "Upload failed");
      return;
    }
    setDocs((d) => [data as WorkerDocument, ...d]);
    setLabel("");
    if (fileRef.current) fileRef.current.value = "";
    toast.success("Document uploaded");
  };

  const handleDelete = async (doc: WorkerDocument) => {
    const { error } = await supabase.from("worker_documents").delete().eq("id", doc.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.storage.from(BUCKET).remove([doc.file_path]);
    setDocs((d) => d.filter((x) => x.id !== doc.id));
    toast.success("Document removed");
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Documents &amp; certificates</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload your ID proof and any skill certificates. Only employers you apply to can view them.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="doc-kind">Document type</Label>
          <select
            id="doc-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as DocumentKind)}
            className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {DOC_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="doc-label">Title (optional)</Label>
          <Input
            id="doc-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="ITI Electrician certificate"
            className="mt-1.5 h-11"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="doc-file">File (JPG, PNG or PDF · max 5 MB)</Label>
          <Input id="doc-file" ref={fileRef} type="file" accept={ACCEPT} className="mt-1.5" />
        </div>
      </div>

      <Button type="button" variant="warm" className="mt-4" onClick={handleUpload} disabled={uploading || !userId}>
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading…" : "Upload document"}
      </Button>

      <div className="mt-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading documents…</p>
        ) : docs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            No documents uploaded yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-background p-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    {d.label || d.file_name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <VerificationBadge status={d.verification_status} note={d.verification_note} />
                    <span className="text-xs text-muted-foreground">
                      {formatSize(d.file_size)} {d.file_size ? "· " : ""}
                      {new Date(d.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{KIND_LABEL[d.kind]}</Badge>
                  <Button type="button" size="sm" variant="outline" onClick={() => void openDocument(d.file_path)}>
                    <ExternalLink className="h-4 w-4" /> View
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => void handleDelete(d)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}