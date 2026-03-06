'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, LogIn } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Look up which slug belongs to this email
      const res = await fetch(`${API}/api/customer/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid email or password.');
        return;
      }

      // Cache the session then redirect to their portal
      sessionStorage.setItem(`nyn_verified_${data.slug}`, JSON.stringify({
        name: data.customer.name,
        id: data.customer.id,
      }));

      router.push(`/cus/${data.slug}`);
    } catch {
      setError('Could not connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight"
            style={{ fontFamily: 'Fraunces, serif' }}
          >
            NYN<span className="text-purple-400">Impact</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-[#707080] hover:text-[#f0ede6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </nav>

      {/* Sign In Card */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          {/* Icon */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto mb-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center">
              <LogIn className="w-7 h-7 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Fraunces, serif' }}>
              Welcome back
            </h1>
            <p className="text-[#a0a0b0]">
              Sign in to manage your website.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm text-[#a0a0b0] mb-1.5">Email Address</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-[#f0ede6] placeholder-[#303040] focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-[#a0a0b0] mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-[#f0ede6] placeholder-[#303040] focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center py-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-base font-semibold transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/20"
            >
              {loading ? 'Signing in…' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-[#505060] text-xs mt-8">
            Need help?{' '}
            <a href="mailto:support@nynimpact.com" className="text-purple-400 hover:text-purple-300 transition-colors">
              support@nynimpact.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
