import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) }))
    .min(1)
    .max(20),
  lang: z.enum(["en", "hi", "kn"]).default("en"),
});

const LANG_NAME: Record<string, string> = { en: "English", hi: "Hindi", kn: "Kannada" };

const SYSTEM = `You are "Setu", the friendly helper inside KaamSetu — an AI employment exchange for India's blue-collar workers (skilled, semi-skilled, unskilled).

Answer in the SAME language the user wrote in. If unsure, use the app language given below. Never mix scripts.
Keep answers very short (max 3 short sentences or 3 bullets), simple words, warm and encouraging. Many users are not tech-savvy.

What you know about the site:
- "Find Jobs" page (/jobs): search jobs, use the mic button to search by voice, "Detect my location" to fill their city, filter by Skilled / Semi-Skilled / Unskilled, salary and job type. Tap "Apply now" on a job (sign in first).
- "Register" page (/signup): workers save their profile — name, mobile, trade, experience, city — and upload ID and certificates. Better profile = better job matches.
- "Post a job" page (/post-job): employers choose worker type, title, location, wage, duration, skills and publish. Sign in as employer to publish.
- "Dashboard" (/dashboard): workers track applications; employers see applicants and shortlist, hire or reject them.
- Sign in / sign up at /auth with email or Google.
- Skill levels: Skilled = trained/certified work (electrician, plumber, welder). Semi-skilled = some training (machine operator, driver, helper). Unskilled = general labour (construction, plantation, loading).
- KaamSetu is free for workers.

Always point the user to the exact page or button by its name. Never invent features or ask for passwords or money.`;

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: `${SYSTEM}\n\nApp language: ${LANG_NAME[data.lang]}.` },
          ...data.messages,
        ],
      }),
    });

    if (res.status === 429) throw new Error("rate_limit");
    if (res.status === 402) throw new Error("credits");
    if (!res.ok) throw new Error(`ai_error_${res.status}`);

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const reply = json.choices?.[0]?.message?.content?.trim();
    return { reply: reply || "" };
  });
