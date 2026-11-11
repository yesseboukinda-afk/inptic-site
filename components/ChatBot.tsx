'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Download, FileText, History, Loader, Menu, Plus, Presentation, Send, Table, X, Mic, MicOff, Volume2 } from 'lucide-react';
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

function getDocumentIcon(format: string) {
  if (format === 'xlsx' || format === 'csv') return Table;
  if (format === 'pptx') return Presentation;
  return FileText;
}

function DocumentDownloadCard({ title, format, url }: Omit<ChatFile, 'id'>) {
  const normalizedFormat = format.toLowerCase();
  const DocumentIcon = getDocumentIcon(normalizedFormat);
  const formatColor = normalizedFormat === 'pdf'
    ? 'bg-rose-50 text-rose-700'
    : normalizedFormat === 'xlsx' || normalizedFormat === 'csv'
      ? 'bg-emerald-50 text-emerald-700'
      : normalizedFormat === 'pptx'
        ? 'bg-orange-50 text-orange-700'
        : 'bg-blue-50 text-blue-700';

  return (
    <a
      href={url}
      className="my-2 flex w-fit max-w-full items-center gap-3 !rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      aria-label={`Télécharger ${title} au format ${normalizedFormat.toUpperCase()}`}
    >
      <span className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center !rounded-xl ${formatColor}`} aria-hidden="true">
        <DocumentIcon size={21} strokeWidth={1.8} />
        <span className="mt-0.5 text-[8px] font-bold uppercase leading-none">{normalizedFormat}</span>
      </span>
      <span className="min-w-0">
        <span className="block truncate">{title.replace(/\s*\(\.(?:pdf|docx|xlsx|pptx|csv|txt)\)$/i, '')}</span>
        <span className="mt-0.5 block text-xs font-normal text-slate-500">Document {normalizedFormat.toUpperCase()} · Télécharger</span>
      </span>
      <Download className="ml-1 shrink-0 text-blue-600" size={18} aria-hidden="true" />
    </a>
  );
}

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
        const format = link[2].match(/[?&]format=(pdf|docx|xlsx|pptx|csv|txt)(?:&|$)/i)?.[1]?.toLowerCase() || 'file';
        return <DocumentDownloadCard key={`${link[2]}-${index}`} title={link[1]} format={format} url={link[2]} />;
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
  const [isSmallScreen, setIsSmallScreen] = useState(false);
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

  useEffect(() => {
    const updateViewport = () => setIsSmallScreen(window.innerWidth <= 639);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

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
          className="sohane-chat-backdrop"
          style={isSmallScreen
            ? {
                position: 'fixed',
                inset: 0,
                zIndex: 60,
                width: '100%',
                height: '100dvh',
                backgroundColor: 'rgb(2 6 23 / 35%)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }
            : {
                position: 'fixed',
                right: '1rem',
                bottom: '6rem',
                zIndex: 60,
                width: 'min(440px, calc(100vw - 2rem))',
              }}
          onClick={closeChat}
          role="presentation"
        >
          <div
            id="chat-window"
            className={`sohane-chat-panel relative flex h-full w-full flex-col overflow-hidden border border-white/60 bg-slate-50 shadow-2xl ${isOpen ? 'chatbot-panel-enter' : 'chatbot-panel-exit'}`}
            style={{
              height: isSmallScreen ? 'min(72dvh, 600px)' : 'min(640px, calc(100dvh - 120px))',
              width: isSmallScreen ? 'calc(100% - 1rem)' : '100%',
              maxWidth: isSmallScreen ? 440 : undefined,
              borderRadius: isSmallScreen ? '20px 20px 0 0' : 22,
            }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-labelledby="chat-header"
            aria-modal="true"
          >
            <header className="flex shrink-0 items-center justify-between bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 px-3 py-2.5 text-white sm:px-4 sm:py-3.5">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center !rounded-2xl border border-white/20 bg-white/10 shadow-inner">
                  <Bot size={23} aria-hidden="true" />
                  <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 !rounded-full border-2 border-blue-950 bg-emerald-400" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="chat-header" className="font-semibold tracking-wide">Sohane</h2>
                  <p className="mt-0.5 text-xs text-blue-100">{t('chat.assistant')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowHistory((visible) => !visible)} className="!rounded-xl p-2 text-blue-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70" aria-label={showHistory ? t('chat.hideSidebar') : t('chat.showSidebar')} title={showHistory ? t('chat.hideSidebar') : t('chat.showSidebar')}>
                  {showHistory ? <Menu size={19} aria-hidden="true" /> : <History size={19} aria-hidden="true" />}
                </button>
                <button onClick={startNewConversation} className="!rounded-xl p-2 text-blue-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70" aria-label={t('chat.newConversation')} title={t('chat.newConversation')}>
                  <Plus size={20} aria-hidden="true" />
                </button>
                <button onClick={closeChat} className="flex h-11 w-11 items-center justify-center !rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70" aria-label={t('chat.close')} title={t('chat.close')}>
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

            <div className="flex flex-1 flex-col overflow-y-auto bg-slate-50 px-4 py-5 sm:px-5" role="log" aria-live="polite">
              <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5">
                {messages.length === 1 && (
                  <div className="mx-auto mt-8 w-full max-w-2xl text-center sm:mt-12">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center !rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-900/20">
                      <Bot size={28} aria-hidden="true" />
                    </div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Sohane · INPTIC</p>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Comment puis-je vous aider ?</h3>
                    <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Formations, admissions, vie étudiante… Posez votre question, je vous réponds ici.</p>
                  </div>
                )}
                {messages.map((message) => (
                  <div key={message.id} className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'assistant' && (
                      <span className="mb-5 flex h-8 w-8 shrink-0 items-center justify-center !rounded-xl bg-blue-100 text-blue-700" aria-hidden="true">
                        <Bot size={17} />
                      </span>
                    )}
                    <div className={`max-w-[88%] px-4 py-3 text-[14px] leading-6 shadow-sm sm:text-[15px] ${message.role === 'user' ? '!rounded-2xl !rounded-br-md bg-gradient-to-br from-blue-600 to-blue-700 text-white' : '!rounded-2xl !rounded-bl-md border border-slate-200/80 bg-white text-slate-800'}`}>
                      <div className="whitespace-pre-line">{renderMessage(message.content)}</div>
                      {message.files?.filter((file) => !message.content.includes(file.url)).map((file) => (
                        <DocumentDownloadCard key={file.id} {...file} />
                      ))}
                      {message.role === 'assistant' && (
                        <button
                          type="button"
                          onClick={() => speakText(message.content, message.id)}
                          className="mt-2 inline-flex items-center gap-1.5 border-t border-slate-100 pt-2 text-xs font-medium text-slate-500 transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          title="Écouter la réponse"
                        >
                          <Volume2 size={14} aria-hidden="true" />
                          <span>{speakingMessageId === message.id ? 'Arrêter la lecture' : 'Écouter'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {messages.length === 1 && (
                  <div className="mx-auto mt-5 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
                    {suggestions.map((suggestion) => (
                      <button key={suggestion} onClick={() => void sendMessage(suggestion)} className="!rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left text-sm leading-5 text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-slate-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {isLoading && (
                  <div className="ml-10 flex items-center gap-2 self-start !rounded-2xl !rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                    <Loader size={16} className="animate-spin text-blue-600" aria-hidden="true" />
                    Sohane prépare une réponse…
                  </div>
                )}
                {speechError && (
                  <p role="alert" className="ml-10 !rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{speechError}</p>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form className="shrink-0 border-t border-slate-200 bg-white px-3 py-3 sm:px-4 sm:py-4" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}>
              <div className="mx-auto flex max-w-3xl items-end gap-2 !rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                <textarea ref={inputRef} value={inputValue} onChange={(event) => setInputValue(event.target.value)} onKeyDown={handleKeyDown} placeholder={t('chat.placeholder')} aria-label={t('chat.message')} rows={1} disabled={isLoading || isTranscribing} className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed" />

                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isTranscribing || isLoading}
                  className={`!rounded-xl p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-slate-600 hover:bg-blue-100 hover:text-blue-700'} disabled:cursor-wait disabled:opacity-60`}
                  aria-label={isListening ? 'Terminer l’enregistrement vocal' : 'Parler au micro'}
                  title={isTranscribing ? 'Transcription en cours…' : isListening ? 'Cliquer pour envoyer votre question' : 'Dicter votre question'}
                >
                  {isTranscribing ? <Loader size={18} className="animate-spin" /> : isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <button type="submit" disabled={isLoading || !inputValue.trim()} className="!rounded-xl bg-blue-600 p-2.5 text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300" aria-label={t('chat.send')} title={t('chat.send')}>
                  <Send size={18} aria-hidden="true" />
                </button>
              </div>
              <p className="mx-auto mt-2 max-w-xl text-center text-[10px] text-slate-400 sm:text-[11px]">Les informations officielles Admissions et Contact font foi.</p>
              {memoryNotice && <p role="status" className="mx-auto mt-1 max-w-xl text-center text-[11px] text-slate-500">{memoryNotice}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
