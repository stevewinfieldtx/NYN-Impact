'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Undo2, Check, Loader2, PenTool, ArrowLeft, Globe, Mic, PanelLeftClose, PanelLeftOpen, RefreshCw } from 'lucide-react';
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

// Map field paths to likely HTML section IDs so we can scroll the preview
function fieldToSection(fieldPath: string): string | null {
  const path = fieldPath.toLowerCase();
  if (path.startsWith('hero')) return 'hero';
  if (path.startsWith('stats')) return 'stats';
  if (path.startsWith('menu') || path.startsWith('services')) return 'services';
  if (path.startsWith('story')) return 'story';
  if (path.startsWith('differentiator') || path.startsWith('why')) return 'why-us';
  if (path.startsWith('hours') || path.startsWith('contact')) return 'contact';
  if (path.startsWith('footer')) return 'footer';
  if (path.startsWith('membership') || path.startsWith('pricing')) return 'pricing';
  if (path.startsWith('testimonial')) return 'testimonials';
  if (path.startsWith('meta.title') || path.startsWith('meta.tagline')) return 'hero';
  if (path.startsWith('meta.phone') || path.startsWith('meta.contact')) return 'contact';
  return null;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('site');
  const [slug, setSlug] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your website editor. Tell me what you'd like to change and watch it update live in the preview.",
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [listening, setListening] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(true);

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

  const previewUrl = siteId ? `${API}/api/render/${siteId}` : '';

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

  const refreshPreview = useCallback((scrollToSection?: string | null) => {
    setPreviewKey(k => k + 1);
    setPreviewLoading(true);

    // After iframe loads, scroll to the relevant section
    if (scrollToSection) {
      setTimeout(() => {
        try {
          const iframe = iframeRef.current;
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'scrollTo', section: scrollToSection }, '*');
            // Fallback: try direct DOM access (same-origin only)
            const el = iframe.contentDocument?.getElementById(scrollToSection);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Flash highlight
              el.style.outline = '3px solid #7C3AED';
              el.style.outlineOffset = '4px';
              el.style.transition = 'outline 0.3s ease';
              setTimeout(() => {
                el.style.outline = 'none';
              }, 2000);
            }
          }
        } catch {
          // Cross-origin, can't access iframe DOM — that's ok
        }
      }, 1500);
    }
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setMessages(prev => [...prev, { role: 'assistant', content: 'Working on it...', status: 'pending' }]);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, siteId }),
      });

      const data = await res.json();

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

      if (data.success && data.edit) {
        setEditCount(prev => prev + 1);
        fetchEditHistory();
        // Refresh preview and scroll to the changed section
        const section = fieldToSection(data.edit.fieldPath);
        refreshPreview(section);
      }
    } catch {
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
        setMessages(prev => [...prev, { role: 'assistant', content: `Published! Your changes are going live now.`, status: 'done' }]);
      } else {
        setPublishMessage('Publish failed: ' + (data.error || 'Unknown error'));
      }
    } catch {
      setPublishMessage('Publish failed');
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
    recognition.onresult = (e: any) => setInput(e.results[0][0].transcript);
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
        setMessages(prev => [...prev, { role: 'assistant', content: `Undone! Reverted "${lastEdit.field_path}".`, status: 'done' }]);
        fetchEditHistory();
        setEditCount(prev => Math.max(0, prev - 1));
        const section = fieldToSection(lastEdit.field_path);
        refreshPreview(section);
      }
    } catch (err) { console.error('Undo failed:', err); }
  }

  return (
    <div className="h-screen bg-[#0a0a0f] text-[#f0ede6] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl z-10">
        <div className="px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/cus/${slug}`} className="text-[#707080] hover:text-[#f0ede6] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <button onClick={() => setChatCollapsed(!chatCollapsed)} className="text-[#707080] hover:text-[#f0ede6] transition-colors">
              {chatCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
            <span className="text-sm font-medium">{siteName}</span>
            <span className="text-xs text-[#505060]">{editCount} edits</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => refreshPreview(null)} className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#a0a0b0] hover:text-[#f0ede6] border border-white/10 rounded-lg transition-all">
              <RefreshCw className="w-3 h-3" />
            </button>
            <button onClick={handleUndo} disabled={editHistory.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#a0a0b0] hover:text-[#f0ede6] border border-white/10 rounded-lg transition-all disabled:opacity-30">
              <Undo2 className="w-3 h-3" /> Undo
            </button>
            {siteUrl && (
              <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#a0a0b0] hover:text-[#f0ede6] border border-white/10 rounded-lg transition-all">
                Live Site
              </a>
            )}
            <button onClick={handlePublish} disabled={publishing}
              className="flex items-center gap-1.5 px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-all disabled:opacity-50">
              {publishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
            {publishMessage && <span className="text-xs text-emerald-400">{publishMessage}</span>}
          </div>
        </div>
      </div>

      {/* Split layout: Chat + Preview */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Chat Panel */}
        <div className={`flex flex-col border-r border-white/5 transition-all duration-300 ${chatCollapsed ? 'w-0 overflow-hidden' : 'w-[420px] min-w-[360px]'}`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-6 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] ${
                    msg.role === 'user'
                      ? 'bg-purple-600/20 border border-purple-500/30 rounded-2xl rounded-br-sm'
                      : 'bg-[#111118] border border-white/5 rounded-2xl rounded-bl-sm'
                  } px-3 py-2.5`}>
                    {msg.status === 'pending' && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                        <span className="text-[10px] text-purple-400">Processing...</span>
                      </div>
                    )}
                    {msg.status === 'done' && (
                      <div className="flex items-center gap-1 mb-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Applied</span>
                      </div>
                    )}
                    <p className="text-[13px] leading-relaxed">{msg.content}</p>
                    {msg.editResult && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <p className="text-[10px] text-[#505060] mb-0.5">{msg.editResult.field}</p>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-red-400/60 line-through">{msg.editResult.oldValue?.substring(0, 50)}</span>
                          <span className="text-[#505060]">&rarr;</span>
                          <span className="text-emerald-400">{msg.editResult.newValue?.substring(0, 50)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Suggestions */}
          <div className="flex-shrink-0 px-4 pt-2 border-t border-white/5">
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {['Change headline', 'Update phone', 'Edit pricing', 'Update hours', 'What can I edit?'].map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="flex-shrink-0 px-2.5 py-1 text-[11px] text-[#707080] border border-white/5 rounded-full hover:border-purple-500/30 hover:text-purple-300 transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-4 pb-4 pt-2">
            <form onSubmit={handleSend} className="flex gap-2">
              <button type="button" onClick={handleVoice}
                className={`px-2.5 py-2.5 rounded-lg border transition-all ${listening ? 'bg-red-500/20 border-red-500/30 text-red-400 animate-pulse' : 'bg-[#111118] border-white/10 text-[#505060] hover:text-purple-400'}`}>
                <Mic className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1 relative">
                <PenTool className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#505060]" />
                <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                  placeholder="Type what to change..." disabled={sending}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#111118] border border-white/10 rounded-lg text-sm text-[#f0ede6] placeholder-[#505060] focus:outline-none focus:border-purple-500/50 transition-all disabled:opacity-50" />
              </div>
              <button type="submit" disabled={sending || !input.trim()}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-lg transition-all disabled:opacity-30 flex items-center">
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="flex-1 relative bg-white">
          {previewLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f] z-10">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-[#707080]">Loading preview...</p>
              </div>
            </div>
          )}
          {previewUrl ? (
            <iframe
              ref={iframeRef}
              key={previewKey}
              src={previewUrl}
              className="w-full h-full border-0"
              onLoad={() => setPreviewLoading(false)}
              title="Site Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-[#0a0a0f]">
              <div className="text-center">
                <Globe className="w-12 h-12 text-[#505060] mx-auto mb-4" />
                <p className="text-[#a0a0b0]">No preview available yet</p>
                <p className="text-[#505060] text-sm mt-1">Generate a template first to see your site here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

