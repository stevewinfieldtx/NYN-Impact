import { NextRequest, NextResponse } from 'next/server';
import { askLLM, extractJSON } from '@/lib/openrouter';
import { AUDIT_SYSTEM } from '@/lib/audit-prompts';

export const maxDuration = 60; // Vercel Pro timeout

export async function POST(req: NextRequest) {
  try {
    const { url, pageContent, persona, competitors } = await req.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    let compSection = "COMPETITORS:\n";
    if (!competitors || competitors.length === 0) {
      compSection += "None — set competitor_comparisons to [], competitive_summary to N/A.\n";
    } else {
      competitors.forEach((c: { url: string; content: string }, i: number) => {
        compSection += `\n--- Competitor ${i + 1}: ${c.url} ---\n${(c.content || "(no content)").substring(0, 4000)}\n`;
      });
    }

    const msg = `AUDIT — address by name:
URL: ${url}
Content:
${(pageContent || "").substring(0, 10000)}

BUYER PERSONA:
${persona || "Infer from site content."}

${compSection}

Produce JSON. Company name throughout. Revenue focus. One entry per competitor.`;

    const result = await askLLM(AUDIT_SYSTEM, msg, 8000);
    const report = extractJSON(result);

    return NextResponse.json({ report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
