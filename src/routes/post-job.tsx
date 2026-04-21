import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, type WorkerCategory } from "@/lib/mock-data";
import { useState } from "react";
import { CheckCircle2, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/post-job")({
  component: PostJobPage,
  head: () => ({
    meta: [
      { title: "Post a Job — KaamSetu" },
      { name: "description", content: "Hire skilled, semi-skilled or unskilled workers. AI matches your job to the best candidates instantly." },
    ],
  }),
});

function PostJobPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<WorkerCategory>("skilled");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Job posted! AI is finding your best candidates…");
    setTimeout(() => navigate({ to: "/jobs" }), 1400);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-accent-foreground">
              <Users className="h-4 w-4" />
              Verified worker network
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Post a job</h1>
            <p className="mt-3 text-muted-foreground">
              Reach thousands of pre-screened workers. AI shortlists the best matches in seconds.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 rounded-3xl border border-border/70 bg-[image:var(--gradient-card)] p-6 shadow-soft sm:p-8">
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block text-base">Worker type needed</Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {CATEGORIES.map((c) => {
                    const active = category === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategory(c.value)}
                        className={`rounded-xl border-2 p-4 text-left transition-all ${
                          active
                            ? "border-primary bg-primary/5 shadow-soft"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{c.label}</span>
                          {active && <CheckCircle2 className="h-5 w-5 text-primary" />}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{c.examples}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="title">Job title</Label>
                  <Input id="title" required placeholder="Senior Electrician needed" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label htmlFor="company">Company name</Label>
                  <Input id="company" required placeholder="Sunrise Constructions" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label htmlFor="loc">Job location</Label>
                  <Input id="loc" required placeholder="Bengaluru, Karnataka" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label htmlFor="wage">Wage offered</Label>
                  <Input id="wage" required placeholder="₹950 / day or ₹22,000 / month" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label htmlFor="dur">Duration</Label>
                  <Input id="dur" required placeholder="6 months / Permanent" className="mt-1.5 h-11" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="desc">Job description</Label>
                  <Textarea id="desc" required rows={4} placeholder="Describe the work, skills required and any benefits like food, housing, etc." className="mt-1.5" />
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">AI matching enabled</p>
                    <p className="text-xs text-muted-foreground">
                      Once posted, our AI ranks all registered workers by skills, location and experience — you'll see top candidates instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" variant="hero" size="xl" className="mt-8 w-full" disabled={submitted}>
              {submitted ? "Posting job…" : "Post job & find matches"}
            </Button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}