'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, TrendingUp, MessageSquare, Globe, RefreshCw, Send, Bell, ExternalLink } from 'lucide-react';

type MentionItem = {
  id: string;
  source: string;
  author: string;
  content: string;
  sentiment: 'positif' | 'neutre' | 'negatif';
  date: string;
  url: string;
  platform: 'Facebook' | 'Twitter/X' | 'LinkedIn' | 'Google Avis' | 'Presse en ligne' | 'WhatsApp / Groupes';
};

export default function EReputationDashboard() {
  const [mentions, setMentions] = useState<MentionItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'positif' | 'neutre' | 'negatif'>('all');
  const [replyText, setReplyText] = useState('');
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  const loadLiveMentions = () => {
    setIsScanning(true);
    fetch('/api/ereputation')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.mentions) && data.mentions.length > 0) {
          setMentions(data.mentions);
        }
      })
      .catch(() => {})
      .finally(() => setIsScanning(false));
  };

  useEffect(() => {
    loadLiveMentions();
    const interval = setInterval(() => {
      loadLiveMentions();
    }, 5 * 60 * 1000); // Fréquence de scan automatique de 5 minutes
    return () => clearInterval(interval);
  }, []);

  const positiveCount = mentions.filter((m) => m.sentiment === 'positif').length;
  const neutralCount = mentions.filter((m) => m.sentiment === 'neutre').length;
  const negativeCount = mentions.filter((m) => m.sentiment === 'negatif').length;
  const score = Math.round((positiveCount / (mentions.length || 1)) * 100);

  const filtered = mentions.filter((m) => filter === 'all' || m.sentiment === filter);
  const negativeAlerts = mentions.filter((m) => m.sentiment === 'negatif');

  const handleSendReply = (id: string) => {
    if (!replyText.trim()) return;
    alert('Réponse officielle / Droit de réponse enregistré et diffusé.');
    setReplyText('');
    setReplyingId(null);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black shadow">
            <ShieldAlert size={24} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Veille &amp; E-réputation</span>
            <h3 className="text-xl font-black text-slate-900">Surveillance des Médias &amp; Réseaux Sociaux</h3>
            <p className="text-xs text-slate-500">Analyse de sentiment en temps réel et alertes de réputation institutionnelle</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isScanning ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
              Écoute en direct
            </span>
            <span className="text-lg font-black text-emerald-600">{score}% Positif</span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <TrendingUp size={18} />
          </div>
        </div>
      </div>

      {/* Raccourcis Plateformes Officielles du Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs">
        <span className="font-bold text-slate-700">Canaux officiels INPTIC surveillés :</span>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://www.facebook.com/share/1JiVyPnGRj/?mibextid=wwXIfr"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:border-blue-400 transition"
          >
            <Globe size={13} className="text-blue-600" />
            <span>Facebook Officiel</span>
          </a>
          <a
            href="https://whatsapp.com/channel/0029VagrNh3KQuJBA9v3Zc3i"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:border-green-400 transition"
          >
            <Globe size={13} className="text-green-600" />
            <span>WhatsApp Channel</span>
          </a>
          <a
            href="https://www.youtube.com/@INPTICGabonOfficiel"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:border-red-400 transition"
          >
            <Globe size={13} className="text-red-600" />
            <span>YouTube Officiel</span>
          </a>
        </div>
      </div>

      {/* ── CENTRE DE NOTIFICATION TEMPS RÉEL (COMMENTAIRES PÉJORATIFS & DÉGRADANTS) ── */}
      {negativeAlerts.length > 0 && (
        <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-5 shadow-lg space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-red-800">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
              </span>
              <Bell size={18} className="animate-bounce" />
              <h4 className="font-black text-sm uppercase tracking-wide">
                Alerte E-réputation : {negativeAlerts.length} alerte(s) critique(s) détectée(s) en temps réel
              </h4>
            </div>
            <span className="rounded-full bg-red-600 px-3 py-0.5 text-xs font-bold text-white">
              Action urgente
            </span>
          </div>

          <div className="space-y-3">
            {negativeAlerts.map((alertItem) => (
              <div key={alertItem.id} className="rounded-xl border border-red-200 bg-white p-4 space-y-2 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-red-100 px-2 py-0.5 font-bold text-red-800">{alertItem.platform}</span>
                    <strong className="text-slate-900">Source : {alertItem.author}</strong>
                  </div>
                  <span className="text-slate-500 font-medium">🕒 {alertItem.date}</span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-red-950 bg-red-50/80 p-3 rounded-lg border border-red-100">
                  &laquo; {alertItem.content} &raquo;
                </p>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <a
                    href={alertItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                  >
                    <ExternalLink size={13} />
                    <span>Lien direct vers la source d&apos;origine</span>
                  </a>

                  <button
                    onClick={() => setReplyingId(replyingId === alertItem.id ? null : alertItem.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600 transition"
                  >
                    <MessageSquare size={13} />
                    <span>Publier un droit de réponse</span>
                  </button>
                </div>

                {replyingId === alertItem.id && (
                  <div className="mt-2 flex items-center gap-2 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Rédiger la réponse officielle de l'INPTIC..."
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleSendReply(alertItem.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                    >
                      <Send size={13} />
                      <span>Diffuser</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistiques de mentions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-xs text-slate-500">Total Mentions (Live)</span>
          <p className="mt-1 text-2xl font-black text-slate-900">{mentions.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <span className="text-xs text-emerald-700 font-semibold">Positives (😊)</span>
          <p className="mt-1 text-2xl font-black text-emerald-800">{positiveCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-blue-50 p-4">
          <span className="text-xs text-blue-700 font-semibold">Neutres (😐)</span>
          <p className="mt-1 text-2xl font-black text-blue-800">{neutralCount}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <span className="text-xs text-red-700 font-semibold">Alertes / Négatives (⚠️)</span>
          <p className="mt-1 text-2xl font-black text-red-800">{negativeCount}</p>
        </div>
      </div>

      {/* Filtres de sentiment */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'Toutes les mentions'],
              ['positif', 'Positives'],
              ['neutre', 'Neutres'],
              ['negatif', 'Alertes Négatives'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                filter === val ? 'bg-slate-900 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={loadLiveMentions}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
          <span>Actualiser le scan web</span>
        </button>
      </div>

      {/* Liste des mentions */}
      <div className="space-y-3.5">
        {isScanning && mentions.length === 0 ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-blue-600" />
            <p className="text-xs font-medium text-slate-500">Scan des actualités et réseaux en temps réel...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500 text-xs">
            Aucune mention trouvée pour ce filtre.
          </div>
        ) : (
          filtered.map((m) => (
            <div key={m.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-800">
                    {m.platform}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{m.author}</span>
                  <span className="text-xs text-slate-400">({m.source})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{m.date}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      m.sentiment === 'positif'
                        ? 'bg-emerald-100 text-emerald-800'
                        : m.sentiment === 'negatif'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {m.sentiment}
                  </span>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-slate-700">{m.content}</p>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <Globe size={13} />
                  <span>Voir la source originale</span>
                </a>

                <button
                  onClick={() => setReplyingId(replyingId === m.id ? null : m.id)}
                  className="inline-flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <MessageSquare size={13} />
                  <span>Répondre officiellement</span>
                </button>
              </div>

              {replyingId === m.id && (
                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-200">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Écrire un communiqué ou une réponse officielle..."
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleSendReply(m.id)}
                    className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                  >
                    <Send size={13} />
                    <span>Envoyer</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
