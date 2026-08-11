import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Briefcase, MapPin, IndianRupee, Users } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { ApplicantsPanel } from "@/components/dashboard/ApplicantsPanel";
import type { Profile } from "@/hooks/useAuth";

type MyJob = {
  id: string;
  title: string;
  location: string;
  wage: string;
  is_active: boolean;
  applications: { count: number }[];
};

type Tab = "jobs" | "applicants";

export function EmployerDashboard({ profile, userId }: { profile: Profile | null; userId: string }) {
  const [myJobs, setMyJobs] = useState<MyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("jobs");

  useEffect(() => {
    let cancelled = false;
    void supabase
      .from("jobs")
      .select("id,title,location,wage,is_active,applications(count)")
      .eq("employer_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setMyJobs((data as unknown as MyJob[] | null) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const totalApplicants = myJobs.reduce((sum, j) => sum + (j.applications?.[0]?.count ?? 0), 0);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <TabButton active={tab === "jobs"} onClick={() => setTab("jobs")}>My job posts{myJobs.length ? ` (${myJobs.length})` : ""}</TabButton>
        <TabButton active={tab === "applicants"} onClick={() => setTab("applicants")}>
          Applications received{totalApplicants ? ` (${totalApplicants})` : ""}
        </TabButton>
      </div>

      {tab === "jobs" ? (
        <div key="jobs" className="animate-tab-in mt-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="hover-lift rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-6 shadow-soft">
              <div className="flex items-center gap-2 text-primary">
                <Building2 className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">Employer profile</span>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Name" value={profile?.full_name || "—"} />
                <Row label="Phone" value={profile?.phone || "—"} />
                <Row label="Company" value={profile?.company_name || "—"} />
              </dl>
              <Button asChild variant="hero" className="mt-5 w-full">
                <Link to="/post-job">Post a new job</Link>
              </Button>
            </div>
            <div className="hover-lift rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-6 shadow-soft">
              <div className="flex items-center gap-2 text-primary">
                <Users className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">At a glance</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Stat value={myJobs.length} label="Jobs posted" />
                <Stat value={totalApplicants} label="Applications" />
              </div>
              <Button variant="outline" className="mt-5 w-full" onClick={() => setTab("applicants")}>
                Review applicants
              </Button>
            </div>
          </div>

          <h2 className="mt-10 text-xl font-semibold">My job posts</h2>
          {loading ? (
            <ul className="mt-4 space-y-3">
              {[0, 1].map((i) => (
                <li key={i} className="rounded-2xl border border-border/70 bg-card p-5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="mt-2 h-3 w-32" />
                </li>
              ))}
            </ul>
          ) : myJobs.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              You haven't posted any jobs yet.{" "}
              <Link to="/post-job" className="text-primary hover:underline">Post your first job</Link>
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {myJobs.map((j, i) => (
                <Reveal as="li" key={j.id} delay={Math.min(i, 6) * 60}>
                  <div className="hover-scale-sm flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                    <div>
                      <p className="flex items-center gap-2 font-semibold">
                        <Briefcase className="h-4 w-4 text-primary" />
                        {j.title}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>
                        <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{j.wage}</span>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {j.applications?.[0]?.count ?? 0} applicant{(j.applications?.[0]?.count ?? 0) === 1 ? "" : "s"}
                    </Badge>
                  </div>
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div key="applicants" className="animate-tab-in mt-6">
          <h2 className="text-xl font-semibold">Applications received</h2>
          <p className="mt-1 text-sm text-muted-foreground">Accept or reject workers who applied to your jobs.</p>
          {loading ? (
            <ul className="mt-4 space-y-3">
              {[0, 1].map((i) => (
                <li key={i} className="rounded-2xl border border-border/70 bg-card p-5">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="mt-2 h-3 w-64" />
                  <Skeleton className="mt-4 h-9 w-full" />
                </li>
              ))}
            </ul>
          ) : (
            <ApplicantsPanel jobIds={myJobs.map((j) => j.id)} />
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