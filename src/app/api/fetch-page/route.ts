import { NextRequest, NextResponse } from 'next/server';
import { askLLM } from '@/lib/openrouter';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    const content = await askLLM(
      "You are a web content extractor. Return ALL visible text from the given URL — headings, body, CTAs, nav, footer. No commentary, no markdown. Just the raw text.",
      `Extract all visible text from: ${url}`,
      3000
    );

    return NextResponse.json({ content });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
