import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/mock-data";
import heroImage from "@/assets/hero-workers.jpg";
import { Reveal } from "@/components/site/Reveal";
import {
  Sparkles,
  MapPin,
  Brain,
  ShieldCheck,
  IndianRupee,
  ArrowRight,
  CheckCircle2,
  Users,
  Briefcase,
  Languages,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Rozgaar — AI Job Exchange for Blue-Collar Workers" },
      { name: "description", content: "AI-powered employment exchange matching skilled, semi-skilled and unskilled workers with the right jobs across India." },
      { property: "og:title", content: "Rozgaar — AI Job Exchange for Blue-Collar Workers" },
      { property: "og:description", content: "AI matches workers to jobs and employers to workers — built for India's blue-collar workforce." },
    ],
  }),
});

function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Reveal><Stats /></Reveal>
        <Reveal><Categories /></Reveal>
        <Reveal><HowItWorks /></Reveal>
        <Reveal><ForEmployers /></Reveal>
        <Reveal><FinalCTA /></Reveal>
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-secondary/60 via-background to-background" />
      <div className="animate-blob absolute right-0 top-0 -z-10 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      <div className="animate-blob absolute -left-20 bottom-0 -z-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl [animation-delay:-7s]" />

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-8 lg:px-8 lg:py-24">
        <div>
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            AI-powered job matching
          </div>
          <h1 className="animate-fade-up mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl [animation-delay:80ms]">
            Right job, right worker —{" "}
            <span className="bg-gradient-to-br from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              matched by AI.
            </span>
          </h1>
          <p className="animate-fade-up mt-5 max-w-xl text-lg text-muted-foreground [animation-delay:160ms]">
            India's first AI-driven employment exchange built for blue-collar workers. Skilled,
            semi-skilled or unskilled — find work that pays fairly, near you.
          </p>

          <div className="animate-fade-up mt-8 flex flex-wrap gap-3 [animation-delay:240ms]">
            <Button asChild variant="hero" size="xl">
              <Link to="/signup">
                I'm looking for work <ArrowRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="warm" size="xl">
              <Link to="/post-job">I'm hiring workers</Link>
            </Button>
          </div>

          <div className="animate-fade-up mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground [animation-delay:320ms]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Free for workers
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Verified employers
            </div>
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-success" />
              Hindi, Tamil, Bangla & more
            </div>
          </div>
        </div>

        <div className="animate-fade-in-soft relative [animation-delay:200ms]">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-accent/20 to-transparent blur-2xl" />
          <img
            src={heroImage}
            alt="Indian blue-collar workers — electrician, plumber, construction worker — smiling together"
            width={1536}
            height={1024}
            className="rounded-3xl shadow-[var(--shadow-elegant)] ring-1 ring-border/50"
          />
          <div className="animate-float-slow absolute -bottom-6 -left-6 hidden rounded-2xl border border-border/70 bg-card/95 p-4 shadow-[var(--shadow-elegant)] backdrop-blur sm:block">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">AI match found</p>
                <p className="text-sm font-semibold">96% — Electrician, Bengaluru</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { value: "50k+", label: "Workers registered" },
    { value: "12k+", label: "Active jobs" },
    { value: "94%", label: "Avg. match accuracy" },
    { value: "₹680", label: "Avg. daily wage" },
  ];
  return (
    <section className="border-y border-border/60 bg-secondary/30">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center transition-transform hover:-translate-y-0.5">
            <div className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for every worker</h2>
        <p className="mt-3 text-muted-foreground">
          From master electricians to first-day labourers — AI finds the right opportunity for every skill level.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {CATEGORIES.map((c, i) => (
          <div
            key={c.value}
            className="group relative overflow-hidden rounded-3xl border border-border/70 bg-[image:var(--gradient-card)] p-7 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-elegant)]"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                i === 0 ? "bg-primary/10 text-primary" : i === 1 ? "bg-accent/15 text-accent-foreground" : "bg-success/15 text-success"
              }`}
            >
              {i === 0 ? <Briefcase className="h-6 w-6" /> : i === 1 ? <Users className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
            </div>
            <h3 className="mt-5 text-xl font-semibold">{c.label}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{c.description}</p>
            <div className="mt-4 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Examples:</span> {c.examples}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Users,
      title: "Tell us about you",
      desc: "Share your skill, experience and location in 2 minutes — no resume needed.",
    },
    {
      icon: Brain,
      title: "AI finds your matches",
      desc: "Our AI ranks every job by how well it fits your skills, distance and pay needs.",
    },
    {
      icon: IndianRupee,
      title: "Apply & start earning",
      desc: "Connect directly with verified employers. No middlemen, no commissions.",
    },
  ];
  return (
    <section className="bg-gradient-to-b from-background to-secondary/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Brain className="h-4 w-4" />
            How it works
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">From profile to paycheck in 3 steps</h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="hover-lift relative rounded-3xl border border-border/70 bg-card p-7 shadow-soft">
              <div className="absolute -top-4 left-7 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-sm font-bold text-primary-foreground shadow-soft">
                {i + 1}
              </div>
              <s.icon className="h-7 w-7 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForEmployers() {
  const benefits = [
    "AI shortlists best-fit workers in seconds",
    "Verified profiles with skill ratings",
    "Hire by the day, week or permanent",
    "Reach workers in 200+ districts",
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] bg-[image:var(--gradient-hero)] p-8 text-primary-foreground shadow-[var(--shadow-elegant)] sm:p-12 lg:p-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur">
              <Users className="h-4 w-4" />
              For employers
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Hire reliable workers, faster.
            </h2>
            <p className="mt-3 max-w-lg text-primary-foreground/85">
              Whether you need 1 plumber or 100 construction helpers — AI brings the right
              candidates to you, instantly.
            </p>
            <Button asChild variant="warm" size="xl" className="mt-8">
              <Link to="/post-job">
                Post a job free <ArrowRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <ul className="space-y-3">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur transition-transform duration-300 hover:translate-x-1">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-glow" />
                <span className="font-medium">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <MapPin className="mx-auto h-10 w-10 text-primary" />
      <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Your next job is closer than you think.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
        Join 50,000+ workers already getting matched to better-paying jobs near them.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild variant="hero" size="xl">
          <Link to="/signup">Register as a worker</Link>
        </Button>
        <Button asChild variant="outline" size="xl">
          <Link to="/jobs">Browse jobs</Link>
        </Button>
      </div>
    </section>
  );
}
