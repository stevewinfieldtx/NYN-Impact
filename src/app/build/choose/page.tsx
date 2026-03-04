'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, ArrowRight, RotateCcw, Star, ChevronRight, Phone, Mail } from 'lucide-react';

/* ─── Types ─── */
interface ContentSchema {
  meta?: { title?: string; tagline?: string; contact_email?: string; contact_name?: string; phone?: string; year_started?: string };
  hero?: { badge?: string; headline1?: string; headline2?: string; subheadline?: string; cta_primary?: string; cta_secondary?: string };
  stats?: { value: string; label: string }[];
  services?: { heading?: string; description?: string; items?: { name: string; description?: string; price?: string }[] };
  membership?: { heading?: string; description?: string; tiers?: { name: string; price: string; original?: string; note?: string; badge?: string; features: string[] }[] };
  story?: { heading?: string; paragraphs?: string[] };
  differentiators?: { title: string; desc: string }[];
  testimonials?: { quote: string; author: string; role?: string }[];
  footer?: { description?: string };
  [key: string]: unknown;
}

interface SiteOption {
  id: string;
  version_label: string;
  content_schema: ContentSchema;
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

/* ─── Color themes for each option ─── */
const THEMES = [
  { primary: '#7c3aed', primaryLight: '#a78bfa', gradient: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)', name: 'Bold & Modern' },
  { primary: '#e11d48', primaryLight: '#fb7185', gradient: 'linear-gradient(135deg, #e11d48 0%, #f97316 100%)', name: 'Warm & Professional' },
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
    }, 4000);
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

  /* ── Main: Choose between two visual previews ── */
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6]">
      {/* Header */}
      <div className="pt-12 pb-6 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: 'Fraunces, serif' }}>
          Pick your{' '}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            favorite
          </span>
        </h1>
        <p className="text-[#a0a0b0] max-w-lg mx-auto">
          We built two complete websites from your conversation. Scroll through each preview, then choose the one you like. You can edit every detail later.
        </p>
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      </div>

      {/* Two site previews side by side (or stacked on mobile) */}
      <div className="max-w-7xl mx-auto px-4 pb-8 grid md:grid-cols-2 gap-6">
        {sites.map((site, i) => {
          const s = site.content_schema;
          const theme = THEMES[i] || THEMES[0];
          const isSelecting = selecting === site.id;
          const isExpanded = expandedSite === site.id;

          return (
            <div key={site.id} className="flex flex-col">
              {/* Label bar */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: theme.gradient }} />
                  <span className="text-sm font-semibold text-[#d0d0d8]">{site.version_label}</span>
                </div>
                <button
                  onClick={() => setExpandedSite(isExpanded ? null : site.id)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {isExpanded ? 'Collapse' : 'See full preview'}
                </button>
              </div>

              {/* Website Preview Card — renders as a mini website */}
              <div
                className={`bg-white rounded-xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10 transition-all duration-300 ${
                  selecting && selecting !== site.id ? 'opacity-30 scale-[0.97]' : ''
                } ${isSelecting ? 'ring-2 ring-purple-500' : ''}`}
                style={{ maxHeight: isExpanded ? 'none' : '700px', overflow: isExpanded ? 'visible' : 'hidden' }}
              >
                {/* ─── HERO SECTION ─── */}
                <div style={{ background: theme.gradient }} className="px-6 py-10 md:px-10 md:py-14 text-white relative overflow-hidden">
                  {/* Decorative circles */}
                  <div className="absolute top-[-40px] right-[-40px] w-32 h-32 rounded-full bg-white/5" />
                  <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-white/5" />

                  {s.hero?.badge && (
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-4 backdrop-blur-sm">
                      {s.hero.badge}
                    </span>
                  )}
                  <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-2" style={{ fontFamily: 'Fraunces, serif' }}>
                    {s.hero?.headline1 || s.meta?.title || 'Your Business'}
                  </h2>
                  {s.hero?.headline2 && (
                    <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-3 text-white/80" style={{ fontFamily: 'Fraunces, serif' }}>
                      {s.hero.headline2}
                    </h2>
                  )}
                  <p className="text-white/80 text-sm md:text-base max-w-md mb-6 leading-relaxed">
                    {s.hero?.subheadline || s.meta?.tagline || ''}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {s.hero?.cta_primary && (
                      <span className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-semibold">
                        {s.hero.cta_primary} <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {s.hero?.cta_secondary && (
                      <span className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-white/40 text-white rounded-lg text-sm font-medium">
                        {s.hero.cta_secondary}
                      </span>
                    )}
                  </div>
                </div>

                {/* ─── STATS BAR ─── */}
                {s.stats && s.stats.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 bg-gray-50 border-b border-gray-100">
                    {s.stats.slice(0, 4).map((stat, si) => (
                      <div key={si} className="p-4 text-center border-r last:border-r-0 border-gray-100">
                        <p className="text-lg md:text-xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* ─── DIFFERENTIATORS ─── */}
                {s.differentiators && s.differentiators.length > 0 && (
                  <div className="px-6 py-8 md:px-10 bg-white">
                    <div className="grid gap-4">
                      {s.differentiators.slice(0, 3).map((diff, di) => (
                        <div key={di} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: `${theme.primary}15` }}>
                            <Star className="w-4 h-4" style={{ color: theme.primary }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{diff.title}</p>
                            <p className="text-xs text-gray-500 leading-relaxed">{diff.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── SERVICES / MEMBERSHIP ─── */}
                {(s.services?.items || s.membership?.tiers) && (
                  <div className="px-6 py-8 md:px-10 bg-gray-50 border-t border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Fraunces, serif' }}>
                      {s.services?.heading || s.membership?.heading || 'What We Offer'}
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">{s.services?.description || s.membership?.description || ''}</p>

                    {/* Services as cards */}
                    {s.services?.items && (
                      <div className="grid gap-3">
                        {s.services.items.slice(0, 4).map((svc, si) => (
                          <div key={si} className="bg-white rounded-lg p-3 border border-gray-100 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{svc.name}</p>
                              {svc.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{svc.description}</p>}
                            </div>
                            {svc.price && (
                              <span className="text-sm font-bold whitespace-nowrap ml-3" style={{ color: theme.primary }}>
                                {svc.price}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Membership tiers */}
                    {s.membership?.tiers && (
                      <div className="grid gap-3">
                        {s.membership.tiers.slice(0, 3).map((tier, ti) => (
                          <div key={ti} className="bg-white rounded-lg p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900">{tier.name}</p>
                                {tier.badge && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                                    style={{ background: theme.primary }}>
                                    {tier.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-base font-bold text-gray-900">{tier.price}</span>
                                {tier.original && <span className="text-xs text-gray-400 line-through ml-1">{tier.original}</span>}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {tier.features.slice(0, 3).map((f, fi) => (
                                <span key={fi} className="text-[10px] bg-gray-50 text-gray-600 rounded px-2 py-0.5">{f}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── STORY ─── */}
                {s.story?.paragraphs && s.story.paragraphs.length > 0 && (
                  <div className="px-6 py-8 md:px-10 bg-white border-t border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-3" style={{ fontFamily: 'Fraunces, serif' }}>
                      {s.story.heading || 'Our Story'}
                    </h3>
                    {s.story.paragraphs.slice(0, 2).map((p, pi) => (
                      <p key={pi} className="text-sm text-gray-600 leading-relaxed mb-2">{p}</p>
                    ))}
                  </div>
                )}

                {/* ─── TESTIMONIALS ─── */}
                {s.testimonials && s.testimonials.length > 0 && (
                  <div className="px-6 py-6 md:px-10 bg-gray-50 border-t border-gray-100">
                    <div className="space-y-3">
                      {s.testimonials.slice(0, 2).map((t, ti) => (
                        <div key={ti} className="bg-white rounded-lg p-3 border border-gray-100">
                          <p className="text-xs text-gray-600 italic leading-relaxed mb-2">&ldquo;{t.quote}&rdquo;</p>
                          <p className="text-xs font-medium text-gray-900">— {t.author}{t.role ? `, ${t.role}` : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── FOOTER ─── */}
                <div className="px-6 py-5 md:px-10 bg-gray-900 text-white">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{s.meta?.title || 'Your Business'}</p>
                      {s.footer?.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 max-w-sm">{s.footer.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {s.meta?.contact_email && (
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {s.meta.contact_email}</span>
                      )}
                      {s.meta?.phone && (
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.meta.phone}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fade overlay when collapsed */}
                {!isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
                )}
              </div>

              {/* Choose button below the preview */}
              <button
                onClick={() => handleSelect(site.id)}
                disabled={!!selecting}
                className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-semibold transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 hover:shadow-lg"
                style={{ background: theme.gradient }}
              >
                {isSelecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up your site...
                  </>
                ) : (
                  <>
                    Choose This Design
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pb-16 px-6 text-center">
        <p className="text-[#505060] text-sm">
          Every word, image, and color can be changed after you pick. Just choose the one that feels closest.
        </p>
      </div>
    </div>
  );
}
