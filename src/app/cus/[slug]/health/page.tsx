'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp, Send, FileText, Zap } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Issue {
  id: string;
  source: 'auto_scan' | 'client_submitted' | 'content_request';
  status: 'open' | 'diagnosed' | 'fix_ready' | 'applied' | 'dismissed';
  severity: 'critical' | 'warning' | 'info';
  issue_description: string;
  ai_diagnosis: string | null;
  ai_fix_recommendation: string | null;
  client_notes: string | null;
  created_at: string;
}

interface ScanResult {
  scan_summary: string;
  overall_health: 'excellent' | 'good' | 'needs_attention' | 'critical';
  issues_count: number;
  quick_wins: string[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'critical') return <AlertTriangle className="w-4 h-4 text-red-400" />;
  if (severity === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return <Info className="w-4 h-4 text-blue-400" />;
}

function HealthBadge({ health }: { health: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    excellent: { label: '✓ Excellent', classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    good: { label: '↑ Good', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    needs_attention: { label: '! Needs Attention', classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    critical: { label: '✕ Critical', classes: 'bg-red-500/10 text-red-400 border-red-500/20' },
  };
  const c = config[health] || { label: '— Unknown', classes: 'bg-white/5 text-[#707080] border-white/10' };
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${c.classes}`}>
      {c.label}
    </span>
  );
}

function IssueCard({ issue, onApply, onDismiss }: {
  issue: Issue;
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const resolved = ['applied', 'dismissed'].includes(issue.status);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${resolved ? 'border-white/5 opacity-50' : 'border-white/10 bg-[#111118]'}`}>
      <div
        className="flex items-start justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5 shrink-0">
            <SeverityIcon severity={issue.severity} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#f0ede6] truncate">{issue.issue_description}</p>
            <p className="text-xs text-[#505060] mt-0.5">
              {issue.source.replace('_', ' ')} · {new Date(issue.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            issue.status === 'applied' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            issue.status === 'dismissed' ? 'bg-white/5 text-[#505060] border-white/10' :
            issue.status === 'diagnosed' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
            'bg-white/5 text-[#707080] border-white/10'
          }`}>
            {issue.status.replace('_', ' ')}
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[#505060]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#505060]" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 bg-[#0d0d14] p-4 space-y-3">
          {issue.ai_diagnosis && (
            <div>
              <p className="text-xs font-semibold text-[#505060] uppercase tracking-wider mb-1">AI Diagnosis</p>
              <p className="text-sm text-[#a0a0b0]">{issue.ai_diagnosis}</p>
            </div>
          )}
          {issue.ai_fix_recommendation && (
            <div>
              <p className="text-xs font-semibold text-[#505060] uppercase tracking-wider mb-1">Recommended Fix</p>
              <p className="text-sm text-[#a0a0b0]">{issue.ai_fix_recommendation}</p>
            </div>
          )}
          {!resolved && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onApply(issue.id)}
                className="text-xs font-semibold px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
              >
                Mark as Fixed
              </button>
              <button
                onClick={() => onDismiss(issue.id)}
                className="text-xs font-semibold px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[#a0a0b0] border border-white/10 rounded-lg transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SiteHealthPage({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('site');

  const [slug, setSlug] = useState('');
  const [activeTab, setActiveTab] = useState<'health' | 'issues' | 'content'>('health');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);

  // Submit issue form
  const [issueDesc, setIssueDesc] = useState('');
  const [issueNotes, setIssueNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Content request form
  const [contentPage, setContentPage] = useState('/');
  const [contentRequest, setContentRequest] = useState('');
  const [contentSubmitting, setContentSubmitting] = useState(false);
  const [contentResult, setContentResult] = useState<{ changes_summary: string; improvement_highlights: string[] } | null>(null);

  useEffect(() => {
    params.then(p => setSlug(p.slug));
    if (siteId) fetchIssues();
  }, [siteId]);

  async function fetchIssues() {
    try {
      const res = await fetch(`${API}/api/ai-self-correct/${siteId}/issues`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function triggerScan() {
    if (!siteId) return;
    setScanning(true);
    try {
      const res = await fetch(`${API}/api/ai-self-correct/${siteId}/scan`);
      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
        await fetchIssues();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  }

  async function applyFix(issueId: string) {
    await fetch(`${API}/api/ai-self-correct/${siteId}/issues/${issueId}/apply`, { method: 'POST' });
    fetchIssues();
  }

  async function dismissIssue(issueId: string) {
    await fetch(`${API}/api/ai-self-correct/${siteId}/issues/${issueId}/dismiss`, { method: 'POST' });
    fetchIssues();
  }

  async function submitIssue() {
    if (!issueDesc.trim() || !siteId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/ai-self-correct/${siteId}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: issueDesc, client_notes: issueNotes }),
      });
      if (res.ok) {
        setSubmitSuccess(true);
        setIssueDesc('');
        setIssueNotes('');
        await fetchIssues();
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitContentRequest() {
    if (!contentRequest.trim() || !siteId) return;
    setContentSubmitting(true);
    try {
      const res = await fetch(`${API}/api/ai-self-correct/${siteId}/content/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_path: contentPage, request_notes: contentRequest }),
      });
      if (res.ok) {
        const data = await res.json();
        setContentResult(data.ai_result);
        setContentRequest('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setContentSubmitting(false);
    }
  }

  const openIssues = issues.filter(i => !['applied', 'dismissed'].includes(i.status));
  const resolvedIssues = issues.filter(i => ['applied', 'dismissed'].includes(i.status));
  const criticalCount = openIssues.filter(i => i.severity === 'critical').length;

