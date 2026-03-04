'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Globe, Building2, Loader2, CheckCircle, Search, FileSearch, TrendingUp } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

export default function StartPage() {
  const [businessName, setBusinessName] = useState('');
  const [businessUrl, setBusinessUrl] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phase, setPhase] = useState<'form' | 'interview' | 'complete'>('form');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [projectId, setProjectId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Research status
  const [parallelStatus, setParallelStatus] = useState({
    autopsy: 'idle' as 'idle' | 'running' | 'done',
    competitors: 'idle' as 'idle' | 'running' | 'done',
    bestPractices: 'idle' as 'idle' | 'running' | 'done',
  });

  useEffect(() => {
    const name = sessionStorage.getItem('nyn_customer_name');
    if (name) setCustomerName(name);
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function startParallelResearch() {
    setParallelStatus(s => ({ ...s, autopsy: 'running' }));
    setTimeout(() => setParallelStatus(s => ({ ...s, competitors: 'running' })), 1500);
    setTimeout(() => setParallelStatus(s => ({ ...s, bestPractices: 'running' })), 3000);

    const customerId = sessionStorage.getItem('nyn_customer_id');
    try {
      const res = await fetch(`${API}/api/interview/start-research`, {
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
  }

  async function handleReady(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem('nyn_business_name', businessName);
    sessionStorage.setItem('nyn_business_url', businessUrl);

    // Start parallel research if they have a URL
    if (businessUrl) {
      startParallelResearch();
    }

    // Start the text interview
    const customerId = sessionStorage.getItem('nyn_customer_id');
    if (!customerId) return;

    setPhase('interview');
    setSending(true);

    try {
      const res = await fetch(`${API}/api/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      const data = await res.json();
      if (data.success) {
        setProjectId(data.projectId);
        sessionStorage.setItem('nyn_project_id', data.projectId);
        setMessages([{ role: 'assistant', content: data.message }]);
      }
    } catch (err) {
      console.error('Interview start failed:', err);
    } finally {
      setSending(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setSending(true);

    try {
      const res = await fetch(`${API}/api/interview/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, message: userMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        if (data.complete) {
          setPhase('complete');
        }
      }
    } catch (err) {
      console.error('Message failed:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, something went wrong. Could you try that again?" }]);
    } finally {
      setSending(false);
    }
  }

  // ── Interview Phase (Text Chat) ──
  if (phase === 'interview' || phase === 'complete') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#f0ede6] flex flex-col items-center px-6 pt-10">
        <div className="max-w-2xl w-full text-center mb-6">
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Fraunces, serif' }}>
            Tell us about <span className="text-purple-400">{businessName}</span>
          </h1>
          <p className="text-[#a0a0b0] text-sm">
            Chat with our AI — just answer naturally. This takes about 5–10 minutes.
          </p>
        </div>

        <div className="w-full max-w-2xl flex-1 flex flex-col" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto bg-[#111118] border border-white/10 rounded-t-2xl p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-md'
                    : 'bg-[#1a1a25] text-[#e0e0e8] rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a25] text-[#707080] px-4 py-3 rounded-2xl rounded-bl-md text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {phase === 'complete' ? (
            <div className="bg-[#111118] border border-white/10 border-t-0 rounded-b-2xl p-4 text-center">
              <p className="text-emerald-400 font-medium mb-3 flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Interview complete!
              </p>
              <button
                onClick={() => window.location.href = '/build/choose'}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full text-sm font-semibold transition-all hover:shadow-xl hover:shadow-purple-500/20"
              >
                Show Me My Sites!
              </button>
            </div>
          ) : (
            <form onSubmit={sendMessage} className="bg-[#111118] border border-white/10 border-t-0 rounded-b-2xl p-4 flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={sending}
                placeholder="Type your answer..."
                className="flex-1 px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-[#f0ede6] placeholder-[#505060] focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all disabled:opacity-50"
                autoFocus
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/30 rounded-xl transition-all disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>

        {/* Research Status */}
        {businessUrl && (
          <div className="w-full max-w-2xl mt-6 mb-8">
            <div className="bg-[#111118] border border-white/5 rounded-2xl p-5">
              <p className="text-xs text-[#707080] mb-3 font-medium uppercase tracking-wide">While we chat, we&apos;re researching...</p>
              <div className="flex gap-6">
                <StatusRow icon={FileSearch} label="Website analysis" status={parallelStatus.autopsy} />
                <StatusRow icon={Search} label="Competitors" status={parallelStatus.competitors} />
                <StatusRow icon={TrendingUp} label="Best practices" status={parallelStatus.bestPractices} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Form Phase ──
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
            <MessageCircle className="w-5 h-5" />
            Start My Interview
          </button>
        </form>
      </div>
    </div>
  );
}

function StatusRow({ icon: Icon, label, status }: { icon: React.ComponentType<{ className?: string }>; label: string; status: 'idle' | 'running' | 'done' }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
        status === 'done' ? 'bg-emerald-500/10' : status === 'running' ? 'bg-purple-500/10' : 'bg-[#1a1a25]'
      }`}>
        {status === 'done' ? (
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        ) : status === 'running' ? (
          <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
        ) : (
          <Icon className="w-3.5 h-3.5 text-[#505060]" />
        )}
      </div>
      <span className={`text-xs ${
        status === 'done' ? 'text-emerald-400' : status === 'running' ? 'text-[#f0ede6]' : 'text-[#505060]'
      }`}>
        {label}
      </span>
    </div>
  );
}
