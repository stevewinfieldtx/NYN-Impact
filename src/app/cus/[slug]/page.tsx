'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PenTool, ExternalLink, Clock, Globe, ChevronRight, Mail, ArrowRight, LogOut, Zap, PartyPopper } from 'lucide-react';

interface SiteInfo {
  id: string;
  version_label: string;
  vercel_url: string | null;
  is_published: boolean;
  content_schema: Record<string, unknown>;
  project: {
    business_name: string;
    status: string;
  };
  edit_count: number;
  last_edited: string | null;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CustomerPortal({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === '1';

  const [slug, setSlug] = useState('');
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  useEffect(() => {
    params.then(p => {
      setSlug(p.slug);
      const saved = sessionStorage.getItem(`nyn_verified_${p.slug}`);
      if (saved) {
        const data = JSON.parse(saved);
        setCustomerName(data.name);
        setVerified(true);
        if (isWelcome) setShowWelcomeBanner(true);
        fetchSites(p.slug);
      } else {
        setLoading(false);
      }
    });
  }, [params, isWelcome]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setVerifyError('');

    try {
      const res = await fetch(`${API}/api/customer/${slug}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setVerifyError(data.error || 'Sign in failed');
        return;
      }

      sessionStorage.setItem(`nyn_verified_${slug}`, JSON.stringify({
        name: data.customer.name,
        id: data.customer.id,
      }));
      setCustomerName(data.customer.name);
      setVerified(true);
      fetchSites(slug);
    } catch {
      setVerifyError('Could not connect. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(`nyn_verified_${slug}`);
    setVerified(false);
    setSites([]);
    setEmail('');
    setPassword('');
    setCustomerName('');
    setShowWelcomeBanner(false);
  }

  async function fetchSites(customerSlug: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/customer/${customerSlug}/sites`);
      if (res.ok) {
        const data = await res.json();
        setSites(data.sites || []);
      }
    } catch (err) {
      console.error('Failed to fetch sites:', err);
    } finally {
      setLoading(false);
    }
  }

  // ── Sign In Screen ──
  if (!verified) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6] flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto mb-6 bg-purple-500/10 border-2 border-purple-500/30 rounded-2xl flex items-center justify-center">
              <Mail className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Fraunces, serif' }}>
              Welcome to your portal
            </h1>
            <p className="text-[#a0a0b0]">
              Sign in to access and edit your website.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-sm text-[#a0a0b0] mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-[#f0ede6] placeholder-[#505060] focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                placeholder="you@company.com"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-[#a0a0b0] mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-[#f0ede6] placeholder-[#505060] focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                placeholder="Enter your password"
              />
            </div>

            {verifyError && (
              <p className="text-red-400 text-sm text-center">{verifyError}</p>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-base font-semibold transition-all disabled:opacity-50"
            >
              {verifying ? 'Signing in...' : 'Sign In'}
              {!verifying && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-[#505060] text-xs mt-6">
            Need help?{' '}
            <a href="mailto:support@nynimpact.com" className="text-purple-400 hover:text-purple-300 transition-colors">
              support@nynimpact.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ── Authenticated Portal ──
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6]">
      <nav className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'Fraunces, serif' }}>
            NYN<span className="text-purple-400">Impact</span>
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#a0a0b0]">{customerName}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-[#707080] hover:text-[#f0ede6] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Welcome banner — shown only right after completing the build flow */}
        {showWelcomeBanner && (
          <div className="mb-8 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-6 flex items-start gap-4">
            <PartyPopper className="w-8 h-8 text-purple-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[#f0ede6] mb-1">
                Your site is live, {customerName.split(' ')[0]}! 🎉
              </h2>
              <p className="text-[#a0a0b0] text-sm mb-3">
                This is your portal — bookmark this page. Come back anytime to update your website just by typing what you want changed. No developers. No waiting. No extra cost.
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-emerald-400">
                <span>✓ Edit any text or content</span>
                <span>✓ Update photos &amp; images</span>
                <span>✓ AI health scans &amp; auto-fixes</span>
                <span>✓ Changes go live in seconds</span>
              </div>
            </div>
            <button
              onClick={() => setShowWelcomeBanner(false)}
              className="text-[#505060] hover:text-[#f0ede6] text-xl leading-none transition-colors shrink-0"
            >
              ×
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Fraunces, serif' }}>
            {showWelcomeBanner
              ? `You're live, ${customerName.split(' ')[0]}!`
              : `Welcome back, ${customerName.split(' ')[0]}`}
          </h1>
          <p className="text-[#a0a0b0]">
            {showWelcomeBanner
              ? 'Your website is built. Edit it anytime — just type what you want changed.'
              : 'Manage and edit your websites below.'}
          </p>
        </div>

        {/* Sites */}
        {loading ? (
          <div className="text-center py-20 text-[#505060]">Loading your sites...</div>
        ) : sites.length === 0 ? (
          <div className="text-center py-20">
            <Globe className="w-12 h-12 text-[#505060] mx-auto mb-4" />
            <p className="text-[#a0a0b0] mb-2">No sites yet</p>
            <p className="text-[#505060] text-sm">Your website will appear here once it&apos;s built.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {sites.map(site => (
              <div key={site.id} className="bg-[#111118] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold">{site.project.business_name}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        site.is_published
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {site.is_published ? 'Live' : 'Draft'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-[#707080]">
                      {site.vercel_url && (
                        <a href={site.vercel_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-purple-400 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View site
                        </a>
                      )}
                      <span className="flex items-center gap-1">
                        <PenTool className="w-3.5 h-3.5" />
                        {site.edit_count} edits
                      </span>
                      {site.last_edited && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Last edited {new Date(site.last_edited).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/cus/${slug}/health?site=${site.id}`}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      AI Health
                    </Link>
                    <Link
                      href={`/cus/${slug}/edit?site=${site.id}`}
                      className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-purple-500/20"
                    >
                      <PenTool className="w-4 h-4" />
                      Edit Site
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
