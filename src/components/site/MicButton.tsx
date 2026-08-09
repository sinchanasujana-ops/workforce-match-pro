import { Mic, MicOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { cn } from "@/lib/utils";

export function MicButton({ onTranscript, className }: { onTranscript: (text: string) => void; className?: string }) {
  const { t, i18n } = useTranslation();
  const { supported, listening, error, toggle } = useSpeechRecognition({
    lang: i18n.language,
    onResult: onTranscript,
  });

  if (!supported) {
    return (
      <span
        className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}
        title={t("voice.unsupported")}
      >
        <MicOff className="h-4 w-4" />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-label={listening ? t("voice.listening") : t("voice.start")}
        aria-pressed={listening}
        title={listening ? t("voice.listening") : t("voice.start")}
        className={cn(
          "relative inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          listening ? "bg-destructive text-destructive-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
      >
        {listening && <span className="absolute inset-0 animate-ping rounded-full bg-destructive/40" />}
        <Mic className="relative h-4 w-4" />
      </button>
      {listening && <span className="text-xs font-medium text-destructive">{t("voice.listening")}</span>}
      {!listening && error && error !== "aborted" && (
        <span className="text-xs text-muted-foreground">{error === "not-allowed" ? t("voice.denied") : t("voice.error")}</span>
      )}
    </span>
  );
}