  if (!siteId) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6] flex items-center justify-center">
        <p className="text-[#505060]">No site selected.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6]">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link
            href={`/cus/${slug}`}
            className="flex items-center gap-1.5 text-sm text-[#707080] hover:text-[#f0ede6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to portal
          </Link>
          <span className="text-[#303040]">/</span>
          <span className="text-sm font-medium">AI Self-Correct</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>AI Self-Correct</h1>
            <p className="text-sm text-[#707080] mt-1">Detect issues, get diagnoses, and update your site — powered by AI.</p>
          </div>
          {scanResult && <HealthBadge health={scanResult.overall_health} />}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111118] border border-white/5 rounded-xl p-1">
          {[
            { id: 'health', label: 'Health Scan', icon: <Zap className="w-3.5 h-3.5" /> },
            { id: 'issues', label: `Issues${openIssues.length > 0 ? ` (${openIssues.length})` : ''}`, icon: <AlertTriangle className="w-3.5 h-3.5" />, badge: criticalCount },
            { id: 'content', label: 'Content Updates', icon: <FileText className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 px-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#0a0a0f] text-[#f0ede6] shadow-sm'
                  : 'text-[#505060] hover:text-[#a0a0b0]'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge ? (
                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ── Health Scan Tab ── */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            <button
              onClick={triggerScan}
              disabled={scanning}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 rounded-xl font-semibold transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning your site…' : 'Run AI Health Scan'}
            </button>

            {scanResult && (
              <div className="bg-[#111118] border border-white/10 rounded-xl p-5 space-y-3">
                <p className="font-medium text-[#f0ede6]">{scanResult.scan_summary}</p>
                <p className="text-sm text-[#707080]">
                  Found {scanResult.issues_count} issue{scanResult.issues_count !== 1 ? 's' : ''} · Check the Issues tab for details
                </p>
                {scanResult.quick_wins?.length > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-xs font-semibold text-[#505060] uppercase tracking-wider mb-2">Quick Wins</p>
                    {scanResult.quick_wins.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-[#a0a0b0] mb-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        {w}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!scanResult && (
              <div className="text-center py-16 text-[#303040]">
                <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Run a scan to check your site's health</p>
              </div>
            )}
          </div>
        )}

        {/* ── Issues Tab ── */}
        {activeTab === 'issues' && (
          <div className="space-y-5">
            {/* Submit form */}
            <div className="bg-[#111118] border border-white/10 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-[#f0ede6]">Report an Issue</h3>
              <p className="text-sm text-[#707080]">Describe the problem in plain English — AI diagnoses it instantly.</p>
              <textarea
                value={issueDesc}
                onChange={e => setIssueDesc(e.target.value)}
                placeholder="e.g. The contact form on the homepage isn't sending emails…"
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-sm text-[#f0ede6] placeholder-[#303040] focus:outline-none focus:border-purple-500/50 resize-none"
                rows={3}
              />
              <input
                value={issueNotes}
                onChange={e => setIssueNotes(e.target.value)}
                placeholder="Any extra context? (optional)"
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#f0ede6] placeholder-[#303040] focus:outline-none focus:border-purple-500/50"
              />
              <button
                onClick={submitIssue}
                disabled={submitting || !issueDesc.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Analyzing with AI…' : submitSuccess ? '✓ Submitted & Diagnosed!' : 'Submit Issue'}
              </button>
            </div>

            {/* Issue list */}
            {loading ? (
              <p className="text-center text-sm text-[#303040] py-8">Loading…</p>
            ) : openIssues.length === 0 && resolvedIssues.length === 0 ? (
              <div className="text-center py-16 text-[#303040]">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No issues yet — run a scan or report one above</p>
              </div>
            ) : (
              <>
                {openIssues.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#505060] uppercase tracking-wider">Open ({openIssues.length})</p>
                    {openIssues.map(issue => (
                      <IssueCard key={issue.id} issue={issue} onApply={applyFix} onDismiss={dismissIssue} />
                    ))}
                  </div>
                )}
                {resolvedIssues.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#505060] uppercase tracking-wider">Resolved ({resolvedIssues.length})</p>
                    {resolvedIssues.map(issue => (
                      <IssueCard key={issue.id} issue={issue} onApply={applyFix} onDismiss={dismissIssue} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Content Tab ── */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            <div className="bg-[#111118] border border-white/10 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-[#f0ede6]">Request a Content Update</h3>
              <p className="text-sm text-[#707080]">Tell us what you want changed — AI rewrites it for your approval.</p>
              <input
                value={contentPage}
                onChange={e => setContentPage(e.target.value)}
                placeholder="Page path (e.g. /, /about, /services)"
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#f0ede6] placeholder-[#303040] focus:outline-none focus:border-purple-500/50"
              />
              <textarea
                value={contentRequest}
                onChange={e => setContentRequest(e.target.value)}
                placeholder="e.g. Update the homepage headline to focus more on our new catering service…"
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-sm text-[#f0ede6] placeholder-[#303040] focus:outline-none focus:border-purple-500/50 resize-none"
                rows={3}
              />
              <button
                onClick={submitContentRequest}
                disabled={contentSubmitting || !contentRequest.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                {contentSubmitting ? 'Generating AI Rewrite…' : 'Request Update'}
              </button>
            </div>

            {contentResult && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <p className="text-sm font-semibold text-emerald-400">AI Rewrite Ready</p>
                </div>
                <p className="text-sm text-[#a0a0b0]">{contentResult.changes_summary}</p>
                {contentResult.improvement_highlights?.length > 0 && (
                  <ul className="space-y-1">
                    {contentResult.improvement_highlights.map((h, i) => (
                      <li key={i} className="text-xs text-[#707080] flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">✓</span> {h}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-[#505060]">Go to the Issues tab to review and approve the full rewrite.</p>
              </div>
            )}

            {!contentResult && (
              <div className="text-center py-12 text-[#303040]">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Describe what you want updated above</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
