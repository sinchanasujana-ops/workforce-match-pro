import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Phone, Star, UserRound, Check, X, Sparkles, FileText, ShieldCheck, Loader2 } from "lucide-react";
import { KIND_LABEL, VerificationBadge, formatSize, openDocument, type WorkerDocument } from "@/components/worker/WorkerDocuments";
import { Skeleton } from "@/components/ui/skeleton";
import { SkillMeter } from "@/components/site/SkillMeter";
import { Reveal } from "@/components/site/Reveal";

type ApplicationStatus = "pending" | "shortlisted" | "hired" | "rejected";

type Applicant = {
  id: string;
  worker_id: string;
  status: ApplicationStatus;
  message: string | null;
  created_at: string;
  jobs: { id: string; title: string } | null;
  worker: {
    full_name: string;
    phone: string | null;
    trade: string | null;
    category: string | null;
    experience_years: number | null;
    location: string | null;
  } | null;
};

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  pending: "bg-secondary text-secondary-foreground",
  shortlisted: "bg-accent/20 text-accent-foreground",
  hired: "bg-success/15 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "Pending",
  shortlisted: "Shortlisted",
  hired: "Accepted",
  rejected: "Rejected",
};

export function ApplicantsPanel({ jobIds }: { jobIds: string[] }) {
  const [rows, setRows] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [docsByWorker, setDocsByWorker] = useState<Record<string, WorkerDocument[]>>({});

  useEffect(() => {
    if (jobIds.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id,worker_id,status,message,created_at,jobs(id,title)")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        toast.error("Could not load applicants");
        setLoading(false);
        return;
      }
      const apps = (data ?? []) as unknown as Applicant[];
      const workerIds = [...new Set(apps.map((a) => a.worker_id))];
      const { data: profiles } = workerIds.length
        ? await supabase
            .from("profiles")
            .select("id,full_name,phone,trade,category,experience_years,location")
            .in("id", workerIds)
        : { data: [] as never[] };
      if (cancelled) return;
      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      setRows(apps.map((a) => ({ ...a, worker: (byId.get(a.worker_id) as Applicant["worker"]) ?? null })));
      setLoading(false);

      if (workerIds.length) {
        const { data: docs } = await supabase
          .from("worker_documents")
          .select("*")
          .in("worker_id", workerIds)
          .order("created_at", { ascending: false });
        if (cancelled) return;
        const grouped: Record<string, WorkerDocument[]> = {};
        for (const d of (docs ?? []) as WorkerDocument[]) {
          (grouped[d.worker_id] ??= []).push(d);
        }
        setDocsByWorker(grouped);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [jobIds.join(",")]);

  const setStatus = async (id: string, status: ApplicationStatus) => {
    setBusy(id);
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(
      status === "hired" ? "Applicant accepted 🎉" : status === "rejected" ? "Applicant rejected" : "Applicant shortlisted",
    );
  };

  if (loading)
    return (
      <ul className="mt-4 space-y-3">
        {[0, 1].map((i) => (
          <li key={i} className="rounded-2xl border border-border/70 bg-card p-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-56" />
            <Skeleton className="mt-4 h-2 w-full" />
            <Skeleton className="mt-4 h-9 w-full" />
          </li>
        ))}
      </ul>
    );

  if (rows.length === 0)
    return (
      <p className="mt-3 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No one has applied to your jobs yet.
      </p>
    );

  return (
    <ul className="mt-4 space-y-3">
      {rows.map((a, index) => (
        <Reveal as="li" key={a.id} delay={Math.min(index, 6) * 60}>
        <div className="hover-scale-sm rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-semibold">
                <UserRound className="h-4 w-4 text-primary" />
                {a.worker?.full_name || "Worker"}
              </p>
              <p className="text-sm text-muted-foreground">
                Applied for <span className="font-medium text-foreground">{a.jobs?.title ?? "job"}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                {a.worker?.trade && (
                  <span className="flex items-center gap-1 capitalize">
                    <Sparkles className="h-3 w-3" />
                    {a.worker.trade}
                    {a.worker.category ? ` • ${a.worker.category}` : ""}
                  </span>
                )}
                {a.worker?.experience_years != null && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {a.worker.experience_years} yrs experience
                  </span>
                )}
                {a.worker?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {a.worker.location}
                  </span>
                )}
                {a.worker?.phone && (a.status === "shortlisted" || a.status === "hired") && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {a.worker.phone}
                  </span>
                )}
              </div>
              {a.message && <p className="mt-2 text-sm text-muted-foreground">“{a.message}”</p>}
            </div>
            <Badge className={`hover:bg-inherit ${STATUS_STYLES[a.status]}`}>
              {a.status === "pending" && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {STATUS_LABELS[a.status]}
            </Badge>
          </div>

          <SkillMeter
            className="mt-4 max-w-xs"
            category={(a.worker?.category as "skilled" | "semi-skilled" | "unskilled" | null) ?? null}
            years={a.worker?.experience_years ?? 0}
          />

          <div className="mt-4 rounded-xl border border-border/70 bg-background p-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Credentials
            </p>
            {(docsByWorker[a.worker_id]?.length ?? 0) === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No documents uploaded by this worker yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {docsByWorker[a.worker_id]!.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{d.label || d.file_name}</span>
                      <Badge variant="secondary">{KIND_LABEL[d.kind]}</Badge>
                      <VerificationBadge status={d.verification_status} note={d.verification_note} />
                      <span className="text-xs text-muted-foreground">{formatSize(d.file_size)}</span>
                    </span>
                    <Button size="sm" variant="outline" onClick={() => void openDocument(d.file_path)}>
                      View document
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {a.status !== "shortlisted" && a.status !== "hired" && (
              <Button size="sm" variant="outline" disabled={busy === a.id} onClick={() => setStatus(a.id, "shortlisted")}>
                <Star className="h-4 w-4" /> Shortlist
              </Button>
            )}
            {a.status !== "hired" && (
              <Button size="sm" variant="hero" disabled={busy === a.id} onClick={() => setStatus(a.id, "hired")}>
                {busy === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Accept
              </Button>
            )}
            {a.status !== "rejected" && (
              <Button size="sm" variant="outline" disabled={busy === a.id} onClick={() => setStatus(a.id, "rejected")}>
                <X className="h-4 w-4" /> Reject
              </Button>
            )}
          </div>
        </div>
        </Reveal>
      ))}
    </ul>
  );
}
