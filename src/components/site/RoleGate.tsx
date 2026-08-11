import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ShieldCheck } from "lucide-react";

/**
 * Shown when a signed-in account opens a page meant for the other role.
 * Keeps worker and employer surfaces strictly separate.
 */
export function RoleGate({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
          <div className="animate-fade-up rounded-3xl border border-border/70 bg-[image:var(--gradient-card)] p-8 shadow-soft">
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{description}</p>
            <Button asChild variant="hero" size="xl" className="mt-6 w-full">
              <Link to="/dashboard">Go to my dashboard</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}