import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SkillCategory = "skilled" | "semi-skilled" | "unskilled";

const BASE: Record<SkillCategory, number> = {
  skilled: 80,
  "semi-skilled": 55,
  unskilled: 32,
};

export function proficiency(category?: SkillCategory | null, years?: number | null) {
  const base = category ? BASE[category] : 40;
  const bonus = Math.min(Math.max(years ?? 0, 0), 10) * 2;
  return Math.min(base + bonus, 100);
}

/**
 * Animated proficiency meter. Fills in when scrolled into view.
 * Motion only — colours come from existing theme tokens.
 */
export function SkillMeter({
  category,
  years,
  label,
  variant = "bar",
  className,
}: {
  category?: SkillCategory | null;
  years?: number | null;
  label?: string;
  variant?: "bar" | "circle";
  className?: string;
}) {
  const value = proficiency(category, years);
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const text = label ?? (category ? category.replace("-", " ") : "not set");

  if (variant === "circle") {
    return (
      <div ref={ref} className={cn("flex items-center gap-3", className)}>
        <div
          className="rz-meter-circle relative h-14 w-14 shrink-0 rounded-full"
          style={{ ["--rz-meter" as string]: `${shown ? value : 0}%` }}
        >
          <span className="absolute inset-1.5 flex items-center justify-center rounded-full bg-card text-xs font-bold">
            {shown ? value : 0}%
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Skill level</p>
          <p className="truncate text-sm font-semibold capitalize">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium capitalize text-muted-foreground">{text}</span>
        <span className="text-xs font-semibold tabular-nums">{shown ? value : 0}%</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="rz-meter-bar h-full rounded-full bg-primary"
          style={{ width: `${shown ? value : 0}%` }}
        />
      </div>
    </div>
  );
}