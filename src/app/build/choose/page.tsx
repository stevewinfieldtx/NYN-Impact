'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, ArrowRight, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

interface SiteOption {
  id: string;
  version_label: string;
  template_code: string | null;
  is_selected: boolean;
}

const generatingSteps = [
  'Magic isn\'t easy...',
  'Transmogrification in process...',
  'Getting coffee... be right back',
  'Teaching pixels to dance...',
  'Arguing with fonts about who looks better...',
  'Convincing the hero section it\'s a hero...',
  'Almost there... the AI is admiring its own work...',
  'Sprinkling the finishing dust...',
];

export default function ChoosePage() {
  const router = useRouter();
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [expandedSite, setExpandedSite] = useState<string | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const pid = sessionStorage.getItem('nyn_project_id');
    if (!pid) {
      setError('No project found. Please start from the beginning.');
      setLoading(false);
      return;
    }
    setProjectId(pid);
    checkAndGenerate(pid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setGeneratingStep(prev => (prev + 1) % generatingSteps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [generating]);

  async function checkAndGenerate(pid: string) {
    try {
      const sitesRes = await fetch(`${API}/api/project/${pid}/sites`);
      const sitesData = await sitesRes.json();

      if (sitesData.success && sitesData.sites?.length > 0) {
        setSites(sitesData.sites);
        setLoading(false);
        return;
      }

      setGenerating(true);
      setLoading(false);

      const genRes = await fetch(`${API}/api/project/${pid}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const genData = await genRes.json();

      if (!genRes.ok || !genData.success) {
        throw new Error(genData.error || 'Failed to generate site options');
      }

      setSites(genData.sites || []);
      setGenerating(false);
    } catch (err) {
      console.error('Generate error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setGenerating(false);
      setLoading(false);
    }
  }

  async function handleSelect(siteId: string) {
    if (!projectId) return;
    setSelecting(siteId);
    setError('');

    try {
      const res = await fetch(`${API}/api/project/${projectId}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to select site');
      }

      sessionStorage.setItem('nyn_selected_site_id', siteId);

      if (data.slug) {
        router.push(`/cus/${data.slug}`);
      } else {
        setError('Site selected but no redirect URL found.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select site');
      setSelecting(null);
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  /* ── Generating ── */
  if (generating) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-purple-400 animate-pulse" />
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-purple-500/30 animate-ping" />
          </div>
          <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
            Designing your websites
          </h1>
          <p className="text-[#a0a0b0] mb-8">
            Our AI is designing two complete websites with custom colors, typography, and layouts. This takes about 60–90 seconds.
          </p>
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400 flex-shrink-0" />
              <p className="text-sm text-purple-300 transition-all duration-500">
                {generatingSteps[generatingStep]}
              </p>
            </div>
            <div className="w-full bg-[#1a1a24] rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-1000"
                style={{ width: `${Math.min(10 + generatingStep * 15, 90)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error && sites.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Fraunces, serif' }}>
            Something went wrong
          </h2>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={() => { setError(''); if (projectId) checkAndGenerate(projectId); }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full font-semibold transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ── Expanded (fullscreen) view of one site ── */
  if (expandedSite) {
    const site = sites.find(s => s.id === expandedSite);
    if (!site) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/10 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-[#a0a0b0]">{site.version_label}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSelect(site.id)}
              disabled={!!selecting}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
            >
              {selecting === site.id ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Selecting...</>
              ) : (
                <><ArrowRight className="w-3.5 h-3.5" /> Choose This One</>
              )}
            </button>
            <button
              onClick={() => setExpandedSite(null)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-[#a0a0b0] transition-all"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              Back
            </button>
          </div>
        </div>

        {/* Full iframe */}
        <iframe
          srcDoc={site.template_code || ''}
          className="w-full h-full pt-[52px]"
          title={site.version_label}
          sandbox="allow-scripts"
        />
      </div>
    );
  }

  /* ── Main: Choose between two real site previews ── */
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6]">
      {/* Header */}
      <div className="pt-10 pb-4 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: 'Fraunces, serif' }}>
          We designed{' '}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            two websites
          </span>{' '}
          for you
        </h1>
        <p className="text-[#a0a0b0] max-w-lg mx-auto">
          Click either preview to see it full-screen. Pick the one that feels right — every detail can be changed later.
        </p>
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      </div>

      {/* Two iframe previews side by side */}
      <div className="max-w-7xl mx-auto px-4 pb-6 grid md:grid-cols-2 gap-6">
        {sites.map((site) => {
          const isSelecting = selecting === site.id;

          return (
            <div key={site.id} className="flex flex-col">
              {/* Label */}
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-sm font-semibold text-[#d0d0d8]">{site.version_label}</span>
                <button
                  onClick={() => setExpandedSite(site.id)}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Maximize2 className="w-3 h-3" />
                  Full preview
                </button>
              </div>

              {/* Site iframe preview */}
              <div
                className={`relative rounded-xl overflow-hidden border transition-all cursor-pointer group ${
                  selecting && selecting !== site.id
                    ? 'opacity-30 scale-[0.97] border-white/5'
                    : isSelecting
                    ? 'border-purple-500 ring-2 ring-purple-500/30'
                    : 'border-white/10 hover:border-purple-500/30'
                }`}
                style={{ height: '520px' }}
                onClick={() => setExpandedSite(site.id)}
              >
                {site.template_code ? (
                  <iframe
                    srcDoc={site.template_code}
                    className="w-full h-full pointer-events-none"
                    title={site.version_label}
                    sandbox="allow-scripts"
                    style={{
                      transform: 'scale(0.5)',
                      transformOrigin: 'top left',
                      width: '200%',
                      height: '200%',
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-[#111118] flex items-center justify-center text-[#505060]">
                    No preview available
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-lg text-sm font-medium text-white transition-all">
                    Click to preview full size
                  </span>
                </div>
              </div>

              {/* Choose button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleSelect(site.id); }}
                disabled={!!selecting}
                className="mt-3 w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-base font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/20"
              >
                {isSelecting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Setting up your site...</>
                ) : (
                  <><ArrowRight className="w-4 h-4" /> Choose This Design</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pb-12 px-6 text-center">
        <p className="text-[#505060] text-sm">
          Every word, color, and section can be customized after you pick. Just choose the one that feels closest.
        </p>
      </div>
    </div>
  );
}
