import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, type WorkerCategory } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { RoleGate } from "@/components/site/RoleGate";

export const Route = createFileRoute("/post-job")({
  component: PostJobPage,
  head: () => ({
    meta: [
      { title: "Post a Job — Rozgaar" },
      { name: "description", content: "Hire skilled, semi-skilled or unskilled workers. AI matches your job to the best candidates instantly." },
      { property: "og:title", content: "Post a Job — Rozgaar" },
      { property: "og:description", content: "Reach thousands of verified blue-collar workers across India in minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const JOB_TYPES = ["full-time", "part-time", "daily-wage"] as const;
type JobTypeValue = (typeof JOB_TYPES)[number];

function estimateMonthlyPay(wage: string, jobType: JobTypeValue) {
  const digits = wage.replace(/[^\d]/g, "");
  const amount = Number(digits);
  if (!amount) return 0;
  if (jobType === "daily-wage" && amount < 5000) return Math.round(amount * 26);
  if (jobType === "part-time" && amount < 5000) return Math.round(amount * 26);
  return amount;
}

function PostJobPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, user } = useProfile();
  const [category, setCategory] = useState<WorkerCategory>("skilled");
  const [jobType, setJobType] = useState<JobTypeValue>("full-time");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    title: "",
    employer_name: "",
    location: "",
    wage: "",
    duration: "",
    description: "",
    skills: "",
  });

  useEffect(() => {
    if (profile?.company_name) setForm((f) => ({ ...f, employer_name: f.employer_name || profile.company_name! }));
  }, [profile]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const isWorkerAccount = !!user && profile?.role === "worker";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitted(true);

    const skills = form.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10);

    const { error } = await supabase.from("jobs").insert({
      employer_id: user.id,
      title: form.title.trim().slice(0, 120),
      category,
      job_type: jobType,
      monthly_pay: estimateMonthlyPay(form.wage, jobType),
      employer_name: form.employer_name.trim().slice(0, 120),
      location: form.location.trim().slice(0, 120),
      wage: form.wage.trim().slice(0, 80),
      duration: form.duration.trim().slice(0, 80),
      description: form.description.trim().slice(0, 2000),
      skills,
    });

    if (error) {
      setSubmitted(false);
      toast.error(error.message);
      return;
    }

    await supabase
      .from("profiles")
      .upsert({ id: user.id, role: "employer" as const, company_name: form.employer_name.trim().slice(0, 120) }, { onConflict: "id" });

    toast.success("Job posted! AI is finding your best candidates…");
    setTimeout(() => navigate({ to: "/jobs" }), 900);
  };

  return (
    isWorkerAccount ? (
      <RoleGate
        title="This page is for employers"
        description="You're signed in with a worker account, so hiring tools are hidden. Head back to your worker dashboard to track applications and find jobs."
      />
    ) : (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-accent-foreground">
              <Users className="h-4 w-4" />
              {t("home.verifiedEmployers")}
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{t("employer.heading")}</h1>
            <p className="mt-3 text-muted-foreground">{t("employer.sub")}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 rounded-3xl border border-border/70 bg-[image:var(--gradient-card)] p-6 shadow-soft sm:p-8">
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block text-base">{t("employer.workerType")}</Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {CATEGORIES.map((c) => {
                    const active = category === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategory(c.value)}
                        className={`rounded-xl border-2 p-4 text-left transition-all ${
                          active ? "border-primary bg-primary/5 shadow-soft" : "border-border bg-card hover:border-primary/40"
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
                <div className="sm:col-span-2">
                  <Label htmlFor="title">{t("employer.jobTitle")}</Label>
                  <Input id="title" required value={form.title} onChange={set("title")} placeholder="Senior Electrician needed" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label htmlFor="company">{t("employer.company")}</Label>
                  <Input id="company" required value={form.employer_name} onChange={set("employer_name")} placeholder="Sunrise Constructions" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label htmlFor="loc">{t("employer.jobLocation")}</Label>
                  <Input id="loc" required value={form.location} onChange={set("location")} placeholder="Bengaluru, Karnataka" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label htmlFor="wage">{t("employer.wage")}</Label>
                  <Input id="wage" required value={form.wage} onChange={set("wage")} placeholder="₹950 / day or ₹22,000 / month" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label htmlFor="jobtype">{t("employer.jobTypeLabel")}</Label>
                  <select
                    id="jobtype"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as JobTypeValue)}
                    className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {JOB_TYPES.map((jt) => (
                      <option key={jt} value={jt}>{t(`jobType.${jt}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="dur">{t("employer.duration")}</Label>
                  <Input id="dur" required value={form.duration} onChange={set("duration")} placeholder="6 months / Permanent" className="mt-1.5 h-11" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="skills">{t("employer.skills")}</Label>
                  <Input id="skills" value={form.skills} onChange={set("skills")} placeholder="Wiring, Panel installation, Safety certified" className="mt-1.5 h-11" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="desc">{t("employer.description")}</Label>
                  <Textarea id="desc" required rows={4} value={form.description} onChange={set("description")} placeholder="Describe the work, skills required and any benefits like food, housing, etc." className="mt-1.5" />
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">{t("home.heroBadge")}</p>
                    <p className="text-xs text-muted-foreground">{t("employer.sub")}</p>
                  </div>
                </div>
              </div>
            </div>

            {user ? (
              <Button type="submit" variant="hero" size="xl" className="mt-8 w-full" disabled={submitted}>
                {submitted ? t("employer.posting") : t("employer.post")}
              </Button>
            ) : (
              <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-sm text-muted-foreground">{t("employer.signInPrompt")}</p>
                <Button asChild variant="hero" size="xl" className="mt-4 w-full">
                  <Link to="/auth" search={{ redirect: "/post-job" }}>{t("nav.signIn")}</Link>
                </Button>
              </div>
            )}
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
