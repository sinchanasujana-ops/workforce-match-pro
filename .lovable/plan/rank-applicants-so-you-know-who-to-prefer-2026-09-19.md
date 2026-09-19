# Rank applicants so you know who to prefer

Today the applications you receive are listed newest-first with no guidance. This adds a fit score and a short AI explanation for each applicant, so when two people apply for the same job you can see instantly who fits better and why.

## What you will see

On "Applications received", each applicant card gets:

- A **Fit score out of 100** badge (with a colour-coded band: strong / good / weak fit, using existing theme colours).
- A one-line **AI reason**, e.g. "6 years as an electrician in Bengaluru, ID and certificate verified — closest match for this job."
- Small **evidence chips** showing what drove the score: skill match, experience, verified documents, same location.
- The list **sorted best-fit first** for each job, with a toggle to switch back to newest-first.
- A "Rank applicants" action per job; while it runs, cards show a subtle loading shimmer, and results are saved so they don't need recomputing on every visit.

## How the score is built (the four factors you chose)

| Factor | Weight | Basis |
| --- | --- | --- |
| Skill match with the job | 40 | Worker's trade and skill level vs the job's category and listed skills |
| Experience | 25 | Years in the trade, capped so 10+ years scores full |
| Verified documents | 20 | Verified ID/certificate scores full, pending partial, none zero |
| Location closeness | 15 | Same city scores full, same state partial, otherwise low |

A deterministic score is computed first from your database, so ranking works even if the AI reason is unavailable. The AI then writes the short explanation and may nudge the ordering between near-ties.

## Technical outline

- Migration: add `application_rankings` table (`application_id` unique, `job_id`, `score` int, `reason` text, `factors` jsonb, `created_at`). GRANTs for `authenticated`/`service_role`; RLS so only the employer who owns the job can select, and only the service path writes.
- New server function `src/lib/ranking.functions.ts`:
  - `rankApplicantsForJob` with `.middleware([requireSupabaseAuth])`; verifies `jobs.employer_id = userId` before reading anything.
  - Loads the job, its applications, applicant profiles and `worker_documents` verification statuses via `context.supabase`.
  - Computes the weighted score in code, then calls Lovable AI (`openai/gpt-6-astra` on the Responses API, streamed and consumed server-side) with a strict-compatible schema returning `{ applicationId, score, reason }[]`; falls back to the computed score with a generated reason on any AI failure.
  - Upserts rows into `application_rankings` and returns them.
- `ApplicantsPanel.tsx`: call via `useServerFn` + `useQuery` (never from a loader), render score badge, reason, factor chips, sort toggle, and skeleton while pending. No colour token changes — reuse existing `success`/`accent`/`muted` styles.
- Gateway errors surfaced per `ai-gateway-error-semantics`: show the message, no silent retries beyond 429/5xx backoff.
