import { Link } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                <Briefcase className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold">Rozgaar</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">{t("footer.forWorkers")}</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/signup" className="hover:text-foreground">{t("nav.register")}</Link></li>
              <li><Link to="/jobs" className="hover:text-foreground">{t("footer.browseJobs")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">{t("footer.forEmployers")}</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/post-job" className="hover:text-foreground">{t("nav.postJob")}</Link></li>
              <li><Link to="/jobs" className="hover:text-foreground">{t("footer.browseTalent")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}