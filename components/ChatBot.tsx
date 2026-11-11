'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, History, Loader, Menu, Plus, Send, X, Mic, MicOff, Volume2 } from 'lucide-react';
import { speakFrenchText } from '@/lib/chatbot-speech';
import { useTranslation } from 'react-i18next';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: ChatFile[];
};

type ChatFile = {
  id: string;
  title: string;
  format: string;
  url: string;
};

type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
};

const memoryStorageKey = 'sohane-memory';

function normalizeCommand(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .trim();
}

function getWebAction(text: string): { url: string; message: string } | null {
  const command = normalizeCommand(text);
  if (/\b(?:ouvre|ouvrir|lance|lancer) (?:google chrome|chrome)\b/.test(command)) {
    return {
      url: 'https://www.google.com/chrome/',
      message: 'Je ne peux pas lancer une application sur votre appareil, mais voici le site de Google Chrome.',
    };
  }
  if (/\b(?:ouvre|ouvrir|lance|lancer) (?:youtube|you tube)\b/.test(command)) {
    return { url: 'https://www.youtube.com/', message: 'J’ouvre YouTube dans un nouvel onglet.' };
  }
  if (/\b(?:ouvre|ouvrir|lance|lancer) google\b/.test(command)) {
    return { url: 'https://www.google.com/', message: 'J’ouvre Google dans un nouvel onglet.' };
  }
  if (/\b(?:ouvre|ouvrir|lance|lancer) (?:vscode|vs code|visual studio code)\b/.test(command)) {
    return { url: 'https://vscode.dev/', message: 'J’ouvre Visual Studio Code pour le Web dans un nouvel onglet.' };
  }

  const siteCommand = text.trim().match(/^(?:ouvre|ouvrir|lance|lancer)\s+(?:le site\s+)?(.+)$/i);
  if (!siteCommand) return null;

  const destination = siteCommand[1].trim().replace(/[.,!?]+$/, '');
  try {
    const url = new URL(destination.includes('://') ? destination : `https://${destination}`);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      !url.hostname.includes('.') ||
      url.username ||
      url.password ||
      url.hostname === 'localhost'
    ) {
      return null;
    }
    return { url: url.href, message: `J’ouvre ${url.hostname} dans un nouvel onglet.` };
  } catch {
    return null;
  }
}

