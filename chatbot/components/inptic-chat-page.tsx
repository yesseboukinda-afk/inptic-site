'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  Plus,
  Sparkles,
  ArrowLeft,
  Loader,
} from 'lucide-react';
import { speakFrenchText } from '@/lib/chatbot-speech';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
};

function renderMessage(text: string) {
  const cleanText = text.replace(/^#{1,3}\s+/gm, '');
  const parts = cleanText.split(/(\[[^\]]+\]\((?:\/[^\s)]+|https:\/\/[^\s)]+)\))/g);

  return parts.map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(((?:\/[^\s)]+|https:\/\/[^\s)]+))\)$/);
    if (!link) return <span key={`${part}-${index}`}>{part}</span>;

    const isExternal = link[2].startsWith('https://');
    return (
      <a
        key={`${link[2]}-${index}`}
        href={link[2]}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
      >
        {link[1]}
      </a>
    );
  });
}

export default function INPTICChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Bonjour et bienvenue sur l’Assistant IA de l’INPTIC, propulsé par Google Gemini. Comment puis-je vous aider aujourd’hui ?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState('');
  const [speechNotice, setSpeechNotice] = useState('');
  const [selectedModelBadge, setSelectedModelBadge] = useState('Google Gemini 2.5 Pro');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechCancelRef = useRef<(() => void) | null>(null);

  useEffect(() => () => speechCancelRef.current?.(), []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('La reconnaissance vocale n’est pas supportée par votre navigateur.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      setInput((prev) => (prev ? `${prev} ${e.results[0][0].transcript}` : e.results[0][0].transcript));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const speakText = (text: string, id: string) => {
    if (speakingId === id) {
      speechCancelRef.current?.();
      speechCancelRef.current = null;
      setSpeakingId(null);
      return;
    }
    speechCancelRef.current?.();
    setSpeechError('');
    setSpeechNotice('');
    setSpeakingId(id);
    speechCancelRef.current = speakFrenchText(text, () => {
      speechCancelRef.current = null;
      setSpeakingId(null);
    }, (error) => {
      speechCancelRef.current = null;
      setSpeakingId(null);
      setSpeechError(error);
    }, (notice) => {
      setSpeechNotice(notice);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: `${Date.now()}-user`, role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur de l’API Chat');

      const assistantMsg: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: json.reply,
        modelUsed: json.usedModel,
      };

      if (json.usedModel) setSelectedModelBadge(json.usedModel);

      setMessages((curr) => [...curr, assistantMsg]);
      speakText(json.reply, assistantMsg.id);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: err.message || 'Erreur de connexion avec l’assistant IA.',
      };
      setMessages((curr) => [...curr, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-full flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Navbar */}
      <header className="relative overflow-hidden flex h-20 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
        <img
          src="/banniere/5.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(7, 25, 60, 0.96) 0%, rgba(14, 43, 102, 0.90) 55%, rgba(20, 48, 107, 0.80) 100%)',
          }}
        />
        <div className="relative z-10 flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition">
              <ArrowLeft size={15} />
              <span>Accueil INPTIC</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-16 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5">
                <img src="/logoinptic.ico" alt="INPTIC" className="h-auto w-full object-contain" />
              </div>
              <span className="font-black text-sm tracking-wide text-white">Assistant IA Avancé</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <Sparkles size={13} className="text-[#D4AF37]" />
              <span>{selectedModelBadge}</span>
            </div>
            <button
              onClick={() => setMessages([{ id: 'welcome', role: 'assistant', content: 'Nouvelle conversation initialisée. Comment puis-je vous aider ?' }])}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
            >
              <Plus size={15} />
              <span>Nouveau chat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Feed */}
        <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto w-full max-w-3xl space-y-6 pb-24">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[90%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-lg ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-blue-600 text-white font-medium'
                      : 'rounded-bl-sm border border-slate-800 bg-slate-900 text-slate-100'
                  }`}
                >
                  <p className="whitespace-pre-line">{renderMessage(m.content)}</p>
                </div>

                {m.role === 'assistant' && (
                  <div className="mt-1.5 ml-2 flex items-center gap-3 text-[11px] text-slate-400">
                    <button
                      onClick={() => speakText(m.content, m.id)}
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition font-medium"
                    >
                      <Volume2 size={13} />
                      <span>{speakingId === m.id ? 'Arrêter la lecture' : 'Écouter'}</span>
                    </button>
                    {m.modelUsed && <span className="text-slate-500">• Modèle : {m.modelUsed}</span>}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 self-start rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-400 shadow-sm">
                <Loader size={16} className="animate-spin text-cyan-400" />
                <span>Gemini réfléchit, recherche ou calcule…</span>
              </div>
            )}
            {speechError && (
              <p role="alert" className="text-xs text-red-600">{speechError}</p>
            )}
            {speechNotice && (
              <p role="status" className="text-xs text-amber-300">{speechNotice}</p>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Bottom Input Form */}
      <footer className="absolute bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/90 p-4 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl focus-within:border-cyan-500">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit(e);
              }
            }}
            placeholder="Posez votre question à l'assistant IA (admissions, équivalences de diplômes, météo...)"
            rows={1}
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />

          <button
            type="button"
            onClick={toggleListening}
            className={`rounded-xl p-2.5 transition ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            title="Dicter votre question (vocal)"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-blue-600 p-2.5 text-white hover:bg-blue-700 disabled:opacity-40 transition shadow-lg"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="mt-2 text-center text-[11px] text-slate-500">
          Assistant INPTIC • Gemini 2.5 Pro avec recherche Web et calculs avancés.
        </p>
      </footer>
    </main>
  );
}
