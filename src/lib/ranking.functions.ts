import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({ jobId: z.string().uuid() });

export type RankFactors = {
  skill: number;
  experience: number;
  documents: number;
  location: number;
};

export type Ranking = {
  application_id: string;
  score: number;
  reason: string;
  factors: RankFactors;
};

const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();

function parts(location: string | null | undefined) {
  return norm(location)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

const CATEGORY_ORDER = ["unskilled", "semi-skilled", "skilled"] as const;

function skillScore(
  jobCategory: string,
  jobSkills: string[],
  jobTitle: string,
  workerCategory: string | null,
  trade: string | null,
) {
  const ji = CATEGORY_ORDER.indexOf(jobCategory as (typeof CATEGORY_ORDER)[number]);
  const wi = CATEGORY_ORDER.indexOf((workerCategory ?? "") as (typeof CATEGORY_ORDER)[number]);
  let categoryScore = 0.25;
  if (ji >= 0 && wi >= 0) {
    const gap = Math.abs(ji - wi);
    categoryScore = gap === 0 ? 1 : gap === 1 ? 0.55 : 0.2;
  }

  const t = norm(trade);
  let tradeScore = 0.2;
  if (t) {
    const haystack = [norm(jobTitle), ...jobSkills.map(norm)].join(" ");
    if (haystack.includes(t)) tradeScore = 1;
    else if (t.split(/\s+/).some((w) => w.length > 3 && haystack.includes(w))) tradeScore = 0.6;
  }

  return 40 * (0.6 * categoryScore + 0.4 * tradeScore);
}

function locationScore(jobLocation: string, workerLocation: string | null) {
  const a = parts(jobLocation);
  const b = parts(workerLocation);
  if (!a.length || !b.length) return 4;
  if (a[0] && b[0] && a[0] === b[0]) return 15;
  const overlap = a.some((x) => b.includes(x));
  return overlap ? 8 : 3;
}

function documentScore(statuses: string[]) {
  if (statuses.includes("verified")) return 20;
  if (statuses.includes("pending")) return 8;
  return 0;
}

function fallbackReason(f: RankFactors, years: number, trade: string | null, verified: boolean, sameCity: boolean) {
  const bits: string[] = [];
  bits.push(trade ? `${years} yrs as ${trade}` : `${years} yrs experience`);
  bits.push(verified ? "documents verified" : "documents not verified yet");
  if (sameCity) bits.push("same city as the job");
  if (f.skill >= 30) bits.push("skills closely match this job");
  return `${bits.join(", ")}.`;
}

async function aiReasons(
  key: string,
  jobLabel: string,
  rows: Array<{ id: string; label: string; score: number }>,
): Promise<Record<string, { score?: number; reason?: string }>> {
  const body = {
    model: "openai/gpt-6-astra",
    stream: true,
    reasoning: { effort: "low", summary: "auto" },
    store: false,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "You help an Indian employer compare blue-collar job applicants. For each applicant, keep the given score unless a near-tie clearly deserves a nudge of at most 4 points, and write one short plain-English sentence (max 20 words) saying why this applicant fits the job. Be concrete: mention trade, years, verified documents or location. No flattery, no invented facts.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Job: ${jobLabel}\n\nApplicants:\n${rows
              .map((r) => `- id=${r.id} | computed_score=${r.score} | ${r.label}`)
              .join("\n")}`,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "applicant_rankings",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            rankings: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  applicationId: { type: "string" },
                  score: { type: "integer" },
                  reason: { type: "string" },
                },
                required: ["applicationId", "score", "reason"],
              },
            },
          },
          required: ["rankings"],
        },
      },
    },
  };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429) throw new Error("rate_limit");
  if (res.status === 402) throw new Error("credits");
  if (!res.ok || !res.body) throw new Error(`ai_error_${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") text += evt.delta;
        if (evt.type === "response.completed" && evt.response?.output_text) {
          text = evt.response.output_text;
        }
      } catch {
        // ignore malformed keep-alive lines
      }
    }
  }

  const out: Record<string, { score?: number; reason?: string }> = {};
  if (!text.trim()) return out;
  try {
    const parsed = JSON.parse(text) as {
      rankings?: Array<{ applicationId?: string; score?: number; reason?: string }>;
    };
    for (const r of parsed.rankings ?? []) {
      if (r.applicationId) out[r.applicationId] = { score: r.score, reason: r.reason };
    }
  } catch {
    // leave empty; caller falls back
  }
  return out;
}

