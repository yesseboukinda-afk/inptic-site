'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import inpticLogo from '@/logoinptic.png';
import { Bot, History, Loader, Menu, Plus, Send, X } from 'lucide-react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
};

const suggestions = [
  'Quelles formations propose l’INPTIC ?',
  'Comment déposer un dossier ?',
  'Quels sont les débouchés en cybersécurité ?',
];

function renderMessage(text: string) {
  const cleanText = text.replace(/^#{1,3}\s+/gm, '');
  const parts = cleanText.split(/(\[[^\]]+\]\(\/[^\s)]+\))/g);

  return parts.map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\((\/[^\s)]+)\)$/);

    if (!link) return <span key={`${part}-${index}`}>{part}</span>;

    return (
      <a
        key={`${link[2]}-${index}`}
        href={link[2]}
        className="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
      >
        {link[1]}
      </a>
    );
  });
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Bonjour ! Je suis l’assistant IA de l’INPTIC. Que souhaitez-vous savoir sur nos formations, les admissions ou la vie étudiante ?',
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const openChat = () => {
    setIsMounted(true);
    requestAnimationFrame(() => setIsOpen(true));
  };

  const closeChat = () => {
    setIsOpen(false);
    window.setTimeout(() => setIsMounted(false), 600);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeChat();
    };

    window.addEventListener('open-inptic-chat', openChat);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('open-inptic-chat', openChat);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    fetch('/api/chat/history')
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setConversations(Array.isArray(data) ? data : []))
      .catch(() => undefined);

  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const storedChatId = window.localStorage.getItem('inptic-chat-id');
    if (!storedChatId) return;

    fetch(`/api/chat/history?id=${encodeURIComponent(storedChatId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data?.messages?.length) return;
        setChatId(storedChatId);
        setMessages(data.messages.map((message: ChatMessage) => ({
          id: message.id,
          role: message.role,
          content: message.content,
        })));
      })
      .catch(() => undefined);
  }, []);

  const sendMessage = async (messageText = inputValue) => {
    const content = messageText.trim();
    if (!content || isLoading) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          messages: nextMessages.map(({ role, content: messageContent }) => ({ role, content: messageContent })),
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || 'Erreur de conversation');

      setChatId(data.chatId);
      window.localStorage.setItem('inptic-chat-id', data.chatId);

      setMessages((current) => [...current, {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data.reply,
      }]);
    } catch {
      setMessages((current) => [...current, {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: 'Je rencontre un problème momentanément. Consultez [Contact](/contact) ou réessayez dans quelques instants.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const openConversation = async (conversationId: string) => {
    const response = await fetch(`/api/chat/history?id=${encodeURIComponent(conversationId)}`);
    if (!response.ok) return;
    const data = await response.json();
    setChatId(conversationId);
    window.localStorage.setItem('inptic-chat-id', conversationId);
    setMessages(data.messages || []);
    setShowHistory(false);
  };

  const startNewConversation = () => {
    setChatId(null);
    window.localStorage.removeItem('inptic-chat-id');
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Bonjour ! Je suis l’assistant IA de l’INPTIC. Que souhaitez-vous savoir sur nos formations, les admissions ou la vie étudiante ?',
    }]);
    setShowHistory(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <>
      <button
        onClick={isOpen ? closeChat : openChat}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full p-3 sm:p-4 shadow-lg z-50 transition-all duration-200 transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
        aria-expanded={isOpen}
        aria-controls="chat-window"
        title={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {isOpen ? <X size={22} aria-hidden="true" /> : <Bot size={22} aria-hidden="true" />}
      </button>

      {isMounted && (
        <div
          className="fixed right-4 bottom-20 z-40 w-[min(420px,calc(100vw-2rem))]"
          onClick={closeChat}
          role="presentation"
        >
          <div
            id="chat-window"
            className={`relative flex h-[min(470px,calc(100vh-96px))] w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl ${isOpen ? 'chatbot-panel-enter' : 'chatbot-panel-exit'}`}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-labelledby="chat-header"
            aria-modal="true"
          >
            <header className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-20 items-center justify-center overflow-hidden rounded-lg bg-white px-1">
                  <Image src={inpticLogo} alt="INPTIC" width={86} height={48} className="h-auto w-full object-contain" priority />
                </div>
                <div>
                  <h2 id="chat-header" className="font-bold">INPTIC Assistant</h2>
                  <p className="text-xs text-blue-100">Assistant IA de l’INPTIC</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowHistory((visible) => !visible)} className="rounded-lg p-2 text-blue-100 hover:bg-white/10 hover:text-white" aria-label={showHistory ? 'Masquer la barre latérale' : 'Afficher la barre latérale'} title={showHistory ? 'Masquer la barre latérale' : 'Afficher la barre latérale'}>
                  {showHistory ? <Menu size={19} aria-hidden="true" /> : <History size={19} aria-hidden="true" />}
                </button>
                <button onClick={startNewConversation} className="rounded-lg p-2 text-blue-100 hover:bg-white/10 hover:text-white" aria-label="Démarrer une nouvelle conversation" title="Nouvelle conversation">
                  <Plus size={20} aria-hidden="true" />
                </button>
                <button onClick={closeChat} className="rounded-lg p-2 text-blue-100 hover:bg-white/10 hover:text-white" aria-label="Fermer le chat" title="Fermer le chat">
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
            </header>

            {showHistory && (
              <aside className="absolute inset-y-0 left-0 z-20 w-[280px] overflow-y-auto border-r border-slate-200 bg-[#f7f7f8] p-3 shadow-xl" aria-label="Anciennes conversations">
                <div className="pt-14">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="px-2 text-xs font-bold uppercase tracking-wide text-slate-500">Vos conversations</h3>
                    <button onClick={startNewConversation} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900" aria-label="Nouvelle conversation" title="Nouvelle conversation"><Plus size={16} aria-hidden="true" /></button>
                  </div>
                  {conversations.length === 0 ? (
                    <p className="text-sm text-slate-500">Aucune conversation enregistrée.</p>
                  ) : (
                    <div className="space-y-1">
                      {conversations.map((conversation) => (
                        <button
                          key={conversation.id}
                          onClick={() => void openConversation(conversation.id)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-200 ${chatId === conversation.id ? 'bg-slate-200 font-semibold text-slate-900' : 'text-slate-700'}`}
                        >
                          <span className="truncate pr-3">{conversation.title}</span>
                          <time className="shrink-0 text-[11px] text-slate-400" dateTime={conversation.updatedAt}>{new Date(conversation.updatedAt).toLocaleDateString('fr-FR')}</time>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            )}

            <div className="flex flex-1 flex-col overflow-y-auto bg-white p-4 sm:p-10" role="log" aria-live="polite">
              <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6">
                {messages.length === 1 && (
                  <div className="mx-auto mt-12 w-full max-w-2xl text-center sm:mt-20">
                    <div className="mx-auto mb-5 flex h-16 w-28 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-lg ring-1 ring-slate-200">
                      <Image src={inpticLogo} alt="INPTIC" width={112} height={64} className="h-auto w-full object-contain" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Comment puis-je vous aider ?</h3>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">Formations, admissions, vie étudiante et informations sur l’INPTIC. Posez votre question naturellement.</p>
                  </div>
                )}
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[88%] px-4 py-3 text-[15px] leading-7 ${message.role === 'user' ? 'rounded-2xl rounded-br-sm bg-slate-800 text-white shadow-sm' : 'text-slate-800'}`}>
                      <p className="whitespace-pre-line">{renderMessage(message.content)}</p>
                    </div>
                  </div>
                ))}

                {messages.length === 1 && (
                  <div className="mx-auto mt-8 grid w-full max-w-2xl gap-2 pt-4 sm:grid-cols-3">
                    {suggestions.map((suggestion) => (
                      <button key={suggestion} onClick={() => void sendMessage(suggestion)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-xs leading-5 text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-900 hover:shadow-md">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {isLoading && (
                  <div className="flex items-center gap-2 self-start rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                    <Loader size={16} className="animate-spin text-blue-600" aria-hidden="true" />
                    L’assistant réfléchit…
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form className="border-t border-slate-200 bg-white p-4" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}>
              <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-100">
                <textarea ref={inputRef} value={inputValue} onChange={(event) => setInputValue(event.target.value)} onKeyDown={handleKeyDown} placeholder="Posez votre question à l’INPTIC…" aria-label="Message à envoyer" rows={1} disabled={isLoading} className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed" />
                <button type="submit" disabled={isLoading || !inputValue.trim()} className="rounded-lg bg-blue-600 p-2.5 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300" aria-label="Envoyer le message" title="Envoyer le message">
                  <Send size={18} aria-hidden="true" />
                </button>
              </div>
              <p className="mx-auto mt-2 max-w-xl text-center text-[11px] text-slate-400">Les informations officielles Admissions et Contact font foi.</p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
