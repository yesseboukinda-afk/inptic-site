'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

function renderMessage(text: string) {
  const cleanText = text.replace(/^#{1,3}\s+/gm, '');
  const parts = cleanText.split(/(\[[^\]]+\]\(\/[^\s)]+\))/g);

  return parts.map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\((\/[^\s)]+)\)$/);

    if (!link || link[2].startsWith('//')) {
      return <span key={index}>{part}</span>;
    }

    return (
      <a
        key={index}
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
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Bonjour 👋 ! Comment puis-je vous aider ? Vous cherchez une formation, des informations sur l\'INPTIC ou avez une question ?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const openChat = () => setIsOpen(true);

    window.addEventListener('open-inptic-chat', openChat);
    return () => window.removeEventListener('open-inptic-chat', openChat);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
            .slice(-12)
            .map(({ sender, text }) => ({
              role: sender === 'user' ? 'user' : 'assistant',
              content: text,
            })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Erreur IA');
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      const botResponse: Message = {
        id: (Date.now() + 2).toString(),
        text: 'Désolé, je n’ai pas pu répondre pour le moment. Réessayez plus tard.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full p-3 sm:p-4 shadow-lg z-50 transition-all duration-200 transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
        aria-expanded={isOpen}
        aria-controls="chat-window"
        title={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {isOpen ? (
          <X size={20} className="sm:h-6 sm:w-6" aria-hidden="true" />
        ) : (
          <Bot size={20} className="sm:h-6 sm:w-6" aria-hidden="true" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          id="chat-window"
          className="fixed bottom-16 sm:bottom-20 right-4 sm:right-6 w-full sm:w-96 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl z-50 flex flex-col max-h-[calc(100vh-150px)] sm:max-h-96 animate-in slide-in-from-bottom-4 duration-300"
          role="dialog"
          aria-labelledby="chat-header"
          aria-describedby="chat-status"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl flex-shrink-0">
            <h3 id="chat-header" className="font-bold text-lg text-white">INPTIC Assistant</h3>
            <p id="chat-status" className="text-sm text-blue-100">Nous répondons généralement en quelques secondes</p>
          </div>

          {/* Messages Container */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
            role="log"
            aria-live="polite"
            aria-label="Messages du chat"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-200`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none shadow-sm'
                  }`}
                  role={message.sender === 'bot' ? 'status' : 'article'}
                >
                  <p className="whitespace-pre-line text-sm leading-relaxed">{renderMessage(message.text)}</p>
                  <span className={`text-xs ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'} mt-1 block`}>
                    {message.timestamp.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-200">
                <div className="bg-white text-gray-900 border border-gray-200 rounded-lg rounded-bl-none px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader size={16} className="animate-spin text-blue-600" aria-hidden="true" />
                    <span className="text-sm text-gray-600">Le bot est en train de répondre...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t bg-white p-4 rounded-b-2xl flex-shrink-0 space-y-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écrivez votre message..."
                aria-label="Champ de message"
                disabled={isLoading}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                aria-label="Envoyer le message"
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px]"
              >
                <Send size={18} aria-hidden="true" />
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              💡 Conseil: Posez vos questions sur les formations, admissions, vie étudiante, etc.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
