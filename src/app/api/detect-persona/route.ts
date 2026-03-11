import { NextRequest, NextResponse } from 'next/server';
import { askLLM } from '@/lib/openrouter';
import { PERSONA_SYSTEM } from '@/lib/audit-prompts';

export async function POST(req: NextRequest) {
  try {
    const { url, industry, pageContent } = await req.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    const msg = `Analyze this website and build the buyer persona: ${url}\n${industry ? `Industry: ${industry}` : ""}\n\nPage content preview:\n${(pageContent || "").substring(0, 3000)}`;
    const persona = await askLLM(PERSONA_SYSTEM, msg);

    return NextResponse.json({ persona: persona.trim() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
