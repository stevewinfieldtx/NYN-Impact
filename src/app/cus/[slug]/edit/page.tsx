'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Undo2, Eye, Check, Loader2, PenTool, ArrowLeft, Globe, Mic } from 'lucide-react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  status?: 'pending' | 'done' | 'error';
  editResult?: {
    field: string;
    oldValue: string;
    newValue: string;
  };
}

interface EditHistoryItem {
  id: string;
  field_path: string;
  old_value: string;
  new_value: string;
  ai_prompt: string;
  edit_number: number;
  created_at: string;
}

export default function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('site');
  const [slug, setSlug] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your website editor. Just tell me what you'd like to change — a headline, phone number, image, pricing, testimonial — anything. I'll handle it instantly.",
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [editHistory, setEditHistory] = useState<EditHistoryItem[]>([]);
  const [editCount, setEditCount] = useState(0);
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [listening, setListening] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');

  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (siteId) {
      fetchSiteInfo();
      fetchEditHistory();
    }
  }, [siteId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  async function fetchSiteInfo() {
    try {
      const res = await fetch(`${API}/api/content?siteId=${siteId}`);
      if (res.ok) {
        const data = await res.json();
        setSiteName(data.version_label || 'Your Website');
        setSiteUrl(data.vercel_url || '');
      }
    } catch (err) {
      console.error('Failed to fetch site info:', err);
    }
  }

  async function fetchEditHistory() {
    try {
      const res = await fetch(`${API}/api/content/history?siteId=${siteId}`);
      if (res.ok) {
        const data = await res.json();
        setEditHistory(data.history || []);
        setEditCount(data.history?.length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch edit history:', err);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Add pending assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: 'Working on it...', status: 'pending' }]);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          siteId,
        }),
      });

      const data = await res.json();

      // Replace pending message with result
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: data.message || 'Done!',
          status: data.success ? 'done' : 'error',
          editResult: data.edit ? {
            field: data.edit.fieldPath,
            oldValue: String(data.edit.oldValue || ''),
            newValue: String(data.edit.newValue || ''),
          } : undefined,
        };
        return updated;
      });

      if (data.success) {
        setEditCount(prev => prev + 1);
        fetchEditHistory();
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Try again?',
          status: 'error',
        };
        return updated;
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishMessage('');
    try {
      const res = await fetch(`${API}/api/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishMessage(data.message);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `🚀 ${data.message}`,
          status: 'done',
        }]);
      } else {
        setPublishMessage('Publish failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setPublishMessage('Publish failed — check connection');
    } finally {
      setPublishing(false);
      setTimeout(() => setPublishMessage(''), 8000);
    }
  }

  function handleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported. Use Chrome.'); return; }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
    setListening(true);
  }

  async function handleUndo() {
    if (editHistory.length === 0) return;
    const lastEdit = editHistory[0];

    try {
      const res = await fetch(`${API}/api/content/undo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, editId: lastEdit.id }),
      });

      if (res.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `↩ Undone! Reverted "${lastEdit.field_path}" back to its previous value.`,
          status: 'done',
        }]);
        fetchEditHistory();
        setEditCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Undo failed:', err);
    }
  }

  return (
    <div className="h-screen bg-[#0a0a0f] text-[#f0ede6] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/cus/${slug}`} className="text-[#707080] hover:text-[#f0ede6] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-sm font-medium">{siteName}</span>
              <span className="text-xs text-[#505060] ml-3">{editCount} edits</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={editHistory.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#a0a0b0] hover:text-[#f0ede6] border border-white/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>

            {siteUrl && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#a0a0b0] hover:text-[#f0ede6] border border-white/10 rounded-lg transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </a>
            )}

            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
            {publishMessage && <span className="text-xs text-emerald-400 ml-2">{publishMessage}</span>}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md ${
                msg.role === 'user'
                  ? 'bg-purple-600/20 border border-purple-500/30 rounded-2xl rounded-br-md'
                  : 'bg-[#111118] border border-white/5 rounded-2xl rounded-bl-md'
              } px-4 py-3`}>
                {/* Status indicator */}
                {msg.status === 'pending' && (
                  <div className="flex items-center gap-2 mb-1">
                    <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                    <span className="text-xs text-purple-400">Processing...</span>
                  </div>
                )}
                {msg.status === 'done' && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-400">Applied</span>
                  </div>
                )}

                <p className="text-sm leading-relaxed">{msg.content}</p>

                {/* Show what changed */}
                {msg.editResult && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-[#505060] mb-1">Field: {msg.editResult.field}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-red-400/60 line-through">{msg.editResult.oldValue}</span>
                      <span className="text-[#505060]">→</span>
                      <span className="text-emerald-400">{msg.editResult.newValue}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick suggestions */}
      <div className="flex-shrink-0 border-t border-white/5">
        <div className="max-w-2xl mx-auto px-6 pt-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              'Change the headline',
              'Update phone number',
              'Add a testimonial',
              'Change pricing',
              'What can I edit?',
            ].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="flex-shrink-0 px-3 py-1.5 text-xs text-[#707080] border border-white/5 rounded-full hover:border-purple-500/30 hover:text-purple-300 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-white/5 bg-[#0a0a0f]">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleVoice}
              className={`px-3 py-3 rounded-xl border transition-all ${
                listening
                  ? 'bg-red-500/20 border-red-500/30 text-red-400 animate-pulse'
                  : 'bg-[#111118] border-white/10 text-[#505060] hover:text-purple-400 hover:border-purple-500/30'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
            <div className="flex-1 relative">
              <PenTool className="absolute left-3.5 top-3 w-4 h-4 text-[#505060]" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type what you want to change..."
                disabled={sending}
                className="w-full pl-10 pr-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-[#f0ede6] placeholder-[#505060] focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
