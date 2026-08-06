import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, type WorkerCategory } from "@/lib/mock-data";
import { useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: [
      { title: "Worker Registration — KaamSetu" },
      { name: "description", content: "Register as a worker — get AI-matched to jobs that suit your skills, location and experience." },
    ],
  }),
});

function SignupPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<WorkerCategory>("skilled");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Profile created! Finding your best job matches…");
    setTimeout(() => navigate({ to: "/jobs" }), 1400);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Free for workers, always
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Create your profile</h1>
            <p className="mt-3 text-muted-foreground">
              Takes 2 minutes. Our AI then matches you to jobs nearby — automatically.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 rounded-3xl border border-border/70 bg-[image:var(--gradient-card)] p-6 shadow-soft sm:p-8">
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block text-base">I am a…</Label>
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
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" required placeholder="Ramesh Kumar" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label htmlFor="phone">Mobile number</Label>
                  <Input id="phone" required type="tel" placeholder="+91 98765 43210" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label htmlFor="trade">Main trade / skill</Label>
                  <Input id="trade" required placeholder="Electrician, Mason, Helper…" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label htmlFor="experience">Years of experience</Label>
                  <Input id="experience" required type="number" min="0" placeholder="3" className="mt-1.5 h-11" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="location">City / village</Label>
                  <Input id="location" required placeholder="Pune, Maharashtra" className="mt-1.5 h-11" />
                </div>
              </div>
            </div>

            <Button type="submit" variant="hero" size="xl" className="mt-8 w-full" disabled={submitted}>
              {submitted ? "Creating profile…" : "Find my matches"}
            </Button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Already registered?{" "}
              <Link to="/jobs" className="font-medium text-primary hover:underline">View jobs</Link>
            </p>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}