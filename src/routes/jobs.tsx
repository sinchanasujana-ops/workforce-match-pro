import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CATEGORIES, type WorkerCategory } from "@/lib/mock-data";
import { MapPin, IndianRupee, Clock, Sparkles, Briefcase, Check, Search, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { MicButton } from "@/components/site/MicButton";
import { LocationField } from "@/components/site/LocationField";

type JobTypeValue = "full-time" | "part-time" | "daily-wage";

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
  job_type: JobTypeValue;
  monthly_pay: number;
};

export const Route = createFileRoute("/jobs")({
  component: JobsPage,
  head: () => ({
    meta: [
      { title: "Find Jobs — KaamSetu" },
      { name: "description", content: "Browse AI-matched jobs for skilled, semi-skilled and unskilled workers across India." },
      { property: "og:title", content: "Find Jobs — KaamSetu" },
      { property: "og:description", content: "Live openings for electricians, plumbers, drivers, cooks, guards, helpers and labourers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const PAGE_SIZE = 9;
const SALARY_BANDS = [
  { value: "any", labelKey: "jobs.salaryAny", min: 0, max: Infinity },
  { value: "under15", labelKey: "jobs.salaryUnder15", min: 1, max: 14999 },
  { value: "15to25", labelKey: "jobs.salary15to25", min: 15000, max: 25000 },
  { value: "25plus", labelKey: "jobs.salary25plus", min: 25001, max: Infinity },
] as const;

function matchScore(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 1000;
  return 78 + (hash % 20);
}

function JobsPage() {
  const { t } = useTranslation();
  const { user, profile } = useProfile();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<WorkerCategory | "all">("all");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState<string>("any");
  const [jobType, setJobType] = useState<JobTypeValue | "any">("any");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    void supabase
      .from("jobs")
      .select("id,title,category,employer_name,location,wage,duration,skills,created_at,job_type,monthly_pay")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error(t("jobs.loadError"));
        setJobs((data as Job[] | null) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

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

  // Default the skill-level filter to the worker's own category so each
  // category sees a different list (until they pick another one manually).
  useEffect(() => {
    if (!categoryTouched && profile?.category) setCategory(profile.category);
  }, [profile, categoryTouched]);

  const pickCategory = (value: WorkerCategory | "all") => {
    setCategoryTouched(true);
    setCategory(value);
  };

  const apply = async (jobId: string) => {
    if (!user) return;
    setApplying(jobId);
    const { error } = await supabase.from("applications").insert({ job_id: jobId, worker_id: user.id });
    setApplying(null);
    if (error) {
      toast.error(error.message.includes("duplicate") ? t("jobs.alreadyApplied") : error.message);
      return;
    }
    setApplied((s) => new Set(s).add(jobId));
    toast.success(t("jobs.applySuccess"));
  };

  const knownLocations = useMemo(() => Array.from(new Set(jobs.map((j) => j.location))).sort(), [jobs]);

  const scoreFor = useMemo(() => {
    const trade = (profile?.trade ?? "").toLowerCase().trim();
    const city = (profile?.location ?? "").split(",")[0]?.toLowerCase().trim() ?? "";
    return (j: Job) => {
      let score = 0;
      if (profile?.category && j.category === profile.category) score += 5;
      if (trade && (j.title.toLowerCase().includes(trade) || j.skills.some((s) => s.toLowerCase().includes(trade)))) score += 3;
      if (city && j.location.toLowerCase().includes(city)) score += 2;
      return score;
    };
  }, [profile]);

  const filtered = useMemo(() => {
    const band = SALARY_BANDS.find((b) => b.value === salary) ?? SALARY_BANDS[0];
    const q = query.trim().toLowerCase();
    const loc = location.trim().toLowerCase();
    const list = jobs.filter((j) => {
      if (category !== "all" && j.category !== category) return false;
      if (jobType !== "any" && j.job_type !== jobType) return false;
      if (band.value !== "any" && (j.monthly_pay < band.min || j.monthly_pay > band.max)) return false;
      if (loc && !j.location.toLowerCase().includes(loc)) return false;
      if (q && !(j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.employer_name.toLowerCase().includes(q))) return false;
      return true;
    });
    if (!profile) return list;
    return [...list].sort((a, b) => scoreFor(b) - scoreFor(a));
  }, [jobs, category, jobType, salary, location, query, profile, scoreFor]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [category, jobType, salary, location, query]);

  const recommended = useMemo(() => {
    if (!profile) return [];
    // Skill level decides the pool first, so skilled / semi-skilled / unskilled
    // workers never see the same recommendations.
    const level = profile.category ?? (category !== "all" ? category : null);
    const pool = level ? jobs.filter((j) => j.category === level) : jobs;
    return [...pool]
      .map((j) => ({ job: j, score: scoreFor(j) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.job);
  }, [jobs, profile, category, scoreFor]);

  const trending = useMemo(() => {
    const pool = category !== "all" ? jobs.filter((j) => j.category === category) : jobs;
    return pool.slice(0, 3);
  }, [jobs, category]);
  const highlight = recommended.length > 0 ? recommended : trending;
  const visible = filtered.slice(0, visibleCount);

  const clearFilters = () => {
    setQuery("");
    setCategoryTouched(true);
    setCategory("all");
    setLocation("");
    setSalary("any");
    setJobType("any");
  };

  const renderCard = (job: Job) => {
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
            {t("jobs.match", { score: matchScore(job.id) })}
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
            <span>{job.duration} • {t(`jobType.${job.job_type}`)}</span>
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
                <Check className="h-4 w-4" /> {t("jobs.applied")}
              </>
            ) : applying === job.id ? (
              t("jobs.applying")
            ) : (
              t("jobs.apply")
            )}
          </Button>
        ) : (
          <Button asChild variant="hero" className="mt-5 w-full">
            <Link to="/auth" search={{ redirect: "/jobs" }}>{t("jobs.signInToApply")}</Link>
          </Button>
        )}
      </article>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border/60 bg-gradient-to-br from-secondary/40 via-background to-background">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              <span>{t("jobs.badge")}</span>
            </div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{t("jobs.heading")}</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">{t("jobs.sub")}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("jobs.searchPlaceholder")}
                  aria-label={t("jobs.searchPlaceholder")}
                  className="h-11 pl-9 pr-28"
                />
                <MicButton onTranscript={(text) => setQuery(text)} className="absolute right-2 top-1/2 -translate-y-1/2 flex-row-reverse" />
              </div>
              <LocationField value={location} onChange={setLocation} knownLocations={knownLocations} />
              <select
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                aria-label={t("jobs.salary")}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {SALARY_BANDS.map((b) => (
                  <option key={b.value} value={b.value}>{t(b.labelKey)}</option>
                ))}
              </select>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobTypeValue | "any")}
                aria-label={t("employer.jobTypeLabel")}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm sm:col-span-2 lg:col-span-1"
              >
                <option value="any">{t("jobType.any")}</option>
                <option value="full-time">{t("jobType.full-time")}</option>
                <option value="part-time">{t("jobType.part-time")}</option>
                <option value="daily-wage">{t("jobType.daily-wage")}</option>
              </select>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm font-medium text-muted-foreground">{t("skillLevel.label")}:</span>
              <FilterChip active={category === "all"} onClick={() => pickCategory("all")}>{t("categories.all")}</FilterChip>
              {CATEGORIES.map((c) => (
                <FilterChip key={c.value} active={category === c.value} onClick={() => pickCategory(c.value)}>
                  {t(`categories.${c.value}`)}
                  {profile?.category === c.value ? <span className="ml-1 text-xs opacity-80">★</span> : null}
                </FilterChip>
              ))}
              <button onClick={clearFilters} className="ml-auto text-sm font-medium text-primary hover:underline">
                {t("jobs.clearFilters")}
              </button>
            </div>
          </div>
        </section>

        {!loading && highlight.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              {recommended.length > 0 ? <Sparkles className="h-5 w-5 text-primary" /> : <TrendingUp className="h-5 w-5 text-primary" />}
              <h2 className="text-2xl font-bold tracking-tight">
                {recommended.length > 0 ? t("jobs.recommended") : t("jobs.trending")}
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {recommended.length > 0 ? t("jobs.recommendedSub") : t("jobs.trendingSub")}
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{highlight.map(renderCard)}</div>
          </section>
        )}

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight">{t("jobs.allJobs")}</h2>
            {!loading && <p className="text-sm text-muted-foreground">{t("jobs.results", { count: filtered.length })}</p>}
          </div>

          {loading ? (
            <p className="mt-6 text-muted-foreground">{t("jobs.loading")}</p>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{visible.map(renderCard)}</div>
          )}

          {!loading && visibleCount < filtered.length && (
            <div className="mt-8 text-center">
              <Button variant="outline" size="xl" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                {t("jobs.loadMore")}
              </Button>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">{t("jobs.empty")}</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/signup">{t("jobs.emptyCta")}</Link>
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
        active ? "bg-primary text-primary-foreground shadow-soft" : "bg-card text-foreground border border-border hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}
