import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_JOBS, CATEGORIES, type WorkerCategory } from "@/lib/mock-data";
import { MapPin, IndianRupee, Clock, Sparkles, Briefcase } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/jobs")({
  component: JobsPage,
  head: () => ({
    meta: [
      { title: "Find Jobs — KaamSetu" },
      { name: "description", content: "Browse AI-matched jobs for skilled, semi-skilled and unskilled workers across India." },
    ],
  }),
});

function JobsPage() {
  const [filter, setFilter] = useState<WorkerCategory | "all">("all");
  const jobs = filter === "all" ? MOCK_JOBS : MOCK_JOBS.filter((j) => j.category === filter);

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
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
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
                    {job.matchScore}% match
                  </Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{job.title}</h3>
                <p className="text-sm text-muted-foreground">{job.employer}</p>

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
                    <span>{job.duration} • {job.postedAgo}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {job.skills.map((s) => (
                    <span key={s} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                      {s}
                    </span>
                  ))}
                </div>

                <Button variant="hero" className="mt-5 w-full" size="default">
                  Apply now
                </Button>
              </article>
            ))}
          </div>

          {jobs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">No jobs in this category right now.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/signup">Register to get notified</Link>
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