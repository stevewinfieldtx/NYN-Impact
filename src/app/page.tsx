'use client';

import { ArrowRight, Mic, Search, Sparkles, PenTool, Globe, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6]">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'Fraunces, serif' }}>
            NYN<span className="text-purple-400">Impact</span>
          </span>
          <Link
            href="/sign-in"
            className="flex items-center gap-2 px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-all"
          >
            <LogIn className="w-4 h-4 text-purple-400" />
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            AI-Powered. Voice-Driven. Self-Editing.
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6" style={{ fontFamily: 'Fraunces, serif' }}>
            We don&apos;t pick
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              templates
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-[#a0a0b0] max-w-2xl mx-auto mb-4 leading-relaxed">
            We interview you, research your competitors, and build a site that could only be yours.
          </p>
          <p className="text-lg text-[#707080] max-w-xl mx-auto mb-12">
            Then you edit it yourself — forever — just by typing what you want changed.
          </p>

          <Link
            href="/build"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full text-lg font-semibold transition-all hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-0.5"
          >
            Build My Website
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16" style={{ fontFamily: 'Fraunces, serif' }}>
            How it works
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Mic,
                title: 'We Interview You',
                desc: 'A real AI conversation about your business — not a form. Your words become your website.',
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
              },
              {
                icon: Search,
                title: 'We Research',
                desc: 'We autopsy your current site, study your top competitors, and identify what the best in your industry do.',
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
              },
              {
                icon: Sparkles,
                title: 'We Build Two Options',
                desc: 'Two completely unique designs — not templates. Built from your voice, your story, your competitive edge.',
                color: 'text-pink-400',
                bg: 'bg-pink-500/10',
              },
              {
                icon: PenTool,
                title: 'You Edit Forever',
                desc: 'Change anything by typing what you want. "Update my headline." "Swap the hero image." Done.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
              },
            ].map((step, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#111118] border border-white/5 hover:border-white/10 transition-all">
                <div className={`w-12 h-12 ${step.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <step.icon className={`w-6 h-6 ${step.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-[#a0a0b0] text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Self-Edit Demo Teaser */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm mb-8">
            <PenTool className="w-4 h-4" />
            The AI Self-Edit Experience
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: 'Fraunces, serif' }}>
            Your website, your words.
            <br />
            <span className="text-[#a0a0b0]">Always.</span>
          </h2>

          <p className="text-[#a0a0b0] text-lg mb-12 max-w-xl mx-auto">
            No CMS to learn. No developer to call. Just tell your site what to change.
          </p>

          {/* Fake chat demo */}
          <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 text-left max-w-lg mx-auto">
            <div className="space-y-4 mb-6">
              <div className="flex justify-end">
                <div className="bg-purple-600/20 border border-purple-500/30 rounded-2xl rounded-br-md px-4 py-2.5 max-w-xs">
                  <p className="text-sm">Change my headline to &quot;Serving Arlington Since 2005&quot;</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-[#1a1a25] border border-white/5 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-xs">
                  <p className="text-sm text-emerald-400">✓ Done! Your headline has been updated. Want to preview?</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-purple-600/20 border border-purple-500/30 rounded-2xl rounded-br-md px-4 py-2.5 max-w-xs">
                  <p className="text-sm">Update the phone number to 817-555-1234</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-[#1a1a25] border border-white/5 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-xs">
                  <p className="text-sm text-emerald-400">✓ Phone number updated across your entire site.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-full px-4 py-2.5 text-sm text-[#505060]">
                Type what you want to change...
              </div>
              <button className="px-4 py-2.5 bg-purple-600 rounded-full text-sm font-medium">
                Send
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <Globe className="w-12 h-12 text-purple-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
            Ready to stand out?
          </h2>
          <p className="text-[#a0a0b0] text-lg mb-8">
            Your competitors are using templates. You won&apos;t be.
          </p>
          <Link
            href="/build"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full text-lg font-semibold transition-all hover:shadow-xl hover:shadow-purple-500/20"
          >
            Build My Website
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center text-[#505060] text-sm">
          <p>© {new Date().getFullYear()} NYN Impact. Built by <a href="https://wintechpartners.com" className="text-purple-400 hover:text-purple-300">WinTech Partners</a></p>
        </div>
      </footer>
    </div>
  );
}