export const rankApplicantsForJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id,title,category,skills,location,employer_id")
      .eq("id", data.jobId)
      .maybeSingle();
    if (jobError) throw new Error(jobError.message);
    if (!job || job.employer_id !== userId) throw new Error("Not allowed");

    const { data: apps, error: appError } = await supabase
      .from("applications")
      .select("id,worker_id")
      .eq("job_id", job.id);
    if (appError) throw new Error(appError.message);
    if (!apps || apps.length === 0) return { rankings: [] as Ranking[], aiUsed: false };

    const workerIds = [...new Set(apps.map((a) => a.worker_id))];

    const [{ data: profiles }, { data: docs }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,full_name,trade,category,experience_years,location")
        .in("id", workerIds),
      supabase.from("worker_documents").select("worker_id,kind,verification_status").in("worker_id", workerIds),
    ]);

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
    const statusByWorker = new Map<string, string[]>();
    for (const d of docs ?? []) {
      const list = statusByWorker.get(d.worker_id) ?? [];
      list.push(d.verification_status);
      statusByWorker.set(d.worker_id, list);
    }

    const computed = apps.map((a) => {
      const p = profileById.get(a.worker_id);
      const statuses = statusByWorker.get(a.worker_id) ?? [];
      const years = Math.max(0, p?.experience_years ?? 0);
      const factors: RankFactors = {
        skill: Math.round(
          skillScore(job.category, job.skills ?? [], job.title, p?.category ?? null, p?.trade ?? null),
        ),
        experience: Math.round((25 * Math.min(years, 10)) / 10),
        documents: documentScore(statuses),
        location: locationScore(job.location, p?.location ?? null),
      };
      const score = Math.max(
        0,
        Math.min(100, factors.skill + factors.experience + factors.documents + factors.location),
      );
      const sameCity = factors.location === 15;
      return {
        application_id: a.id,
        score,
        factors,
        reason: fallbackReason(factors, years, p?.trade ?? null, statuses.includes("verified"), sameCity),
        label: `${p?.full_name || "Worker"}, trade=${p?.trade || "unknown"}, level=${p?.category || "unknown"}, experience=${years}yrs, location=${p?.location || "unknown"}, documents=${statuses.length ? statuses.join("/") : "none"}`,
      };
    });

    let aiUsed = false;
    const key = process.env["LOVABLE_API_KEY"];
    if (key) {
      try {
        const ai = await aiReasons(
          key,
          `${job.title} (${job.category}) in ${job.location}; skills needed: ${(job.skills ?? []).join(", ") || "not specified"}`,
          computed.map((c) => ({ id: c.application_id, label: c.label, score: c.score })),
        );
        for (const c of computed) {
          const a = ai[c.application_id];
          if (!a) continue;
          aiUsed = true;
          if (typeof a.reason === "string" && a.reason.trim()) c.reason = a.reason.trim();
          if (typeof a.score === "number" && Number.isFinite(a.score)) {
            const bounded = Math.max(c.score - 4, Math.min(c.score + 4, Math.round(a.score)));
            c.score = Math.max(0, Math.min(100, bounded));
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "ai_error";
        if (msg === "rate_limit") throw new Error("AI is busy right now. Please try again in a moment.");
        if (msg === "credits") throw new Error("AI credits are exhausted. Add credits to use AI ranking.");
        // any other AI failure: keep the computed scores and reasons
      }
    }

    const rows: Ranking[] = computed
      .map((c) => ({
        application_id: c.application_id,
        score: c.score,
        reason: c.reason,
        factors: c.factors,
      }))
      .sort((a, b) => b.score - a.score);

    const { error: upsertError } = await supabase
      .from("application_rankings")
      .upsert(
        rows.map((r) => ({
          application_id: r.application_id,
          job_id: job.id,
          score: r.score,
          reason: r.reason,
          factors: r.factors as unknown as Record<string, number>,
        })),
        { onConflict: "application_id" },
      );
    if (upsertError) throw new Error(upsertError.message);

    return { rankings: rows, aiUsed };
  });
