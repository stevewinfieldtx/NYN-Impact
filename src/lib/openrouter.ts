// lib/openrouter.ts — Server-side only. API key never leaves the server.

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL_ID = process.env.OPENROUTER_MODEL_ID || "google/gemini-2.5-flash";

export async function askLLM(system: string, userMsg: string, maxTokens = 4000): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not set in environment");
  }

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://nynimpact.com",
      "X-Title": "NYN Impact Revenue Audit",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL_ID,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenRouter error ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

export function extractJSON(text: string): Record<string, unknown> {
  const clean = text.replace(/```json|```/g, "").trim();
  const s = clean.indexOf("{");
  const e = clean.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("No JSON found in response");

  const jsonStr = clean.substring(s, e + 1);

  try {
    return JSON.parse(jsonStr);
  } catch {
    // Attempt repair of truncated JSON
    let repaired = jsonStr.replace(/,\s*$/, "");
    let openBraces = 0, openBrackets = 0, inString = false, escaped = false;
    for (let i = 0; i < repaired.length; i++) {
      const ch = repaired[i];
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") openBraces++;
      else if (ch === "}") openBraces--;
      else if (ch === "[") openBrackets++;
      else if (ch === "]") openBrackets--;
    }
    if (inString) repaired += '"';
    repaired = repaired.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}[\]]*$/, "");
    for (let i = 0; i < openBrackets; i++) repaired += "]";
    for (let i = 0; i < openBraces; i++) repaired += "}";
    try { return JSON.parse(repaired); }
    catch { throw new Error("Failed to parse audit JSON — try again."); }
  }
}
