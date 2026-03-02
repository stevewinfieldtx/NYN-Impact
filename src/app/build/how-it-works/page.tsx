'use client';

import { ArrowRight, Mic, Search, Code2, PenTool, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    icon: Mic,
    title: 'A Real Conversation',
    desc: "We don't hand you a form with 47 fields. Our AI interviewer talks with you — like a human would — about your business, your story, what makes you different. This conversation becomes the foundation of everything.",
    why: 'Because nobody knows your business like you do. And your words should be your website.',
    color: 'purple',
  },
  {
    icon: Search,
    title: 'Deep Research (While You Talk)',
    desc: "While you're chatting with us, our AI is simultaneously analyzing your current website (if you have one), studying your top competitors, and identifying what the best in your industry are doing right.",
    why: "So your new site doesn't just look good — it outperforms what's already out there.",
    color: 'blue',
  },
  {
    icon: Code2,
    title: 'Two Unique Designs',
    desc: "We combine your interview, our research, and competitor intelligence to generate two completely unique website designs. Not template swaps — truly original sites built from YOUR story and YOUR competitive landscape.",
    why: 'Because choosing between two great options is better than accepting one okay one.',
    color: 'pink',
  },
  {
    icon: PenTool,
    title: 'You Edit It Yourself — Forever',
    desc: "Once you pick your favorite, you can change anything anytime. Just type what you want: \"Update my phone number.\" \"Change the headline.\" \"Add a testimonial from Mike.\" Our AI handles the rest.",
    why: "No CMS to learn. No developer to call. No waiting. Your site stays current because YOU keep it current — in seconds.",
    color: 'emerald',
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6]">
      {/* Header */}
      <div className="pt-16 pb-12 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
          Here&apos;s how we build
          <br />
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            your website
          </span>
        </h1>
        <p className="text-[#a0a0b0] text-lg max-w-lg mx-auto">
          Every step is designed to make your site impossible to mistake for anyone else&apos;s.
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-3xl mx-auto px-6 pb-12 space-y-8">
        {steps.map((step, i) => {
          const c = colorMap[step.color];
          return (
            <div key={i} className="bg-[#111118] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0">
                  <div className={`w-14 h-14 ${c.bg} rounded-2xl flex items-center justify-center`}>
                    <step.icon className={`w-7 h-7 ${c.text}`} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-mono ${c.text} ${c.bg} px-2 py-0.5 rounded-full`}>
                      Step {i + 1}
                    </span>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-[#a0a0b0] leading-relaxed mb-4">{step.desc}</p>
                  <div className={`flex items-start gap-2 ${c.bg} border ${c.border} rounded-xl px-4 py-3`}>
                    <CheckCircle className={`w-4 h-4 ${c.text} mt-0.5 flex-shrink-0`} />
                    <p className={`text-sm ${c.text}`}>
                      <strong>Why it matters:</strong> {step.why}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="pb-24 px-6 text-center">
        <div className="max-w-md mx-auto bg-[#111118] border border-purple-500/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Fraunces, serif' }}>
            Ready?
          </h2>
          <p className="text-[#a0a0b0] mb-6">
            The whole process takes about 10 minutes. You&apos;ll have two stunning website options to choose from.
          </p>
          <Link
            href="/build/start"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full text-base font-semibold transition-all hover:shadow-xl hover:shadow-purple-500/20"
          >
            Let&apos;s Go
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
