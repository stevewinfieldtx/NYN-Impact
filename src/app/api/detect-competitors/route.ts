import { NextRequest, NextResponse } from 'next/server';
import { askLLM } from '@/lib/openrouter';
import { COMPETITORS_SYSTEM } from '@/lib/audit-prompts';

export async function POST(req: NextRequest) {
  try {
    const { url, industry } = await req.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    const result = await askLLM(
      COMPETITORS_SYSTEM,
      `Find 3 competitors for: ${url}${industry ? `\nIndustry: ${industry}` : ""}`
    );

    const lines = result.trim().split("\n").filter((l: string) => l.includes("|")).slice(0, 3);
    const competitors = lines.map((line: string) => {
      const parts = line.split("|").map((p: string) => p.trim());
      const urlMatch = (parts[0] || "").match(/https?:\/\/[^\s]+/);
      return {
        url: urlMatch ? urlMatch[0] : parts[0],
        name: parts[1] || "",
        reason: parts[2] || "",
      };
    });

    return NextResponse.json({ competitors });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
