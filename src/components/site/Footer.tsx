import { Link } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                <Briefcase className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold">KaamSetu</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              AI-powered employment exchange built for India's blue-collar workforce.
              Skilled, semi-skilled and unskilled — every worker matters.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">For workers</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/signup" className="hover:text-foreground">Register</Link></li>
              <li><Link to="/jobs" className="hover:text-foreground">Browse jobs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">For employers</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/post-job" className="hover:text-foreground">Post a job</Link></li>
              <li><Link to="/jobs" className="hover:text-foreground">Browse talent</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} KaamSetu. Built with care for every worker.
        </div>
      </div>
    </footer>
  );
}