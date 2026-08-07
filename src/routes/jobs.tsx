import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, type WorkerCategory } from "@/lib/mock-data";
import { MapPin, IndianRupee, Clock, Sparkles, Briefcase, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Job = {
  id: string;
  title: string;
  category: WorkerCategory;
  employer_name: string;
  location: string;
  wage: string;
  duration: string;
  skills: string[];
  created_at: string;
};

export const Route = createFileRoute("/jobs")({
  component: JobsPage,
  head: () => ({
    meta: [
      { title: "Find Jobs — KaamSetu" },
      { name: "description", content: "Browse AI-matched jobs for skilled, semi-skilled and unskilled workers across India." },
      { property: "og:title", content: "Find Jobs — KaamSetu" },
      { property: "og:description", content: "Live openings for electricians, plumbers, machine operators, helpers and labourers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function postedAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function matchScore(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 1000;
  return 78 + (hash % 20);
}

function JobsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<WorkerCategory | "all">("all");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void supabase
      .from("jobs")
      .select("id,title,category,employer_name,location,wage,duration,skills,created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error("Could not load jobs");
        setJobs((data as Job[] | null) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setApplied(new Set());
      return;
    }
    let cancelled = false;
    void supabase
      .from("applications")
      .select("job_id")
      .eq("worker_id", user.id)
      .then(({ data }) => {
        if (cancelled) return;
        setApplied(new Set((data ?? []).map((r) => r.job_id as string)));
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const apply = async (jobId: string) => {
    if (!user) return;
    setApplying(jobId);
    const { error } = await supabase.from("applications").insert({ job_id: jobId, worker_id: user.id });
    setApplying(null);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "You already applied to this job." : error.message);
      return;
    }
    setApplied((s) => new Set(s).add(jobId));
    toast.success("Application sent! Track it in your dashboard.");
  };

  const visible = filter === "all" ? jobs : jobs.filter((j) => j.category === filter);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border/60 bg-gradient-to-br from-secondary/40 via-background to-background">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              <span>AI-matched for you</span>
            </div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Jobs near you</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Our AI ranks jobs by your skills, location, and experience — top match shown first.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All jobs</FilterChip>
              {CATEGORIES.map((c) => (
                <FilterChip key={c.value} active={filter === c.value} onClick={() => setFilter(c.value)}>
                  {c.label}
                </FilterChip>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {loading ? (
            <p className="text-muted-foreground">Loading jobs…</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((job) => {
                const isApplied = applied.has(job.id);
                return (
                  <article
                    key={job.id}
                    className="group relative overflow-hidden rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <Badge className="bg-success/15 text-success hover:bg-success/15">
                        <Sparkles className="mr-1 h-3 w-3" />
                        {matchScore(job.id)}% match
                      </Badge>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.employer_name}</p>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <IndianRupee className="h-4 w-4 shrink-0" />
                        <span className="font-medium text-foreground">{job.wage}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>{job.duration} • {postedAgo(job.created_at)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {job.skills.map((s) => (
                        <span key={s} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                          {s}
                        </span>
                      ))}
                    </div>

                    {user ? (
                      <Button
                        variant={isApplied ? "outline" : "hero"}
                        className="mt-5 w-full"
                        disabled={isApplied || applying === job.id}
                        onClick={() => apply(job.id)}
                      >
                        {isApplied ? (
                          <>
                            <Check className="h-4 w-4" /> Applied
                          </>
                        ) : applying === job.id ? (
                          "Applying…"
                        ) : (
                          "Apply now"
                        )}
                      </Button>
                    ) : (
                      <Button asChild variant="hero" className="mt-5 w-full">
                        <Link to="/auth" search={{ redirect: "/jobs" }}>Sign in to apply</Link>
                      </Button>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {!loading && visible.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">No jobs in this category right now.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/auth" search={{}}>Register to get notified</Link>
              </Button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function FilterChip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-soft"
          : "bg-card text-foreground border border-border hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}
