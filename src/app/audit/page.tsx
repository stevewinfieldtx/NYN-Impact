'use client';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

/* ─── Helpers ─── */
const scoreColor = (s: number) => s >= 4 ? 'text-green-500' : s >= 2.5 ? 'text-amber-500' : 'text-red-500';
const scoreBg = (s: number) => s >= 4 ? 'bg-green-500' : s >= 2.5 ? 'bg-amber-500' : 'bg-red-500';
const scoreWord = (s: number) => s >= 4.5 ? 'Excellent' : s >= 3.5 ? 'Good' : s >= 2.5 ? 'Needs Attention' : s >= 1.5 ? 'Underperforming' : 'Revenue Risk';

type Factor = { name: string; score: number; finding: string; rec: string; revenue_impact: string };
type CompComp = { competitor_name: string; competitor_url: string; where_they_beat_us: string[]; where_we_win: string[]; opportunity: string; verdict: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Report = Record<string, any>;

async function api(path: string, body: Record<string, unknown>) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d;
}

/* ─── Gauge Component ─── */
function Gauge({ score, label }: { score: number; label: string }) {
  const size = 76, r = (size - 10) / 2, circ = 2 * Math.PI * r;
  const off = circ - ((score / 5) * circ);
  const col = score >= 4 ? '#22C55E' : score >= 2.5 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
        <text x={size/2} y={size/2+5} textAnchor="middle" fontSize={20} fontWeight="800"
          fill={col} style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>{score.toFixed(1)}</text>
      </svg>
      <span className="text-[10px] font-semibold text-slate-500">{label}</span>
    </div>
  );
}

