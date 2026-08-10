import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { HardHat, Building2, Sparkles, MailCheck } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
  }),
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in or Register — Rozgaar" },
      { name: "description", content: "Sign in to Rozgaar to save your worker or employer profile and track job applications." },
      { property: "og:title", content: "Sign in or Register — Rozgaar" },
      { property: "og:description", content: "Create a free Rozgaar account to get AI-matched to blue-collar jobs across India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const credsSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(72),
});

function safePath(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.4 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-2.8-.4-4.1H24v8.4h12.5c-.3 2.1-1.6 5.2-4.6 7.3l7.7 6c4.5-4.2 6.5-10.2 6.5-17.6z" />
      <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.7 24c0-1.6.3-3.2.8-4.6l-7.9-6.2A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.2z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.6-5.8l-7.7-6c-2.1 1.4-4.8 2.4-7.9 2.4-6.3 0-11.6-3.9-13.5-9.4l-7.9 6.2C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"worker" | "employer">("worker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const dest = safePath(search.redirect, "/dashboard");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: dest, replace: true });
    });
  }, [dest, navigate]);

  const describeAuthError = (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    const lower = message.toLowerCase();
    if (lower.includes("already registered") || lower.includes("already been registered")) {
      return "This email is already registered. Please sign in instead.";
    }
    if (lower.includes("rate limit") || lower.includes("too many")) {
      return "We couldn't send the verification email right now (sending limit reached). Please try again in a few minutes.";
    }
    if (lower.includes("error sending") || lower.includes("smtp") || lower.includes("email")) {
      return "Account created, but the verification email could not be sent. Please try 'Resend email' or contact support.";
    }
    return message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credsSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid details");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { role, full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        // Supabase returns a user with no identities when the email already exists.
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          toast.error("This email is already registered. Please sign in instead.");
          setMode("signin");
          return;
        }
        if (!data.session) {
          setPendingEmail(parsed.data.email);
          toast.success(`Verification email sent to ${parsed.data.email}. Check inbox and spam.`);
          return;
        }
        toast.success("Welcome to Rozgaar!");
        navigate({ to: role === "employer" ? "/post-job" : "/signup", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Signed in");
        navigate({ to: dest, replace: true });
      }
    } catch (err) {
      const friendly = describeAuthError(err);
      toast.error(friendly);
      if (friendly.startsWith("This email is already registered")) setMode("signin");
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: pendingEmail,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast.success("Verification email sent again.");
    } catch (err) {
      toast.error(describeAuthError(err));
    } finally {
      setResending(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      sessionStorage.setItem("rozgaar:redirect", dest);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in failed. Please try again.");
        return;
      }
      if (result.redirected) return;
      navigate({ to: dest, replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
          <div className="animate-fade-up text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Free for workers, always
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to see your matches and applications."
                : "One account for your profile, jobs and applications."}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="animate-fade-up mt-8 rounded-3xl border border-border/70 bg-[image:var(--gradient-card)] p-6 shadow-soft transition-shadow duration-300 hover:shadow-[var(--shadow-elegant)] [animation-delay:90ms]"
          >
            {pendingEmail && (
              <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Confirm your email</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      We sent a verification link to {pendingEmail}. Check your inbox and spam folder — you must
                      confirm before signing in.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={handleResend}
                      disabled={resending}
                    >
                      {resending ? "Sending…" : "Resend email"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div className="mb-5">
                <Label className="mb-3 block">I am a…</Label>
                <div className="grid grid-cols-2 gap-3">
                  <RoleCard active={role === "worker"} onClick={() => setRole("worker")} label="Worker" hint="Looking for jobs">
                    <HardHat className="h-5 w-5" />
                  </RoleCard>
                  <RoleCard active={role === "employer"} onClick={() => setRole("employer")} label="Employer" hint="Hiring workers">
                    <Building2 className="h-5 w-5" />
                  </RoleCard>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {mode === "signup" && (
                <div>
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} placeholder="Ramesh Kumar" className="mt-1.5 h-11" />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="mt-1.5 h-11" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 6 characters" className="mt-1.5 h-11" />
              </div>
            </div>

            <Button type="submit" variant="hero" size="xl" className="mt-6 w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleGoogle} disabled={busy}>
              <GoogleIcon />
              {mode === "signup" ? "Sign up with Google" : "Continue with Google"}
            </Button>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              {mode === "signin" ? "New to Rozgaar?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              <Link to="/jobs" className="hover:underline">Browse jobs without an account</Link>
            </p>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function RoleCard({
  active,
  onClick,
  label,
  hint,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 p-4 text-left transition-all ${
        active ? "border-primary bg-primary/5 shadow-soft" : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <span className={active ? "text-primary" : "text-muted-foreground"}>{children}</span>
      <p className="mt-2 font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </button>
  );
}