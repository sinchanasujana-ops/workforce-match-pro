import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useAuth";
import { Briefcase, MapPin, IndianRupee, UserRound, Building2, Users } from "lucide-react";
import { toast } from "sonner";
import { ApplicantsPanel } from "@/components/dashboard/ApplicantsPanel";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "My Dashboard — Rozgaar" },
      { name: "description", content: "Track your Rozgaar profile, job applications and posted jobs in one place." },
      { property: "og:title", content: "My Dashboard — Rozgaar" },
      { property: "og:description", content: "Your saved profile, applications and job postings on Rozgaar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type MyApplication = {
  id: string;
  status: string;
  created_at: string;
  jobs: { title: string; employer_name: string; location: string; wage: string } | null;
};

type MyJob = {
  id: string;
  title: string;
  location: string;
  wage: string;
  is_active: boolean;
  applications: { count: number }[];
};

function DashboardPage() {
  const { profile, user, loading } = useProfile();
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [myJobs, setMyJobs] = useState<MyJob[]>([]);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void supabase
      .from("applications")
      .select("id,status,created_at,jobs(title,employer_name,location,wage)")
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error("Could not load applications");
        setApplications((data as unknown as MyApplication[] | null) ?? []);
      });
    void supabase
      .from("jobs")
      .select("id,title,location,wage,is_active,applications(count)")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setMyJobs((data as unknown as MyJob[] | null) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isEmployer = profile?.role === "employer" || myJobs.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {profile?.full_name ? `Hello, ${profile.full_name.split(" ")[0]}` : "Your dashboard"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isEmployer ? "Manage your job posts and applicants." : "Track your profile and applications."}
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-6 shadow-soft">
              <div className="flex items-center gap-2 text-primary">
                {isEmployer ? <Building2 className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                <span className="text-sm font-semibold uppercase tracking-wide">
                  {isEmployer ? "Employer profile" : "Worker profile"}
                </span>
              </div>
              {loading ? (
                <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
              ) : (
                <dl className="mt-4 space-y-2 text-sm">
                  <Row label="Name" value={profile?.full_name || "—"} />
                  <Row label="Phone" value={profile?.phone || "—"} />
                  {isEmployer ? (
                    <Row label="Company" value={profile?.company_name || "—"} />
                  ) : (
                    <>
                      <Row label="Trade" value={profile?.trade || "—"} />
                      <Row label="Category" value={profile?.category || "—"} />
                      <Row label="Experience" value={profile?.experience_years != null ? `${profile.experience_years} yrs` : "—"} />
                      <Row label="Location" value={profile?.location || "—"} />
                    </>
                  )}
                </dl>
              )}
              <Button asChild variant="outline" className="mt-5 w-full">
                <Link to="/signup">{profile?.trade ? "Edit worker profile" : "Complete worker profile"}</Link>
              </Button>
            </div>

            <div className="rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-6 shadow-soft">
              <div className="flex items-center gap-2 text-primary">
                <Users className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">At a glance</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Stat value={applications.length} label="Applications sent" />
                <Stat value={myJobs.length} label="Jobs posted" />
              </div>
              <div className="mt-5 grid gap-2">
                <Button asChild variant="hero">
                  <Link to="/jobs">Browse jobs</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/post-job">Post a job</Link>
                </Button>
              </div>
            </div>
          </div>

          <h2 className="mt-12 text-xl font-semibold">My applications</h2>
          {applications.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No applications yet. <Link to="/jobs" className="text-primary hover:underline">Find a job</Link>
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {applications.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-5">
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
                    <Badge variant="secondary" className="capitalize">{a.status}</Badge>
                    {a.status !== "hired" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={withdrawing === a.id}
                        onClick={() => withdraw(a.id)}
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {myJobs.length > 0 && (
            <>
              <h2 className="mt-12 text-xl font-semibold">My job posts</h2>
              <ul className="mt-4 space-y-3">
                {myJobs.map((j) => (
                  <li key={j.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-5">
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
                      {(j.applications?.[0]?.count ?? 0)} applicant{(j.applications?.[0]?.count ?? 0) === 1 ? "" : "s"}
                    </Badge>
                  </li>
                ))}
              </ul>

              <h2 className="mt-12 text-xl font-semibold">Applicants</h2>
              <p className="mt-1 text-sm text-muted-foreground">Shortlist, hire or reject workers who applied to your jobs.</p>
              <ApplicantsPanel jobIds={myJobs.map((j) => j.id)} />
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
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
    <div className="rounded-xl bg-secondary/60 p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
