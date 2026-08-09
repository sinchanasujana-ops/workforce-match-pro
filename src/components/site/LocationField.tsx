import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, Loader2, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { reverseGeocode, suggestLocations } from "@/lib/locations";

export function LocationField({
  value,
  onChange,
  knownLocations = [],
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  knownLocations?: string[];
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => suggestLocations(value, knownLocations), [value, knownLocations]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const detect = () => {
    setNote(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setNote(t("location.unavailable"));
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const name = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setDetecting(false);
        if (name) {
          onChange(name);
          setOpen(false);
        } else {
          setNote(t("location.unavailable"));
        }
      },
      () => {
        setDetecting(false);
        setNote(t("location.denied"));
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <div ref={wrapRef} className="relative">
      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? t("jobs.locationPlaceholder")}
        aria-label={t("jobs.location")}
        autoComplete="off"
        className="h-11 pl-9 pr-11"
      />
      <button
        type="button"
        onClick={detect}
        disabled={detecting}
        aria-label={t("location.detect")}
        title={t("location.detect")}
        className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
      >
        {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
      </button>

      {detecting && <p className="mt-1 text-xs text-muted-foreground">{t("location.detecting")}</p>}
      {note && !detecting && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-[var(--shadow-elegant)]">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary"
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
