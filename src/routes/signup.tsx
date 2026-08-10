import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, type WorkerCategory } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useAuth";
import { WorkerDocuments } from "@/components/worker/WorkerDocuments";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: [
      { title: "Worker Profile — Rozgaar" },
      { name: "description", content: "Complete your worker profile — get AI-matched to jobs that suit your skills, location and experience." },
      { property: "og:title", content: "Worker Profile — Rozgaar" },
      { property: "og:description", content: "Save your trade, experience and location so Rozgaar can match you to nearby jobs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SignupPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, user, loading } = useProfile();
  const [category, setCategory] = useState<WorkerCategory>("skilled");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    trade: "",
    experience_years: "",
    location: "",
  });

  useEffect(() => {
    if (!profile) return;
    if (profile.category) setCategory(profile.category);
    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      trade: profile.trade ?? "",
      experience_years: profile.experience_years != null ? String(profile.experience_years) : "",
      location: profile.location ?? "",
    });
  }, [profile]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitted(true);
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        role: "worker" as const,
        full_name: form.full_name.trim().slice(0, 100),
        phone: form.phone.trim().slice(0, 20),
        trade: form.trade.trim().slice(0, 100),
        experience_years: Number(form.experience_years) || 0,
        location: form.location.trim().slice(0, 120),
        category,
      },
      { onConflict: "id" },
    );
    if (error) {
      setSubmitted(false);
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved! Finding your best job matches…");
    setTimeout(() => navigate({ to: "/jobs" }), 900);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              {t("home.freeForWorkers")}
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{t("worker.heading")}</h1>
            <p className="mt-3 text-muted-foreground">{t("worker.sub")}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 rounded-3xl border border-border/70 bg-[image:var(--gradient-card)] p-6 shadow-soft sm:p-8">
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block text-base">{t("worker.iAm")}</Label>
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
                          <span className="font-semibold">{t(`categories.${c.value}`)}</span>
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
                  <Label htmlFor="name">{t("worker.fullName")}</Label>
                  <Input id="name" required value={form.full_name} onChange={set("full_name")} placeholder="Ramesh Kumar" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label htmlFor="phone">{t("worker.mobile")}</Label>
                  <Input id="phone" required type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label htmlFor="trade">{t("worker.trade")}</Label>
                  <Input id="trade" required value={form.trade} onChange={set("trade")} placeholder="Electrician, Mason, Helper…" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label htmlFor="experience">{t("worker.experience")}</Label>
                  <Input id="experience" required type="number" min="0" value={form.experience_years} onChange={set("experience_years")} placeholder="3" className="mt-1.5 h-11" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="location">{t("worker.city")}</Label>
                  <Input id="location" required value={form.location} onChange={set("location")} placeholder="Pune, Maharashtra" className="mt-1.5 h-11" />
                </div>
              </div>
            </div>

            {user ? (
              <>
                <Button type="submit" variant="hero" size="xl" className="mt-8 w-full" disabled={submitted || loading}>
                  {submitted ? t("worker.saving") : t("worker.save")}
                </Button>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  <Link to="/dashboard" className="font-medium text-primary hover:underline">{t("worker.goToDashboard")}</Link>
                </p>
              </>
            ) : (
              <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-sm text-muted-foreground">{t("worker.signInPrompt")}</p>
                <Button asChild variant="hero" size="xl" className="mt-4 w-full">
                  <Link to="/auth" search={{ redirect: "/signup" }}>{t("nav.signIn")}</Link>
                </Button>
              </div>
            )}
          </form>

          {user && (
            <div className="mt-6">
              <WorkerDocuments userId={user.id} />
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
