import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Briefcase, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";

export function Navbar() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-soft transition-transform group-hover:scale-105">
            <Briefcase className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">Rozgaar</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/jobs" className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground" activeProps={{ className: "bg-secondary text-foreground" }}>
            {t("nav.findJobs")}
          </Link>
          <Link to="/post-job" className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground" activeProps={{ className: "bg-secondary text-foreground" }}>
            {t("nav.hireWorkers")}
          </Link>
          <Link to="/signup" className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground" activeProps={{ className: "bg-secondary text-foreground" }}>
            {t("nav.register")}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {loading ? null : user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  {t("nav.dashboard")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.signOut")}</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth" search={{ redirect: undefined }}>{t("nav.signIn")}</Link>
              </Button>
              <Button asChild size="sm" variant="hero">
                <Link to="/post-job">{t("nav.postJob")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}