function renderMessage(text: string) {
  const cleanText = text.replace(/^#{1,3}\s+/gm, '');
  const parts = cleanText.split(/(!\[[^\]]*\]\((?:\/(?!\/)[^\s)]+|https?:\/\/[^\s)]+)\)|\[[^\]]+\]\((?:\/(?!\/)[^\s)]+|https?:\/\/[^\s)]+)\)|https?:\/\/[^\s<]+)/g);

  return parts.map((part, index) => {
    const image = part.match(/^!\[([^\]]*)\]\(((?:\/(?!\/)[^\s)]+|https?:\/\/[^\s)]+))\)$/);
    if (image && image[2].startsWith('/api/chat/images?id=')) {
      const downloadUrl = `${image[2]}&download=1`;
      return (
        <figure key={`${image[2]}-${index}`} className="my-2 max-w-full">
          <a href={image[2]} target="_blank" rel="noopener noreferrer" aria-label={image[1] || 'Ouvrir l’image générée'}>
            <img src={image[2]} alt={image[1] || 'Image générée par Sohane'} className="max-h-72 max-w-full rounded-lg object-contain" />
          </a>
          <a href={downloadUrl} download className="mt-1 inline-block text-xs font-semibold text-blue-700 underline underline-offset-2">
            Télécharger l’image
          </a>
        </figure>
      );
    }

    const link = part.match(/^\[([^\]]+)\]\(((?:\/(?!\/)[^\s)]+|https?:\/\/[^\s)]+))\)$/);

    if (link) {
      if (link[2].startsWith('/api/chat/documents?') && /[?&]download=1(?:&|$)/.test(link[2])) {
        return (
          <a
            key={`${link[2]}-${index}`}
            href={link[2]}
            className="my-2 flex w-fit max-w-full items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-100"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg" aria-hidden="true">↓</span>
            <span className="min-w-0">
              <span className="block truncate">{link[1]}</span>
              <span className="mt-0.5 block text-xs font-normal text-blue-700">Fichier prêt à télécharger</span>
            </span>
          </a>
        );
      }

      return (
        <a
          key={`${link[2]}-${index}`}
          href={link[2]}
          {...(link[2].startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
        >
          {link[1]}
        </a>
      );
    }

    if (/^https?:\/\//i.test(part)) {
      const url = part.replace(/[.,!?;:]+$/, '');
      const punctuation = part.slice(url.length);
      return (
        <span key={`${part}-${index}`}>
          <a href={url} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900">{url}</a>
          {punctuation}
        </span>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export default function ChatBot({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const { t } = useTranslation();
  const suggestions = t('chat.suggestions', { returnObjects: true }) as string[];
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [isMounted, setIsMounted] = useState(initiallyOpen);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState('');
  const [memories, setMemories] = useState<string[]>([]);
  const [memoryNotice, setMemoryNotice] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: t('chat.welcome'),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speechCancelRef = useRef<(() => void) | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  useEffect(() => () => speechCancelRef.current?.(), []);
  useEffect(() => () => {
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    try {
      const savedMemory = window.localStorage.getItem(memoryStorageKey);
      if (!savedMemory) return;
      const parsed: unknown = JSON.parse(savedMemory);
      if (!Array.isArray(parsed)) {
        throw new Error('Format de mémoire invalide.');
      }
      setMemories(parsed
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim().slice(0, 200))
        .filter(Boolean)
        .slice(0, 20));
    } catch (error) {
      console.error('[Sohane] Impossible de charger la mémoire locale:', error);
      setMemoryNotice('La mémoire locale de Sohane n’a pas pu être lue sur cet appareil.');
    }
  }, []);

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

  const toggleListening = async () => {
    if (isListening) {
      mediaRecorderRef.current?.stop();
      setIsListening(false);
      return;
    }

    setSpeechError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        throw new Error('Cet appareil ou navigateur ne permet pas l’enregistrement audio.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) audioChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setSpeechError('L’enregistrement audio a échoué. Vérifiez le microphone et réessayez.');
        setIsListening(false);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.onstop = () => {
        setIsListening(false);
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        const audio = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        audioChunksRef.current = [];
        if (audio.size) void transcribeAudio(audio);
      };
      recorder.start();
      setIsListening(true);
    } catch (error) {
      setIsListening(false);
      setSpeechError(error instanceof Error && error.name === 'NotAllowedError'
        ? 'Autorisez l’accès au microphone dans les paramètres du navigateur, puis réessayez.'
        : error instanceof Error ? error.message : 'Impossible de démarrer le microphone.');
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const transcribeAudio = async (audio: Blob) => {
    setIsTranscribing(true);
    setSpeechError('');
    try {
      const form = new FormData();
      const extension = audio.type.includes('mp4')
        ? 'm4a'
        : audio.type.includes('ogg')
          ? 'ogg'
          : audio.type.includes('wav')
            ? 'wav'
            : 'webm';
      form.set('audio', audio, `question.${extension}`);
      const response = await fetch('/api/chat/transcribe', { method: 'POST', body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible de transcrire votre question.');
      if (typeof data.text !== 'string' || !data.text.trim()) {
        throw new Error('Aucune parole n’a été reconnue. Rapprochez-vous du microphone et réessayez.');
      }
      void sendMessage(data.text, true);
    } catch (error) {
      setSpeechError(error instanceof Error ? error.message : 'Impossible de transcrire votre question.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const speakText = (text: string, messageId: string) => {
    if (speakingMessageId === messageId) {
      speechCancelRef.current?.();
      speechCancelRef.current = null;
      setSpeakingMessageId(null);
      return;
    }

    speechCancelRef.current?.();
    setSpeechError('');
    setSpeakingMessageId(messageId);
    const spokenText = text
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    speechCancelRef.current = speakFrenchText(spokenText, () => {
      speechCancelRef.current = null;
      setSpeakingMessageId(null);
    }, (error) => {
      speechCancelRef.current = null;
      setSpeakingMessageId(null);
      setSpeechError(error);
    });
  };

  const sendMessage = async (messageText = inputValue, shouldSpeakResponse = false) => {
    const content = messageText.trim();
    if (!content || isLoading) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content,
    };

    const normalizedContent = normalizeCommand(content);
    const rememberMatch = content.match(/^(?:souviens[- ]toi(?:\s+(?:que|de))?|m[ée]morise(?:\s+que)?|retiens(?:\s+que)?)\s+(.+)$/i);
    const assistantMessageId = `${Date.now()}-assistant`;
    let localReply = '';

    const saveMemories = (nextMemories: string[]) => {
      try {
        window.localStorage.setItem(memoryStorageKey, JSON.stringify(nextMemories));
        setMemories(nextMemories);
        setMemoryNotice('Cette mémoire est enregistrée uniquement dans ce navigateur.');
        return true;
      } catch (error) {
        console.error('[Sohane] Impossible d’enregistrer la mémoire locale:', error);
        setMemoryNotice('La mémoire n’a pas pu être enregistrée dans ce navigateur.');
        return false;
      }
    };

    if (rememberMatch) {
      const memory = rememberMatch[1].trim().slice(0, 200);
      if (!memory) {
        localReply = 'Dis-moi précisément ce que tu veux que je retienne.';
      } else if (memories.some((item) => normalizeCommand(item) === normalizeCommand(memory))) {
        localReply = 'Je m’en souviens déjà.';
      } else if (memories.length >= 20) {
        localReply = 'Ma mémoire locale est pleine. Demande-moi d’oublier un souvenir avant d’en ajouter un autre.';
      } else {
        localReply = saveMemories([...memories, memory])
          ? 'D’accord, je vais m’en souvenir sur cet appareil.'
          : 'Je n’ai pas pu enregistrer ce souvenir dans ce navigateur.';
      }
    } else if (
      normalizedContent.includes("qu'est-ce que tu te rappelles") ||
      normalizedContent.includes('que te rappelles-tu') ||
      normalizedContent.includes('montre ma memoire') ||
      normalizedContent.includes('montre tes souvenirs')
    ) {
      localReply = memories.length
        ? `Voici ce que je retiens sur cet appareil :\n${memories.map((item, index) => `${index + 1}. ${item}`).join('\n')}`
        : 'Je n’ai encore aucun souvenir enregistré sur cet appareil.';
    } else if (
      /^(?:oublie tout|efface ma memoire|supprime ma memoire|forget everything)$/.test(normalizedContent)
    ) {
      localReply = saveMemories([])
        ? 'C’est fait, j’ai effacé ma mémoire locale.'
        : 'Je n’ai pas pu effacer la mémoire locale de ce navigateur.';
    } else if (/^(?:oublie|efface|supprime)(?: le souvenir)?\s+/.test(normalizedContent)) {
      const target = normalizedContent.replace(/^(?:oublie|efface|supprime)(?: le souvenir)?\s+/, '');
      const nextMemories = memories.filter((item) => !normalizeCommand(item).includes(target));
      localReply = nextMemories.length === memories.length
        ? 'Je n’ai pas trouvé ce souvenir dans ma mémoire locale.'
        : saveMemories(nextMemories)
          ? 'C’est fait, j’ai oublié ce souvenir.'
          : 'Je n’ai pas pu modifier la mémoire locale de ce navigateur.';
    }

    const webAction = localReply ? null : getWebAction(content);
    if (webAction) {
      window.open(webAction.url, '_blank', 'noopener,noreferrer');
      localReply = `[${webAction.message}](${webAction.url})`;
    }

    if (localReply) {
      const assistantMessage = {
        id: assistantMessageId,
        role: 'assistant' as const,
        content: localReply,
      };
      setMessages((current) => [...current, userMessage, assistantMessage]);
      setInputValue('');
      if (shouldSpeakResponse) {
        speakText(localReply.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'), assistantMessageId);
      }
      return;
    }

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
          memory: memories,
          messages: nextMessages.map(({ role, content: messageContent }) => ({ role, content: messageContent })),
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || 'Erreur de conversation');

      setChatId(data.chatId);
      window.localStorage.setItem('inptic-chat-id', data.chatId);

      const assistantReply = data.reply;
      setMessages((current) => [...current, {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: assistantReply,
        files: Array.isArray(data.documents)
          ? data.documents.filter((file: unknown): file is ChatFile =>
              file !== null &&
              typeof file === 'object' &&
              'id' in file && typeof file.id === 'string' &&
              'title' in file && typeof file.title === 'string' &&
              'format' in file && typeof file.format === 'string' &&
              'url' in file && typeof file.url === 'string',
            )
          : [],
      }]);

      if (shouldSpeakResponse) {
        speakText(assistantReply, `${Date.now()}-assistant`);
      }
    } catch (err: any) {
      setMessages((current) => [...current, {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: err?.message || 'Sohane est momentanément indisponible. Vérifiez la configuration du fournisseur IA du site.',
      }]);
      if (shouldSpeakResponse) {
        speakText(err?.message || 'Sohane est momentanément indisponible.', `${Date.now()}-error`);
      }
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
      content: t('chat.welcome'),
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
        aria-label={isOpen ? t('chat.close') : t('chat.open')}
        aria-expanded={isOpen}
        aria-controls="chat-window"
        title={isOpen ? t('chat.close') : t('chat.open')}
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
                  <img src="/logoinptic.ico" alt="INPTIC" className="h-auto w-full object-contain" />
                </div>
                <div>
                  <h2 id="chat-header" className="font-bold">Sohane</h2>
                  <p className="text-xs text-blue-100">{t('chat.assistant')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowHistory((visible) => !visible)} className="rounded-lg p-2 text-blue-100 hover:bg-white/10 hover:text-white" aria-label={showHistory ? t('chat.hideSidebar') : t('chat.showSidebar')} title={showHistory ? t('chat.hideSidebar') : t('chat.showSidebar')}>
                  {showHistory ? <Menu size={19} aria-hidden="true" /> : <History size={19} aria-hidden="true" />}
                </button>
                <button onClick={startNewConversation} className="rounded-lg p-2 text-blue-100 hover:bg-white/10 hover:text-white" aria-label={t('chat.newConversation')} title={t('chat.newConversation')}>
                  <Plus size={20} aria-hidden="true" />
                </button>
                <button onClick={closeChat} className="rounded-lg p-2 text-blue-100 hover:bg-white/10 hover:text-white" aria-label={t('chat.close')} title={t('chat.close')}>
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
            </header>

            {showHistory && (
              <aside className="absolute inset-y-0 left-0 z-20 w-[280px] overflow-y-auto border-r border-slate-200 bg-[#f7f7f8] p-3 shadow-xl" aria-label={t('chat.conversations')}>
                <div className="pt-14">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="px-2 text-xs font-bold uppercase tracking-wide text-slate-500">Vos conversations</h3>
                    <button onClick={startNewConversation} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900" aria-label={t('chat.newConversation')} title={t('chat.newConversation')}><Plus size={16} aria-hidden="true" /></button>
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
                      <img src="/logoinptic.ico" alt="INPTIC" className="h-auto w-full object-contain" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Comment puis-je vous aider ?</h3>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">Formations, admissions, vie étudiante et informations sur l’INPTIC. Posez votre question naturellement.</p>
                  </div>
                )}
                {messages.map((message) => (
                  <div key={message.id} className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[88%] px-4 py-3 text-[15px] leading-7 ${message.role === 'user' ? 'rounded-2xl rounded-br-sm bg-slate-800 text-white shadow-sm' : 'text-slate-800'}`}>
                      <div className="whitespace-pre-line">{renderMessage(message.content)}</div>
                      {message.files?.filter((file) => !message.content.includes(file.url)).map((file) => (
                        <a
                          key={file.id}
                          href={file.url}
                          className="my-2 flex w-fit max-w-full items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-100"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg" aria-hidden="true">↓</span>
                          <span className="min-w-0">
                            <span className="block truncate">Télécharger {file.title}</span>
                            <span className="mt-0.5 block text-xs font-normal text-blue-700">{file.format.toUpperCase()} · fichier prêt</span>
                          </span>
                        </a>
                      ))}
                    </div>
                    {message.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => speakText(message.content, message.id)}
                        className="mt-1 ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition"
                        title="Écouter la réponse"
                      >
                        <Volume2 size={13} />
                        <span>{speakingMessageId === message.id ? 'Arrêter la lecture' : 'Écouter'}</span>
                      </button>
                    )}
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
                    Sohane prépare une réponse…
                  </div>
                )}
                {speechError && (
                  <p role="alert" className="text-xs text-red-700">{speechError}</p>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form className="border-t border-slate-200 bg-white p-4" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}>
              <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-100">
                <textarea ref={inputRef} value={inputValue} onChange={(event) => setInputValue(event.target.value)} onKeyDown={handleKeyDown} placeholder={t('chat.placeholder')} aria-label={t('chat.message')} rows={1} disabled={isLoading || isTranscribing} className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed" />

                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isTranscribing || isLoading}
                  className={`rounded-lg p-2.5 transition-colors ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} disabled:cursor-wait disabled:opacity-60`}
                  aria-label={isListening ? 'Terminer l’enregistrement vocal' : 'Parler au micro'}
                  title={isTranscribing ? 'Transcription en cours…' : isListening ? 'Cliquer pour envoyer votre question' : 'Dicter votre question'}
                >
                  {isTranscribing ? <Loader size={18} className="animate-spin" /> : isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <button type="submit" disabled={isLoading || !inputValue.trim()} className="rounded-lg bg-blue-600 p-2.5 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300" aria-label={t('chat.send')} title={t('chat.send')}>
                  <Send size={18} aria-hidden="true" />
                </button>
              </div>
              <p className="mx-auto mt-2 max-w-xl text-center text-[11px] text-slate-400">Les informations officielles Admissions et Contact font foi.</p>
              {memoryNotice && <p role="status" className="mx-auto mt-1 max-w-xl text-center text-[11px] text-slate-500">{memoryNotice}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
