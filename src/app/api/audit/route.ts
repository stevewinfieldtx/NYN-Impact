import { NextRequest, NextResponse } from 'next/server';
import { askLLM, extractJSON } from '@/lib/openrouter';
import { AUDIT_SYSTEM } from '@/lib/audit-prompts';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { url, pageContent, persona, competitors } = await req.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    let benchSection = "BEST-IN-CLASS BENCHMARKS TO COMPARE AGAINST:\n";
    if (!competitors || competitors.length === 0) {
      benchSection += "None — set benchmark_comparisons to [], benchmark_summary to N/A.\n";
    } else {
      competitors.forEach((c: { url: string; content: string }, i: number) => {
        benchSection += `\n--- Benchmark ${i + 1}: ${c.url} ---\n${(c.content || "(no content)").substring(0, 4000)}\n`;
      });
    }

    const msg = `AUDIT THIS WEBSITE — speak directly TO the prospect using "you" and their company name:
URL: ${url}
Content:
${(pageContent || "").substring(0, 10000)}

BUYER PERSONA:
${persona || "Infer from site content."}

${benchSection}

Produce JSON. Address the prospect directly throughout — "you", "your", their company name. Revenue focus. One benchmark_comparisons entry per benchmark.`;

    const result = await askLLM(AUDIT_SYSTEM, msg, 8000);
    const report = extractJSON(result);

    return NextResponse.json({ report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
