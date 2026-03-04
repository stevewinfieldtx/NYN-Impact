'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Check, ArrowRight, RotateCcw, Zap, Heart } from 'lucide-react';

interface SiteOption {
  id: string;
  version_label: string;
  content_schema: {
    meta?: { title?: string; tagline?: string };
    hero?: { headline1?: string; headline2?: string; subheadline?: string };
    services?: { items?: { name: string; description?: string; price?: string }[] };
    differentiators?: { title: string; desc: string }[];
    story?: { heading?: string; paragraphs?: string[] };
    stats?: { value: string; label: string }[];
    [key: string]: unknown;
  };
  is_selected: boolean;
}

const generatingSteps = [
  'Analyzing your business story...',
  'Researching your competitive landscape...',
  'Crafting compelling headlines...',
  'Designing content structure...',
  'Building two unique options...',
  'Polishing the final copy...',
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
  }, []);

  // Cycle through generating steps for visual progress
  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setGeneratingStep(prev => (prev + 1) % generatingSteps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [generating]);

  async function checkAndGenerate(pid: string) {
    try {
      // First check if sites already exist
      const sitesRes = await fetch(`${API}/api/project/${pid}/sites`);
      const sitesData = await sitesRes.json();

      if (sitesData.success && sitesData.sites?.length > 0) {
        setSites(sitesData.sites);
        setLoading(false);
        return;
      }

      // No sites yet — trigger generation
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

      // Store the selected site ID
      sessionStorage.setItem('nyn_selected_site_id', siteId);

      // Navigate to the customer portal
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

  async function handleRegenerate() {
    if (!projectId) return;
    setError('');
    setGenerating(true);
    setSites([]);

    try {
      // Delete existing sites first (the generate endpoint returns existing if found)
      const res = await fetch(`${API}/api/project/${projectId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to regenerate');
      }

      setSites(data.sites || []);
      setGenerating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regeneration failed');
      setGenerating(false);
    }
  }

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  // ── Generating State ──
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
            Building your websites
          </h1>

          <p className="text-[#a0a0b0] mb-8">
            Our AI is creating two unique designs based on everything you shared. This takes about 30–60 seconds.
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
                style={{ width: `${Math.min(15 + generatingStep * 15, 90)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ──
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
            onClick={() => {
              setError('');
              if (projectId) checkAndGenerate(projectId);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full font-semibold transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Choose State — Two Options ──
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6]">
      {/* Header */}
      <div className="pt-16 pb-8 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: 'Fraunces, serif' }}>
          Pick your{' '}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            favorite
          </span>
        </h1>
        <p className="text-[#a0a0b0] max-w-lg mx-auto">
          We created two unique versions of your website. Choose the one that feels right — you can always edit everything later.
        </p>
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      </div>

      {/* Site Options */}
      <div className="max-w-6xl mx-auto px-6 pb-8 grid md:grid-cols-2 gap-6">
        {sites.map((site, i) => {
          const schema = site.content_schema;
          const isSelecting = selecting === site.id;
          const colorTheme = i === 0
            ? { accent: 'purple', icon: Zap, gradient: 'from-purple-600 to-blue-600', bg: 'purple-500' }
            : { accent: 'pink', icon: Heart, gradient: 'from-pink-600 to-orange-600', bg: 'pink-500' };
          const Icon = colorTheme.icon;

          return (
            <div
              key={site.id}
              className={`bg-[#111118] border rounded-2xl overflow-hidden transition-all hover:border-${colorTheme.accent}-500/30 ${
                selecting && selecting !== site.id ? 'opacity-40 scale-[0.98]' : ''
              } ${isSelecting ? `border-${colorTheme.accent}-500/50 ring-2 ring-${colorTheme.accent}-500/20` : 'border-white/5'}`}
            >
              {/* Version Label */}
              <div className={`px-6 py-4 bg-gradient-to-r ${colorTheme.gradient} bg-opacity-10`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">{site.version_label}</h2>
                    <p className="text-white/70 text-xs">
                      {i === 0 ? 'Bold, modern, and energetic' : 'Warm, trustworthy, and professional'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Preview */}
              <div className="p-6 space-y-5">
                {/* Headline Preview */}
                <div>
                  <p className="text-xs text-[#505060] uppercase tracking-wider mb-1">Headline</p>
                  <h3 className="text-xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>
                    {schema.hero?.headline1 || 'Your Business'}{' '}
                    {schema.hero?.headline2 && (
                      <span className={`text-${colorTheme.accent}-400`}>{schema.hero.headline2}</span>
                    )}
                  </h3>
                  <p className="text-[#a0a0b0] text-sm mt-1">{schema.hero?.subheadline || ''}</p>
                </div>

                {/* Tagline */}
                {schema.meta?.tagline && (
                  <div>
                    <p className="text-xs text-[#505060] uppercase tracking-wider mb-1">Tagline</p>
                    <p className="text-[#d0d0d8] italic">&ldquo;{schema.meta.tagline}&rdquo;</p>
                  </div>
                )}

                {/* Stats Preview */}
                {schema.stats && schema.stats.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {schema.stats.slice(0, 3).map((stat, si) => (
                      <div key={si} className="bg-[#0a0a0f] rounded-xl p-3 text-center">
                        <p className={`text-lg font-bold text-${colorTheme.accent}-400`}>{stat.value}</p>
                        <p className="text-[#505060] text-xs">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Differentiators */}
                {schema.differentiators && schema.differentiators.length > 0 && (
                  <div>
                    <p className="text-xs text-[#505060] uppercase tracking-wider mb-2">What makes you different</p>
                    <div className="space-y-2">
                      {schema.differentiators.slice(0, 3).map((diff, di) => (
                        <div key={di} className="flex items-start gap-2">
                          <Check className={`w-4 h-4 text-${colorTheme.accent}-400 mt-0.5 flex-shrink-0`} />
                          <div>
                            <p className="text-sm font-medium">{diff.title}</p>
                            <p className="text-xs text-[#707080]">{diff.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services Preview */}
                {schema.services?.items && schema.services.items.length > 0 && (
                  <div>
                    <p className="text-xs text-[#505060] uppercase tracking-wider mb-2">Services</p>
                    <div className="flex flex-wrap gap-2">
                      {schema.services.items.slice(0, 4).map((svc, si) => (
                        <span key={si} className="text-xs bg-[#0a0a0f] border border-white/5 rounded-full px-3 py-1 text-[#a0a0b0]">
                          {svc.name}{svc.price ? ` — ${svc.price}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Story Preview */}
                {schema.story?.paragraphs?.[0] && (
                  <div>
                    <p className="text-xs text-[#505060] uppercase tracking-wider mb-1">Story</p>
                    <p className="text-sm text-[#a0a0b0] line-clamp-3">{schema.story.paragraphs[0]}</p>
                  </div>
                )}
              </div>

              {/* Select Button */}
              <div className="px-6 pb-6">
                <button
                  onClick={() => handleSelect(site.id)}
                  disabled={!!selecting}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r ${colorTheme.gradient} hover:opacity-90 rounded-xl text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSelecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Selecting...
                    </>
                  ) : (
                    <>
                      Choose This One
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="pb-16 px-6 text-center">
        <p className="text-[#505060] text-sm">
          Don&apos;t worry — you can edit every word, image, and detail after you choose. Nothing is permanent.
        </p>
      </div>
    </div>
  );
}
