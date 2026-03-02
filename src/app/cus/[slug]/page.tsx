'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PenTool, ExternalLink, Clock, Globe, ChevronRight } from 'lucide-react';

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

export default function CustomerPortal({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState('');
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    params.then(p => {
      setSlug(p.slug);
      fetchSites(p.slug);
    });
  }, [params]);

  async function fetchSites(customerSlug: string) {
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6]">
      {/* Header */}
      <nav className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'Fraunces, serif' }}>
            NYN<span className="text-purple-400">Impact</span>
          </span>
          <span className="text-sm text-[#a0a0b0]">Customer Portal</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Fraunces, serif' }}>
            Welcome back{slug ? `, ${decodeURIComponent(slug).replace(/-/g, ' ')}` : ''}
          </h1>
          <p className="text-[#a0a0b0]">Manage and edit your websites below.</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#505060]">Loading your sites...</div>
        ) : sites.length === 0 ? (
          <div className="text-center py-20">
            <Globe className="w-12 h-12 text-[#505060] mx-auto mb-4" />
            <p className="text-[#a0a0b0] mb-2">No sites yet</p>
            <p className="text-[#505060] text-sm">Your websites will appear here once they&apos;re built.</p>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
