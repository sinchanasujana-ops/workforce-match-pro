# Verify the applicant ranking feature step by step

The build error is fixed and the app renders. This plan confirms the ranking feature (fit score, AI reason, evidence chips, best-fit sorting, saved results) actually works end to end, and leaves you with a checklist you can repeat yourself anytime.

## Part 1 — What I will test for you

1. **Setup check** — confirm at least one employer job exists with 2 or more worker applications (the ranking needs at least two applicants to compare). If none exists, create test applications first.
2. **Employer view** — sign in as the employer (I mint a test session), open Dashboard → "Applications received":
   - "Rank applicants by fit" button is visible per job.
   - Clicking it shows a loading shimmer on the cards, then a success message.
   - Each card shows a **score out of 100** with a colour band (strong / good / weak fit), a **one-line reason**, and **evidence chips** (skill match, experience, documents, location).
   - The list is ordered **best fit first**; the toggle switches back to newest-first and again to fit order.
3. **Persistence** — reload the page: scores and reasons are still shown without clicking the rank button again (they are saved in the database).
4. **Score sanity** — verify the ordering makes sense: the applicant whose trade matches the job, with verified documents and the same city, should outrank a mismatched/unverified applicant.
5. **Worker privacy** — sign in as one of the worker accounts and confirm their dashboard shows only their own application status, with no scores or rankings visible.
6. Report back with screenshots of each step and fix anything that fails.

## Part 2 — Your manual checklist (anytime, ~2 minutes)

1. Sign in as an **employer** account.
2. Open **Dashboard** → scroll to the job with applications.
3. Click **"Rank applicants by fit"** and wait a few seconds.
4. Check each applicant card for: score /100 badge, short reason line, small chips under it.
5. Confirm the strongest-looking applicant (matching trade, verified docs, same city) is at the top.
6. Toggle the sort control between **best fit** and **newest** — the order changes.
7. Refresh the page — the scores are still there.
8. (Optional) Sign in as a worker and confirm they see only their application status, never scores.

## Notes

- The score is computed from your database first (skill 40 / experience 25 / documents 20 / location 15), so ranking still works even if the AI explanation service is briefly unavailable — you'd just see a plainer reason line.
- If the AI service is rate-limited, you'll see a clear "AI is busy, try again" message instead of a silent failure.
