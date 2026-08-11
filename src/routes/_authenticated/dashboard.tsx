import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useAuth";
import { WorkerDashboard } from "@/components/dashboard/WorkerDashboard";
import { EmployerDashboard } from "@/components/dashboard/EmployerDashboard";

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

function DashboardPage() {
  const { profile, user, loading } = useProfile();
  const isEmployer = profile?.role === "employer";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="animate-fade-up text-3xl font-bold tracking-tight sm:text-4xl">
            {profile?.full_name ? `Hello, ${profile.full_name.split(" ")[0]}` : "Your dashboard"}
          </h1>
          <p className="animate-fade-up mt-2 text-muted-foreground [animation-delay:80ms]">
            {loading
              ? "Loading your account…"
              : isEmployer
                ? "Manage your job posts and the applications you've received."
                : "Track your profile and the status of every job you applied to."}
          </p>

          {loading || !user ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-2xl border border-border/70 bg-card p-6">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-4 h-3 w-full" />
                  <Skeleton className="mt-2 h-3 w-2/3" />
                  <Skeleton className="mt-6 h-10 w-full" />
                </div>
              ))}
            </div>
          ) : isEmployer ? (
            <EmployerDashboard profile={profile} userId={user.id} />
          ) : (
            <WorkerDashboard profile={profile} userId={user.id} />
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
