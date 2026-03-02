'use client';

import { useState, useEffect, useCallback } from 'react';
import { Phone, Globe, Building2, Loader2, CheckCircle, Search, FileSearch, TrendingUp } from 'lucide-react';

export default function StartPage() {
  const [businessName, setBusinessName] = useState('');
  const [businessUrl, setBusinessUrl] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phase, setPhase] = useState<'form' | 'interview' | 'processing'>('form');
  const [parallelStatus, setParallelStatus] = useState({
    autopsy: 'idle' as 'idle' | 'running' | 'done',
    competitors: 'idle' as 'idle' | 'running' | 'done',
    bestPractices: 'idle' as 'idle' | 'running' | 'done',
  });

  useEffect(() => {
    const name = sessionStorage.getItem('nyn_customer_name');
    if (name) setCustomerName(name);
  }, []);

  const startParallelResearch = useCallback(async () => {
    setParallelStatus(s => ({ ...s, autopsy: 'running' }));
    setTimeout(() => setParallelStatus(s => ({ ...s, competitors: 'running' })), 1500);
    setTimeout(() => setParallelStatus(s => ({ ...s, bestPractices: 'running' })), 3000);

    const customerId = sessionStorage.getItem('nyn_customer_id');
    try {
      const res = await fetch('/api/interview/start-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, businessUrl, customerId }),
      });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('nyn_project_id', data.projectId);
      }
    } catch (err) {
      console.error('Research start failed:', err);
    }

    setTimeout(() => setParallelStatus(s => ({ ...s, autopsy: 'done' })), 8000);
    setTimeout(() => setParallelStatus(s => ({ ...s, competitors: 'done' })), 12000);
    setTimeout(() => setParallelStatus(s => ({ ...s, bestPractices: 'done' })), 15000);
  }, [businessName, businessUrl]);

  function handleReady(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem('nyn_business_name', businessName);
    sessionStorage.setItem('nyn_business_url', businessUrl);
    setPhase('interview');
    if (businessUrl) {
      startParallelResearch();
    }
  }

  if (phase === 'interview') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6] flex flex-col items-center px-6 pt-16">
        <div className="max-w-2xl w-full text-center mb-12">
          <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Fraunces, serif' }}>
            Tell us about <span className="text-purple-400">{businessName}</span>
          </h1>
          <p className="text-[#a0a0b0]">
            Click the phone icon below to start your voice interview. Talk naturally — our AI will guide the conversation.
          </p>
        </div>

        <div className="w-full max-w-lg mb-12">
          <div className="bg-[#111118] border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-purple-500/10 border-2 border-purple-500/30 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-500/20 hover:border-purple-500/50 transition-all hover:scale-105"
              id="start-interview-btn"
            >
              <Phone className="w-10 h-10 text-purple-400" />
            </div>
            <p className="text-lg font-medium mb-2">Tap to start your interview</p>
            <p className="text-[#707080] text-sm">Takes about 5–10 minutes. Just talk about your business.</p>
          </div>
        </div>

        {businessUrl && (
          <div className="w-full max-w-lg">
            <div className="bg-[#111118] border border-white/5 rounded-2xl p-6">
              <p className="text-sm text-[#707080] mb-4 font-medium uppercase tracking-wide">While you talk, we&apos;re working...</p>
              <div className="space-y-3">
                <StatusRow icon={FileSearch} label="Analyzing your current website" status={parallelStatus.autopsy} />
                <StatusRow icon={Search} label="Researching your top competitors" status={parallelStatus.competitors} />
                <StatusRow icon={TrendingUp} label="Identifying industry best practices" status={parallelStatus.bestPractices} />
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={() => window.location.href = '/build/choose'}
            className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full text-base font-semibold transition-all hover:shadow-xl hover:shadow-purple-500/20"
          >
            I&apos;m Done — Show Me My Sites!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Fraunces, serif' }}>
            {customerName ? `Great, ${customerName.split(' ')[0]}!` : 'Almost there!'}
          </h1>
          <p className="text-[#a0a0b0]">Tell us about your business so we can start researching while we talk.</p>
        </div>

        <form onSubmit={handleReady} className="space-y-5">
          <div>
            <label className="block text-sm text-[#a0a0b0] mb-1.5">Business Name</label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-[#505060]" />
              <input
                type="text"
                required
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-[#f0ede6] placeholder-[#505060] focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                placeholder="Golf Center of Arlington"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#a0a0b0] mb-1.5">
              Current Website URL <span className="text-[#505060]">(optional)</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-[#505060]" />
              <input
                type="url"
                value={businessUrl}
                onChange={e => setBusinessUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-[#f0ede6] placeholder-[#505060] focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                placeholder="https://golfcenterofarlington.com"
              />
            </div>
            <p className="text-[#505060] text-xs mt-1.5">Don&apos;t have one yet? No problem — just leave it blank.</p>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-base font-semibold transition-all hover:shadow-xl hover:shadow-purple-500/20"
          >
            <Phone className="w-5 h-5" />
            Ready to Go — Start My Interview
          </button>
        </form>
      </div>
    </div>
  );
}

function StatusRow({ icon: Icon, label, status }: { icon: React.ComponentType<{ className?: string }>; label: string; status: 'idle' | 'running' | 'done' }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        status === 'done' ? 'bg-emerald-500/10' : status === 'running' ? 'bg-purple-500/10' : 'bg-[#1a1a25]'
      }`}>
        {status === 'done' ? (
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        ) : status === 'running' ? (
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
        ) : (
          <Icon className="w-4 h-4 text-[#505060]" />
        )}
      </div>
      <span className={`text-sm ${
        status === 'done' ? 'text-emerald-400' : status === 'running' ? 'text-[#f0ede6]' : 'text-[#505060]'
      }`}>
        {label}
        {status === 'done' && ' ✓'}
      </span>
    </div>
  );
}
