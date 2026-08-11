import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MapPin, IndianRupee, UserRound, Bell, Loader2 } from "lucide-react";
import { SkillMeter } from "@/components/site/SkillMeter";
import { Reveal } from "@/components/site/Reveal";
import type { Profile } from "@/hooks/useAuth";

type MyApplication = {
  id: string;
  status: "pending" | "shortlisted" | "hired" | "rejected";
  created_at: string;
  jobs: { title: string; employer_name: string; location: string; wage: string } | null;
};

const STATUS_LABEL: Record<MyApplication["status"], string> = {
  pending: "Pending",
  shortlisted: "Shortlisted",
  hired: "Accepted",
  rejected: "Rejected",
};

const STATUS_STYLE: Record<MyApplication["status"], string> = {
  pending: "border-accent/40 bg-accent/10 text-accent-foreground",
  shortlisted: "border-primary/40 bg-primary/10 text-primary",
  hired: "border-success/40 bg-success/15 text-success",
  rejected: "border-destructive/40 bg-destructive/10 text-destructive",
};

const SNAPSHOT_KEY = "rozgaar:appStatus";

type Tab = "overview" | "applications";

export function WorkerDashboard({ profile, userId }: { profile: Profile | null; userId: string }) {
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [alerts, setAlerts] = useState<string[]>([]);
  const notified = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void supabase
      .from("applications")
      .select("id,status,created_at,jobs(title,employer_name,location,wage)")
      .eq("worker_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error("Could not load applications");
        const rows = (data as unknown as MyApplication[] | null) ?? [];
        setApplications(rows);
        setLoading(false);

        // Compare against the last seen statuses so workers get notified when
        // an employer accepts or rejects them.
        if (notified.current) return;
        notified.current = true;
        try {
          const raw = localStorage.getItem(SNAPSHOT_KEY);
          const prev = raw ? (JSON.parse(raw) as Record<string, string>) : {};
          const changed: string[] = [];
          for (const r of rows) {
            const before = prev[r.id];
            if (before && before !== r.status && (r.status === "hired" || r.status === "rejected")) {
              const msg = `${r.jobs?.title ?? "Your application"} — ${STATUS_LABEL[r.status]}`;
              changed.push(msg);
              if (r.status === "hired") toast.success(msg);
              else toast.error(msg);
            }
          }
          setAlerts(changed);
          localStorage.setItem(
            SNAPSHOT_KEY,
            JSON.stringify(Object.fromEntries(rows.map((r) => [r.id, r.status]))),
          );
        } catch {
          /* storage unavailable — notifications are best-effort */
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const withdraw = async (id: string) => {
    setWithdrawing(id);
    const { error } = await supabase.from("applications").delete().eq("id", id);
    setWithdrawing(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setApplications((as) => as.filter((a) => a.id !== id));
    toast.success("Application withdrawn");
  };

  const counts = {
    total: applications.length,
    accepted: applications.filter((a) => a.status === "hired").length,
    pending: applications.filter((a) => a.status === "pending" || a.status === "shortlisted").length,
  };

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>Overview</TabButton>
        <TabButton active={tab === "applications"} onClick={() => setTab("applications")}>
          My applications{applications.length ? ` (${applications.length})` : ""}
        </TabButton>
        {alerts.length > 0 && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Bell className="h-3.5 w-3.5 animate-float-slow" />
            {alerts.length} status update{alerts.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {tab === "overview" ? (
        <div key="overview" className="animate-tab-in mt-6 grid gap-5 sm:grid-cols-2">
          <div className="hover-lift rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-6 shadow-soft">
            <div className="flex items-center gap-2 text-primary">
              <UserRound className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">Worker profile</span>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Name" value={profile?.full_name || "—"} />
              <Row label="Phone" value={profile?.phone || "—"} />
              <Row label="Trade" value={profile?.trade || "—"} />
              <Row label="Experience" value={profile?.experience_years != null ? `${profile.experience_years} yrs` : "—"} />
              <Row label="Location" value={profile?.location || "—"} />
            </dl>
            <SkillMeter className="mt-5" category={profile?.category ?? null} years={profile?.experience_years ?? 0} />
            <Button asChild variant="outline" className="mt-5 w-full">
              <Link to="/signup">{profile?.trade ? "Edit my profile" : "Complete my profile"}</Link>
            </Button>
          </div>

          <div className="hover-lift rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-6 shadow-soft">
            <div className="flex items-center gap-2 text-primary">
              <IndianRupee className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">At a glance</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat value={counts.total} label="Applied" />
              <Stat value={counts.pending} label="In review" />
              <Stat value={counts.accepted} label="Accepted" />
            </div>
            <SkillMeter className="mt-5" variant="circle" category={profile?.category ?? null} years={profile?.experience_years ?? 0} />
            <Button asChild variant="hero" className="mt-5 w-full">
              <Link to="/jobs">Find jobs for me</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div key="applications" className="animate-tab-in mt-6">
          {loading ? (
            <ul className="space-y-3">
              {[0, 1, 2].map((i) => (
                <li key={i} className="rounded-2xl border border-border/70 bg-card p-5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-2 h-3 w-24" />
                  <Skeleton className="mt-3 h-3 w-56" />
                </li>
              ))}
            </ul>
          ) : applications.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No applications yet. <Link to="/jobs" className="text-primary hover:underline">Find a job</Link>
            </p>
          ) : (
            <ul className="space-y-3">
              {applications.map((a, i) => (
                <Reveal as="li" key={a.id} delay={Math.min(i, 6) * 60}>
                  <div className="hover-scale-sm flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                    <div>
                      <p className="font-semibold">{a.jobs?.title ?? "Job removed"}</p>
                      <p className="text-sm text-muted-foreground">{a.jobs?.employer_name}</p>
                      <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {a.jobs?.location && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{a.jobs.location}</span>
                        )}
                        {a.jobs?.wage && (
                          <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{a.jobs.wage}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[a.status]}`}>
                        {a.status === "pending" && <Loader2 className="h-3 w-3 animate-spin" />}
                        {STATUS_LABEL[a.status]}
                      </span>
                      {a.status !== "hired" && (
                        <Button size="sm" variant="outline" disabled={withdrawing === a.id} onClick={() => withdraw(a.id)}>
                          {withdrawing === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Withdraw"}
                        </Button>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
        active ? "bg-primary text-primary-foreground shadow-soft" : "border border-border bg-card text-foreground hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-4 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}