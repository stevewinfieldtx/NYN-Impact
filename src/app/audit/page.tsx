'use client';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

const scoreColor = (s: number) => s >= 4 ? 'text-green-500' : s >= 2.5 ? 'text-amber-500' : 'text-red-500';
const scoreWord = (s: number) => s >= 4.5 ? 'Excellent' : s >= 3.5 ? 'Good' : s >= 2.5 ? 'Needs Attention' : s >= 1.5 ? 'Underperforming' : 'Revenue Risk';

type Factor = { name: string; score: number; finding: string; rec: string; revenue_impact: string };
type BenchComp = { benchmark_name: string; benchmark_url: string; what_they_do_better: string[]; what_company_does_well: string[]; lesson: string; verdict: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Report = Record<string, any>;

async function api(path: string, body: Record<string, unknown>) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d;
}

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
  const [benchmarks, setBenchmarks] = useState(['', '', '']);
  const [bLoading, setBLoading] = useState(false);
  const [bAuto, setBAuto] = useState(false);
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('seo');
  const ref = useRef<HTMLDivElement>(null);
  const cn = report?.company_name || 'This Business';
  const setB = (i: number, v: string) => { const b = [...benchmarks]; b[i] = v; setBenchmarks(b); setBAuto(false); };

  const autoPersona = useCallback(async () => {
    setPLoading(true);
    try { const d = await api('/api/detect-persona', { url, industry }); setPersona(d.persona); setPAuto(true); }
    catch { setPersona('(Failed — describe manually)'); }
    setPLoading(false);
  }, [url, industry]);

  const autoBenchmarks = useCallback(async () => {
    setBLoading(true);
    try {
      const d = await api('/api/detect-competitors', { url, industry });
      setBenchmarks([(d.competitors[0]?.url || ''), (d.competitors[1]?.url || ''), (d.competitors[2]?.url || '')]);
      setBAuto(true);
    } catch { setBenchmarks(['(failed)', '', '']); }
    setBLoading(false);
  }, [url, industry]);

  const runAudit = useCallback(async () => {
    setStep(3); setError(''); setReport(null);
    try {
      setStatus('Reading the website...');
      let pageContent = '';
      try { const d = await api('/api/fetch-page', { url }); pageContent = d.content; } catch { /* ignore */ }

      const valid = benchmarks.filter(b => b && b.trim() && !b.includes('fail'));
      const benchData: { url: string; content: string }[] = [];
      for (let i = 0; i < valid.length; i++) {
        setStatus(`Studying best-in-class example ${i + 1}/${valid.length}...`);
        try { const d = await api('/api/fetch-page', { url: valid[i] }); benchData.push({ url: valid[i], content: d.content }); }
        catch { benchData.push({ url: valid[i], content: '' }); }
      }

      setStatus('Running full revenue impact analysis...');
      const d = await api('/api/audit', { url, pageContent, persona: persona || undefined, competitors: benchData });
      setReport(d.report); setStatus(''); setStep(4); setTab('seo');
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); setStatus(''); }
  }, [url, persona, benchmarks]);

  const tabs = [
    { k: 'seo', l: 'SEO', i: '🔍' }, { k: 'conversion', l: 'Conversion', i: '🎯' },
    { k: 'technical', l: 'Technical', i: '⚙️' }, { k: 'content', l: 'Content', i: '📝' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
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
            {step === 4 ? `An objective assessment of ${cn}'s online revenue potential.` : 'An objective, AI-powered analysis of any website\'s revenue potential.'}
          </p>
        </div>
      </div>

      <div className="max-w-[700px] mx-auto px-6 pt-4">
        <div className="flex gap-1">{[1, 2, 3, 4].map(i => (
          <div key={i} className={`flex-1 h-1 rounded transition-colors ${step >= i ? 'bg-teal-500' : 'bg-slate-700'}`} />
        ))}</div>
      </div>

      <div className="max-w-[700px] mx-auto px-6 mt-4 mb-16">

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-[#111118] rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-1">Enter the website to audit</h2>
            <p className="text-sm text-slate-400 mb-4">Paste any URL. The analysis will identify where the site is leaving revenue on the table and what can be done about it.</p>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && url.trim() && setStep(2)}
              placeholder="https://example.com"
              className="w-full px-3.5 py-3 text-sm text-white bg-[#0a0a0f] rounded-lg border-2 border-slate-600 focus:border-teal-500 outline-none transition placeholder:text-slate-500"
              autoFocus />
            <div className="flex justify-end mt-4">
              <button onClick={() => url.trim() && setStep(2)} disabled={!url.trim()}
                className="px-7 py-3 text-sm font-bold rounded-lg bg-teal-600 text-white disabled:opacity-40 hover:bg-teal-500 transition">Next →</button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-[#111118] rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-1">Context for the analysis</h2>
            <p className="text-sm text-slate-400 mb-5">Additional context produces sharper findings. If unknown, <span className="font-semibold text-teal-400">Auto-Detect</span> will infer from the site.</p>

            <div className="mb-5">
              <label className="text-sm font-semibold text-slate-300 block mb-1.5">Industry <span className="font-normal text-slate-500">(optional)</span></label>
              <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. French bakery, managed IT services, dental practice"
                className="w-full px-3.5 py-2.5 text-sm text-white bg-[#0a0a0f] rounded-lg border-2 border-slate-600 focus:border-teal-500 outline-none transition placeholder:text-slate-500" />
            </div>

            <div className="mb-5">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold text-slate-300">Target buyer profile</label>
                <button onClick={autoPersona} disabled={pLoading}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg border-[1.5px] border-teal-500 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition disabled:opacity-50">
                  {pLoading ? 'Analyzing...' : '⚡ Auto-Detect'}</button>
              </div>
              {pLoading && <div className="flex items-center gap-2 p-3 bg-teal-500/10 rounded-lg text-sm text-teal-400 mb-2">
                <div className="w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" /> Inferring the buyer profile from the site...</div>}
              <textarea value={persona} onChange={e => { setPersona(e.target.value); setPAuto(false); }} rows={4}
                placeholder="Who is the typical buyer? Role, company size, priorities, decision criteria. Or hit Auto-Detect to infer from the site."
                className="w-full px-3.5 py-2.5 text-sm text-white bg-[#0a0a0f] rounded-lg border-2 border-slate-600 focus:border-teal-500 outline-none transition resize-y min-h-[80px] placeholder:text-slate-500" />
              {pAuto && persona && !pLoading && <p className="text-xs text-teal-400 mt-1">✓ Auto-generated — edit if needed.</p>}
              <p className="text-xs text-slate-500 mt-1">The site will be evaluated through this buyer's eyes: does it answer their questions, address their objections, and earn their trust?</p>
            </div>

            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <label className="text-sm font-semibold text-slate-300 block">Best-in-class benchmarks</label>
                  <p className="text-xs text-slate-500 mt-0.5">The gold standard in this industry — websites or social pages representing the best online presence anywhere.</p>
                </div>
                <button onClick={autoBenchmarks} disabled={bLoading}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg border-[1.5px] border-teal-500 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition disabled:opacity-50 shrink-0 ml-3">
                  {bLoading ? 'Searching...' : '⚡ Find Best 3'}</button>
              </div>
              {bLoading && <div className="flex items-center gap-2 p-3 bg-teal-500/10 rounded-lg text-sm text-teal-400 mb-2">
                <div className="w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" /> Searching for the best-in-class examples...</div>}
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-teal-500/10 flex items-center justify-center text-xs font-bold text-teal-400 shrink-0">{i + 1}</div>
                  <input value={benchmarks[i]} onChange={e => setB(i, e.target.value)}
                    placeholder={['https://best-example.com or facebook.com/page', 'https://another-great-one.com', 'https://industry-leader.com (optional)'][i]}
                    className="w-full px-3.5 py-2.5 text-sm text-white bg-[#0a0a0f] rounded-lg border-2 border-slate-600 focus:border-teal-500 outline-none transition placeholder:text-slate-500" />
                </div>
              ))}
              {bAuto && benchmarks[0] && !bLoading && <p className="text-xs text-teal-400 mt-1">✓ Found via AI search. Edit or replace as needed.</p>}
            </div>

            <div className="flex justify-between pt-4 border-t border-white/10">
              <button onClick={() => setStep(1)} className="px-6 py-2.5 text-sm font-semibold rounded-lg border border-slate-600 text-slate-400 hover:bg-white/5 transition">← Back</button>
              <button onClick={runAudit} className="px-7 py-2.5 text-sm font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-500 transition">Run Audit →</button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="bg-[#111118] rounded-2xl border border-white/10 p-8 text-center">
            <div className="text-5xl mb-3">📊</div>
            <h2 className="text-lg font-bold text-white mb-2">Analysis in progress...</h2>
            <p className="text-sm text-slate-400 mb-4">Evaluating the site against buyer expectations and industry benchmarks.</p>
            {status && <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-500/10 rounded-lg text-sm text-teal-400">
              <div className="w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" /> {status}</div>}
            {error && <div className="mt-4">
              <p className="text-red-400 text-sm mb-3">⚠️ {error}</p>
              <button onClick={() => { setStep(2); setError(''); }} className="px-6 py-2.5 text-sm font-bold rounded-lg bg-teal-600 text-white">← Try Again</button>
            </div>}
          </div>
        )}

        {/* STEP 4: REPORT */}
        {step === 4 && report && (
          <div ref={ref} className="space-y-4">

            {report.revenue_headline && (
              <div className="bg-[#111118] rounded-2xl border border-white/10 p-5 border-l-4 border-l-red-500">
                <p className="text-[15px] font-bold text-white leading-relaxed">💰 {report.revenue_headline}</p>
              </div>
            )}

            <div className="bg-[#111118] rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-[11px] font-bold text-teal-400 uppercase tracking-wider mb-1">Revenue Audit</p>
                    <h2 className="text-xl font-extrabold text-white">{cn}</h2>
                    <p className="text-xs text-slate-500 mb-2.5">{url} · {report.page_type}</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{report.summary}</p>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <div className={`text-4xl font-black leading-none ${scoreColor(report.composite_score)}`}>{report.composite_score?.toFixed(1)}</div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-1">{scoreWord(report.composite_score)}</div>
                  </div>
                </div>
                {report.persona_used && (
                  <div className="mt-3.5 p-2.5 bg-teal-500/10 rounded-lg text-xs text-slate-300 leading-relaxed">
                    <strong className="text-teal-400">Buyer lens:</strong> {report.persona_used}
                  </div>
                )}
              </div>
              <div className="flex justify-around py-4 px-3 bg-[#0a0a0f] flex-wrap gap-2">
                <Gauge score={report.scores?.seo?.score || 0} label="SEO" />
                <Gauge score={report.scores?.conversion?.score || 0} label="Conversion" />
                <Gauge score={report.scores?.technical?.score || 0} label="Technical" />
                <Gauge score={report.scores?.content?.score || 0} label="Content" />
              </div>
            </div>

            {report.trust_ratio && (
              <div className="bg-[#111118] rounded-2xl border border-white/10 p-4 flex items-center gap-3.5">
                <div className={`min-w-[52px] h-[52px] rounded-xl flex items-center justify-center ${report.trust_ratio.percentage >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                  <span className={`text-lg font-extrabold ${report.trust_ratio.percentage >= 80 ? 'text-green-400' : report.trust_ratio.percentage >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {report.trust_ratio.percentage}%
                  </span>
                </div>
                <div>
                  <p className="font-bold text-sm text-white">Trust Ratio</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{report.trust_ratio.supported_claims} of {report.trust_ratio.total_claims} marketing claims on the site are backed by evidence.</p>
                  {report.trust_ratio.revenue_note && <p className="text-xs text-red-400 font-medium mt-0.5">💰 {report.trust_ratio.revenue_note}</p>}
                </div>
              </div>
            )}

            {report.revenue_opportunity && (
              <div className="bg-[#111118] rounded-2xl border border-white/10 overflow-hidden border-l-4 border-l-green-500">
                <div className="p-5">
                  <h3 className="text-[15px] font-bold text-white mb-3">📈 Revenue Opportunity</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-3 bg-red-500/10 rounded-lg">
                      <p className="text-[11px] font-bold text-red-400 mb-1">CURRENT STATE</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{report.revenue_opportunity.current_state}</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <p className="text-[11px] font-bold text-green-400 mb-1">AFTER FIXES</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{report.revenue_opportunity.fixed_state}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg text-sm text-white font-semibold leading-relaxed">{report.revenue_opportunity.bottom_line}</div>
                </div>
              </div>
            )}

            {report.top_5_fixes && (
              <div className="bg-[#111118] rounded-2xl border border-white/10 overflow-hidden">
                <div className="px-5 py-3 bg-white/5"><h3 className="text-sm font-bold text-white">🔧 Priority Fixes</h3></div>
                {report.top_5_fixes.map((fix: Record<string, string | number>, i: number) => (
                  <div key={i} className={`px-5 py-3.5 flex gap-3 items-start ${i < report.top_5_fixes.length - 1 ? 'border-b border-white/5' : ''}`}>
                    <div className="min-w-[26px] h-[26px] rounded-lg bg-teal-600 flex items-center justify-center text-white text-xs font-extrabold shrink-0">{Number(fix.rank) || i + 1}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{fix.title}
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold ${fix.impact === 'High' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>{fix.impact}</span>
                        <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-slate-400">{fix.effort}</span>
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1">{fix.detail}</p>
                      {fix.revenue_rationale && <p className="text-[11px] text-red-400 font-semibold mt-1">💰 {fix.revenue_rationale}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {report.benchmark_comparisons?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🏆</span>
                  <h3 className="text-base font-extrabold text-white">{cn} vs. Best in Class</h3>
                </div>
                {report.benchmark_comparisons.map((bench: BenchComp, i: number) => {
                  const accents = ['border-l-blue-500', 'border-l-orange-500', 'border-l-violet-500'];
                  return (
                    <div key={i} className={`bg-[#111118] rounded-2xl border border-white/10 overflow-hidden mb-3 border-l-4 ${accents[i % 3]}`}>
                      <div className="px-4 py-2.5 bg-white/5">
                        <h4 className="text-sm font-bold text-white">{cn} vs. {bench.benchmark_name}</h4>
                        <p className="text-[10px] text-slate-500">{bench.benchmark_url}</p>
                      </div>
                      <div className="p-4">
                        {bench.what_they_do_better?.length > 0 && (
                          <div className="mb-2.5">
                            <p className="text-[11px] font-bold text-red-400 mb-1">✗ Where the Benchmark Outperforms</p>
                            {bench.what_they_do_better.map((w: string, j: number) => <p key={j} className="text-xs text-slate-400 leading-relaxed pl-2.5 mb-0.5">• {w}</p>)}
                          </div>
                        )}
                        {bench.what_company_does_well?.length > 0 && (
                          <div className="mb-2.5">
                            <p className="text-[11px] font-bold text-green-400 mb-1">✓ Where {cn} Already Matches or Exceeds</p>
                            {bench.what_company_does_well.map((w: string, j: number) => <p key={j} className="text-xs text-slate-400 leading-relaxed pl-2.5 mb-0.5">• {w}</p>)}
                          </div>
                        )}
                        {bench.lesson && <p className="text-[11px] mb-1.5"><span className="font-bold text-amber-400">💡 Key takeaway:</span> <span className="text-slate-300">{bench.lesson}</span></p>}
                        <div className="p-2.5 bg-white/5 rounded-lg text-xs text-slate-300 leading-relaxed italic">{bench.verdict}</div>
                      </div>
                    </div>
                  );
                })}
                {report.benchmark_summary && report.benchmark_summary !== 'N/A' && (
                  <div className="bg-[#111118] rounded-2xl border border-white/10 p-4 border-l-4 border-l-amber-500">
                    <p className="text-xs font-bold text-white mb-1">🎯 Benchmark Summary</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{report.benchmark_summary}</p>
                  </div>
                )}
              </div>
            )}

            {report.gap_analysis && (
              <div className="bg-[#111118] rounded-2xl border border-white/10 overflow-hidden">
                <div className="px-5 py-3 bg-gradient-to-r from-teal-600 to-[#1B2A4A]">
                  <h3 className="text-sm font-bold text-white">🕳️ Gap Analysis: What Buyers Need But Don't Find</h3>
                </div>
                <div className="p-5 space-y-3.5">
                  {report.gap_analysis.unanswered_questions?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-200 mb-1.5">Unanswered Buyer Questions</p>
                      {report.gap_analysis.unanswered_questions.map((q: string, i: number) => <p key={i} className="text-xs text-slate-400 leading-relaxed pl-3 mb-0.5">❓ {q}</p>)}
                    </div>
                  )}
                  {report.gap_analysis.unaddressed_objections?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-200 mb-1.5">Unaddressed Buyer Objections</p>
                      {report.gap_analysis.unaddressed_objections.map((o: string, i: number) => <p key={i} className="text-xs text-slate-400 leading-relaxed pl-3 mb-0.5">🚫 {o}</p>)}
                    </div>
                  )}
                  {report.gap_analysis.missing_evidence?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-200 mb-1.5">Unsupported Marketing Claims</p>
                      {report.gap_analysis.missing_evidence.map((e: string, i: number) => <p key={i} className="text-xs text-slate-400 leading-relaxed pl-3 mb-0.5">⚠️ {e}</p>)}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-[#111118] rounded-2xl border border-white/10 overflow-hidden">
              <div className="flex border-b border-white/10">
                {tabs.map(t => (
                  <button key={t.k} onClick={() => setTab(t.k)}
                    className={`flex-1 py-3 px-2 text-xs font-medium transition border-b-[3px] ${tab === t.k ? 'border-teal-500 text-teal-400 font-bold bg-[#111118]' : 'border-transparent text-slate-500 bg-[#0a0a0f]'}`}>
                    {t.i} {t.l}
                    <span className={`block text-base font-extrabold mt-0.5 ${tab === t.k ? scoreColor(report.scores?.[t.k]?.score || 0) : 'text-slate-600'}`}>
                      {(report.scores?.[t.k]?.score || 0).toFixed(1)}
                    </span>
                  </button>
                ))}
              </div>
              {(report.scores?.[tab]?.factors || []).map((f: Factor, i: number) => (
                <div key={i} className="px-4 py-3 border-b border-white/5 flex gap-3.5">
                  <div className={`min-w-[40px] h-[26px] rounded-md flex items-center justify-center ${f.score >= 4 ? 'bg-green-500/10' : f.score >= 2.5 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                    <span className={`text-sm font-bold font-mono ${scoreColor(f.score)}`}>{f.score.toFixed(1)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{f.name}</p>
                    <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{f.finding}</p>
                    {f.rec && <p className="text-xs text-teal-400 italic mt-1">→ {f.rec}</p>}
                    {f.revenue_impact && <p className="text-[11px] text-red-400 font-semibold mt-1">💰 {f.revenue_impact}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-[#1B2A4A] to-[#0F172A] rounded-2xl p-7 text-center border border-white/10">
              <h3 className="text-lg font-extrabold text-white mb-1.5">Every issue above is fixable.</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto mb-5">
                NYN Impact specializes in building websites that convert — informed by data, not guesswork. This audit is the starting point.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/build" className="px-6 py-2.5 text-sm font-bold rounded-lg bg-teal-500 text-white hover:bg-teal-400 transition no-underline">
                  Start a Project →
                </Link>
                <button onClick={() => { setStep(1); setReport(null); setUrl(''); setPersona(''); setBenchmarks(['', '', '']); setIndustry(''); setPAuto(false); setBAuto(false); setError(''); }}
                  className="px-6 py-2.5 text-sm font-bold rounded-lg border-2 border-teal-400 text-teal-400 hover:bg-teal-400/10 transition">
                  Audit Another Site
                </button>
              </div>
              <p className="text-[11px] text-slate-600 mt-4">Analysis by NYN Impact · nynimpact.com</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