export default function AuditPage() {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [persona, setPersona] = useState('');
  const [pLoading, setPLoading] = useState(false);
  const [pAuto, setPAuto] = useState(false);
  const [comps, setComps] = useState(['', '', '']);
  const [cLoading, setCLoading] = useState(false);
  const [cAuto, setCAuto] = useState(false);
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('seo');
  const ref = useRef<HTMLDivElement>(null);
  const cn = report?.company_name || 'Company';
  const setC = (i: number, v: string) => { const c = [...comps]; c[i] = v; setComps(c); setCAuto(false); };

  const autoPersona = useCallback(async () => {
    setPLoading(true);
    try { const d = await api('/api/detect-persona', { url, industry }); setPersona(d.persona); setPAuto(true); }
    catch { setPersona('(Failed — describe manually)'); }
    setPLoading(false);
  }, [url, industry]);

  const autoComps = useCallback(async () => {
    setCLoading(true);
    try {
      const d = await api('/api/detect-competitors', { url, industry });
      setComps([(d.competitors[0]?.url || ''), (d.competitors[1]?.url || ''), (d.competitors[2]?.url || '')]);
      setCAuto(true);
    } catch { setComps(['(failed)', '', '']); }
    setCLoading(false);
  }, [url, industry]);

  const runAudit = useCallback(async () => {
    setStep(3); setError(''); setReport(null);
    try {
      setStatus('Reading their website...');
      let pageContent = '';
      try { const d = await api('/api/fetch-page', { url }); pageContent = d.content; } catch { /* ignore */ }

      const valid = comps.filter(c => c && c.trim() && !c.includes('fail'));
      const compData: { url: string; content: string }[] = [];
      for (let i = 0; i < valid.length; i++) {
        setStatus(`Reading competitor ${i + 1}/${valid.length}...`);
        try { const d = await api('/api/fetch-page', { url: valid[i] }); compData.push({ url: valid[i], content: d.content }); }
        catch { compData.push({ url: valid[i], content: '' }); }
      }

      setStatus('Running full revenue impact analysis...');
      const d = await api('/api/audit', { url, pageContent, persona: persona || undefined, competitors: compData });
      setReport(d.report); setStatus(''); setStep(4); setTab('seo');
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); setStatus(''); }
  }, [url, persona, comps]);

  const tabs = [
    { k: 'seo', l: 'SEO', i: '🔍' }, { k: 'conversion', l: 'Conversion', i: '🎯' },
    { k: 'technical', l: 'Technical', i: '⚙️' }, { k: 'content', l: 'Content', i: '📝' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1B2A4A] to-[#0F172A] px-6 pt-7 pb-6">
        <div className="max-w-[700px] mx-auto">
          <Link href="/" className="flex items-center gap-2.5 mb-1 no-underline">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white text-sm font-black">N</div>
            <span className="text-xs font-bold text-teal-400 tracking-[0.15em] uppercase">NYN Impact</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-white mt-1.5 tracking-tight">
            {step === 4 && report ? `Revenue Audit: ${cn}` : 'Website Revenue Audit'}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {step === 4 ? `How much revenue is ${cn}'s site leaving on the table?` : 'Find out how much revenue a website is leaving on the table'}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-[700px] mx-auto px-6 pt-4">
        <div className="flex gap-1">{[1, 2, 3, 4].map(i => (
          <div key={i} className={`flex-1 h-1 rounded transition-colors duration-400 ${step >= i ? 'bg-teal-600' : 'bg-slate-200'}`} />
        ))}</div>
      </div>

      <div className="max-w-[700px] mx-auto px-6 mt-4 mb-16">

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Whose website are we auditing?</h2>
            <p className="text-sm text-slate-500 mb-4">Paste the URL and we'll show exactly where they're losing revenue.</p>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && url.trim() && setStep(2)}
              placeholder="https://rainnetworks.com"
              className="w-full px-3.5 py-3 text-sm rounded-lg border-2 border-slate-200 focus:border-teal-600 outline-none transition"
              autoFocus />
            <div className="flex justify-end mt-4">
              <button onClick={() => url.trim() && setStep(2)} disabled={!url.trim()}
                className="px-7 py-3 text-sm font-bold rounded-lg bg-teal-600 text-white disabled:opacity-40 hover:bg-teal-700 transition">Next →</button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Help us see through their buyer's eyes</h2>
            <p className="text-sm text-slate-500 mb-5">More context = sharper audit. Don't know? Hit <span className="font-semibold text-teal-600">Auto-Detect</span>.</p>

            <div className="mb-4">
              <label className="text-sm font-semibold text-slate-600 block mb-1">Industry <span className="font-normal text-slate-400">(optional)</span></label>
              <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. managed IT, dental, SaaS"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border-2 border-slate-200 focus:border-teal-600 outline-none transition" />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-semibold text-slate-600">Ideal buyer persona</label>
                <button onClick={autoPersona} disabled={pLoading}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg border-[1.5px] border-teal-600 bg-teal-50 text-teal-600 hover:bg-teal-100 transition disabled:opacity-50">
                  {pLoading ? 'Analyzing...' : '⚡ Auto-Detect'}</button>
              </div>
              {pLoading && <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg text-sm text-teal-600 mb-2">
                <div className="w-3 h-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" /> Building buyer persona...</div>}
              <textarea value={persona} onChange={e => { setPersona(e.target.value); setPAuto(false); }} rows={4}
                placeholder="Who writes the check? Title, priorities, deal-breakers. Or hit Auto-Detect."
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border-2 border-slate-200 focus:border-teal-600 outline-none transition resize-y min-h-[80px]" />
              {pAuto && persona && !pLoading && <p className="text-xs text-teal-600 mt-1">✓ Auto-generated — edit if needed.</p>}
            </div>

            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-slate-600">Top 3 Competitors</label>
                <button onClick={autoComps} disabled={cLoading}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg border-[1.5px] border-teal-600 bg-teal-50 text-teal-600 hover:bg-teal-100 transition disabled:opacity-50">
                  {cLoading ? 'Searching...' : '⚡ Find All 3'}</button>
              </div>
              {cLoading && <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg text-sm text-teal-600 mb-2">
                <div className="w-3 h-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" /> Finding the 3 biggest threats...</div>}
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-teal-50 flex items-center justify-center text-xs font-bold text-teal-600 shrink-0">{i + 1}</div>
                  <input value={comps[i]} onChange={e => setC(i, e.target.value)}
                    placeholder={['https://biggest-threat.com', 'https://second-competitor.com', 'https://third-competitor.com'][i]}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border-2 border-slate-200 focus:border-teal-600 outline-none transition" />
                </div>
              ))}
              {cAuto && comps[0] && !cLoading && <p className="text-xs text-teal-600 mt-1">✓ Found via AI. Edit if needed.</p>}
            </div>

            <div className="flex justify-between pt-3 border-t border-slate-200">
              <button onClick={() => setStep(1)} className="px-6 py-2.5 text-sm font-semibold rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition">← Back</button>
              <button onClick={runAudit} className="px-7 py-2.5 text-sm font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition">Run Revenue Audit →</button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <div className="text-5xl mb-3">💰</div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Analyzing revenue impact...</h2>
            {status && <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-50 rounded-lg text-sm text-teal-600">
              <div className="w-3 h-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" /> {status}</div>}
            {error && <div className="mt-4">
              <p className="text-red-500 text-sm mb-3">⚠️ {error}</p>
              <button onClick={() => { setStep(2); setError(''); }} className="px-6 py-2.5 text-sm font-bold rounded-lg bg-teal-600 text-white">← Try Again</button>
            </div>}
          </div>
        )}

        {/* STEP 4: REPORT */}
        {step === 4 && report && (
          <div ref={ref} className="space-y-4">

            {/* Revenue headline */}
            {report.revenue_headline && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/30 to-amber-50/20">
                <p className="text-[15px] font-bold text-slate-900 leading-relaxed">💰 {report.revenue_headline}</p>
              </div>
            )}

            {/* Scores card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wider mb-1">Revenue Audit For</p>
                    <h2 className="text-xl font-extrabold text-slate-900">{cn}</h2>
                    <p className="text-xs text-slate-400 mb-2.5">{url} · {report.page_type}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{report.summary}</p>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <div className={`text-4xl font-black leading-none ${scoreColor(report.composite_score)}`}>{report.composite_score?.toFixed(1)}</div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-1">{scoreWord(report.composite_score)}</div>
                  </div>
                </div>
                {report.persona_used && (
                  <div className="mt-3.5 p-2.5 bg-teal-50 rounded-lg text-xs text-slate-600 leading-relaxed">
                    <strong className="text-teal-600">Buyer lens:</strong> {report.persona_used}
                  </div>
                )}
              </div>
              <div className="flex justify-around py-4 px-3 bg-slate-50 flex-wrap gap-2">
                <Gauge score={report.scores?.seo?.score || 0} label="SEO" />
                <Gauge score={report.scores?.conversion?.score || 0} label="Conversion" />
                <Gauge score={report.scores?.technical?.score || 0} label="Technical" />
                <Gauge score={report.scores?.content?.score || 0} label="Content" />
              </div>
            </div>

            {/* Trust Ratio */}
            {report.trust_ratio && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3.5">
                <div className={`min-w-[52px] h-[52px] rounded-xl flex items-center justify-center ${report.trust_ratio.percentage >= 50 ? 'bg-amber-50' : 'bg-red-50'}`}>
                  <span className={`text-lg font-extrabold ${report.trust_ratio.percentage >= 80 ? 'text-green-500' : report.trust_ratio.percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                    {report.trust_ratio.percentage}%
                  </span>
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">Trust Ratio — {cn}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{report.trust_ratio.supported_claims} of {report.trust_ratio.total_claims} claims backed by proof.</p>
                  {report.trust_ratio.revenue_note && <p className="text-xs text-red-500 font-medium mt-0.5">💰 {report.trust_ratio.revenue_note}</p>}
                </div>
              </div>
            )}

            {/* Revenue Opportunity */}
            {report.revenue_opportunity && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-green-500">
                <div className="p-5">
                  <h3 className="text-[15px] font-bold text-slate-900 mb-3">📈 Revenue Opportunity for {cn}</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-[11px] font-bold text-red-500 mb-1">TODAY</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{report.revenue_opportunity.current_state}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-[11px] font-bold text-green-500 mb-1">AFTER FIXES</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{report.revenue_opportunity.fixed_state}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg text-sm text-white font-semibold leading-relaxed">{report.revenue_opportunity.bottom_line}</div>
                </div>
              </div>
            )}

            {/* Top Fixes */}
            {report.top_5_fixes && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-slate-900"><h3 className="text-sm font-bold text-white">🔧 What {cn} Should Fix First</h3></div>
                {report.top_5_fixes.map((fix: Record<string, string | number>, i: number) => (
                  <div key={i} className={`px-5 py-3.5 flex gap-3 items-start ${i < report.top_5_fixes.length - 1 ? 'border-b border-slate-200' : ''}`}>
                    <div className="min-w-[26px] h-[26px] rounded-lg bg-teal-600 flex items-center justify-center text-white text-xs font-extrabold shrink-0">{Number(fix.rank) || i + 1}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{fix.title}
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold ${fix.impact === 'High' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>{fix.impact}</span>
                        <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">{fix.effort}</span>
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">{fix.detail}</p>
                      {fix.revenue_rationale && <p className="text-[11px] text-red-500 font-semibold mt-1">💰 {fix.revenue_rationale}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Competitor Cards */}
            {report.competitor_comparisons?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">⚔️</span>
                  <h3 className="text-base font-extrabold text-slate-900">{cn} vs. The Competition</h3>
                </div>
                {report.competitor_comparisons.map((comp: CompComp, i: number) => {
                  const accents = ['border-l-blue-500', 'border-l-orange-500', 'border-l-violet-500'];
                  return (
                    <div key={i} className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-3 border-l-4 ${accents[i % 3]}`}>
                      <div className="px-4 py-2.5 bg-[#1B2A4A]">
                        <h4 className="text-sm font-bold text-white">{cn} vs. {comp.competitor_name}</h4>
                      </div>
                      <div className="p-4">
                        {comp.where_they_beat_us?.length > 0 && (
                          <div className="mb-2.5">
                            <p className="text-[11px] font-bold text-red-500 mb-1">✗ Where {comp.competitor_name} Steals {cn}'s Revenue</p>
                            {comp.where_they_beat_us.map((w, j) => <p key={j} className="text-xs text-slate-600 leading-relaxed pl-2.5 mb-0.5">• {w}</p>)}
                          </div>
                        )}
                        {comp.where_we_win?.length > 0 && (
                          <div className="mb-2.5">
                            <p className="text-[11px] font-bold text-green-500 mb-1">✓ Where {cn} Has the Edge</p>
                            {comp.where_we_win.map((w, j) => <p key={j} className="text-xs text-slate-600 leading-relaxed pl-2.5 mb-0.5">• {w}</p>)}
                          </div>
                        )}
                        {comp.opportunity && <p className="text-[11px] mb-1.5"><span className="font-bold text-amber-500">◐ Opportunity:</span> <span className="text-slate-600">{comp.opportunity}</span></p>}
                        <div className="p-2.5 bg-slate-100 rounded-lg text-xs text-slate-900 leading-relaxed italic">{comp.verdict}</div>
                      </div>
                    </div>
                  );
                })}
                {report.competitive_summary && report.competitive_summary !== 'N/A' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 border-l-4 border-l-amber-500">
                    <p className="text-xs font-bold text-slate-900 mb-1">🎯 Competitive Bottom Line</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{report.competitive_summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* Gap Analysis */}
            {report.gap_analysis && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-gradient-to-r from-teal-600 to-[#1B2A4A]">
                  <h3 className="text-sm font-bold text-white">🕳️ What {cn}'s Buyers Need But Don't Get</h3>
                </div>
                <div className="p-5 space-y-3.5">
                  {report.gap_analysis.unanswered_questions?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-900 mb-1.5">Questions Buyers Have That {cn} Doesn't Answer</p>
                      {report.gap_analysis.unanswered_questions.map((q: string, i: number) => <p key={i} className="text-xs text-slate-600 leading-relaxed pl-3 mb-0.5">❓ {q}</p>)}
                    </div>
                  )}
                  {report.gap_analysis.unaddressed_objections?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-900 mb-1.5">Objections That Send Buyers to Competitors</p>
                      {report.gap_analysis.unaddressed_objections.map((o: string, i: number) => <p key={i} className="text-xs text-slate-600 leading-relaxed pl-3 mb-0.5">🚫 {o}</p>)}
                    </div>
                  )}
                  {report.gap_analysis.missing_evidence?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-900 mb-1.5">Claims {cn} Makes Without Proof</p>
                      {report.gap_analysis.missing_evidence.map((e: string, i: number) => <p key={i} className="text-xs text-slate-600 leading-relaxed pl-3 mb-0.5">⚠️ {e}</p>)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detailed Score Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-200">
                {tabs.map(t => (
                  <button key={t.k} onClick={() => setTab(t.k)}
                    className={`flex-1 py-3 px-2 text-xs font-medium transition border-b-[3px] ${tab === t.k ? 'border-teal-600 text-teal-600 font-bold bg-white' : 'border-transparent text-slate-400 bg-slate-50'}`}>
                    {t.i} {t.l}
                    <span className={`block text-base font-extrabold mt-0.5 ${tab === t.k ? scoreColor(report.scores?.[t.k]?.score || 0) : 'text-slate-400'}`}>
                      {(report.scores?.[t.k]?.score || 0).toFixed(1)}
                    </span>
                  </button>
                ))}
              </div>
              {(report.scores?.[tab]?.factors || []).map((f: Factor, i: number) => (
                <div key={i} className="px-4 py-3 border-b border-slate-100 flex gap-3.5">
                  <div className={`min-w-[40px] h-[26px] rounded-md flex items-center justify-center ${f.score >= 4 ? 'bg-green-50' : f.score >= 2.5 ? 'bg-amber-50' : 'bg-red-50'}`}>
                    <span className={`text-sm font-bold font-mono ${scoreColor(f.score)}`}>{f.score.toFixed(1)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{f.name}</p>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{f.finding}</p>
                    {f.rec && <p className="text-xs text-teal-600 italic mt-1">→ {f.rec}</p>}
                    {f.revenue_impact && <p className="text-[11px] text-red-500 font-semibold mt-1">💰 {f.revenue_impact}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-[#1B2A4A] to-[#0F172A] rounded-2xl p-7 text-center">
              <h3 className="text-lg font-extrabold text-white mb-1.5">Ready to turn {cn}'s website into a revenue engine?</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto mb-5">
                NYN Impact builds websites that answer buyer questions, outperform competitors, and convert visitors into paying customers.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/build" className="px-6 py-2.5 text-sm font-bold rounded-lg bg-teal-500 text-white hover:bg-teal-400 transition no-underline">
                  Let's Talk →
                </Link>
                <button onClick={() => { setStep(1); setReport(null); setUrl(''); setPersona(''); setComps(['', '', '']); setIndustry(''); setPAuto(false); setCAuto(false); setError(''); }}
                  className="px-6 py-2.5 text-sm font-bold rounded-lg border-2 border-teal-400 text-teal-400 hover:bg-teal-400/10 transition">
                  Audit Another Site
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-4">Prepared by NYN Impact · nynimpact.com</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
