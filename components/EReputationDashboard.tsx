'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, TrendingUp, MessageSquare, Globe, RefreshCw, Send, Bell, ExternalLink, Clock, ThumbsUp, AlertTriangle } from 'lucide-react';

type MentionItem = {
  id: string;
  source: string;
  author: string;
  content: string;
  sentiment: 'positif' | 'neutre' | 'negatif';
  date: string;
  createdAt?: string;
  url: string;
  platform: 'Facebook' | 'YouTube' | 'Twitter/X' | 'LinkedIn' | 'Google Avis' | 'Presse en ligne' | 'WhatsApp / Groupes';
};

function getPlatformIcon(platform: MentionItem['platform']) {
  const value = platform.toLowerCase();
  if (value.includes('facebook')) return <img src="/partages/facebook.svg" alt="" className="h-4 w-4" />;
  if (value.includes('youtube')) return <img src="/partages/youtube.svg" alt="" className="h-4 w-4" />;
  if (value.includes('linkedin')) return <img src="/partages/linkedin.svg" alt="" className="h-4 w-4" />;
  if (value.includes('whatsapp')) return <img src="/partages/whatsapp.svg" alt="" className="h-4 w-4" />;
  if (value.includes('twitter') || value === 'x') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.257 5.63 5.907-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
      </svg>
    );
  }
  return <Globe size={15} aria-hidden="true" />;
}

export default function EReputationDashboard({ accessToken }: { accessToken: string }) {
  const [mentions, setMentions] = useState<MentionItem[]>([]);
  const [comments, setComments] = useState<MentionItem[]>([]);
  const [commentPlatformFilter, setCommentPlatformFilter] = useState<'all' | 'Facebook' | 'YouTube'>('all');
  const [filter, setFilter] = useState<'all' | 'positif' | 'neutre' | 'negatif'>('all');
  const [replyText, setReplyText] = useState('');
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [replySuccess, setReplySuccess] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [scanError, setScanError] = useState('');
  const [scanWarning, setScanWarning] = useState('');
  const [lastScannedAt, setLastScannedAt] = useState<Date | null>(null);
  const scanInProgress = useRef(false);

  const loadLiveMentions = async (forceRefresh = false) => {
    if (scanInProgress.current) return;
    scanInProgress.current = true;
    setIsScanning(true);
    setScanError('');
    setScanWarning('');

    try {
      const res = await fetch(`/api/ereputation${forceRefresh ? '?refresh=1' : ''}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Le scan e-réputation est momentanément indisponible.');

      const data = await res.json();
      if (!data?.success || !Array.isArray(data.mentions)) {
        throw new Error('La réponse du scan e-réputation est invalide.');
      }

      setMentions(data.mentions);
      setComments(Array.isArray(data.comments) ? data.comments : []);
      setLastScannedAt(new Date());
      const unavailableSources: string[] = [];
      if (data.sources?.facebook === 'unavailable') {
        unavailableSources.push(data.sourceErrors?.facebook || 'Facebook indisponible');
      }
      if (data.sources?.facebook === 'not_configured') unavailableSources.push('Facebook non configuré');
      if (data.sources?.youtube === 'unavailable') unavailableSources.push('YouTube indisponible');
      if (data.sources?.youtube === 'not_configured') unavailableSources.push('YouTube non configuré');
      if (data.sources?.press !== 'available') unavailableSources.push('presse en ligne indisponible');
      if (unavailableSources.length > 0) {
        setScanWarning(`Sources non actualisées : ${unavailableSources.join(', ')}.`);
      }
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Impossible d’actualiser la veille e-réputation.');
    } finally {
      scanInProgress.current = false;
      setIsScanning(false);
    }
  };

  useEffect(() => {
    loadLiveMentions();
    const interval = setInterval(() => {
      loadLiveMentions();
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const socialComments = mentions.filter(
    (mention) => mention.platform === 'Facebook' || mention.platform === 'YouTube',
  );
  const positiveCount = socialComments.filter((comment) => comment.sentiment === 'positif').length;
  const neutralCount = socialComments.filter((comment) => comment.sentiment === 'neutre').length;
  const negativeCount = socialComments.filter((comment) => comment.sentiment === 'negatif').length;
  const score = Math.round((positiveCount / (socialComments.length || 1)) * 100);

  const filtered = mentions.filter((m) => filter === 'all' || m.sentiment === filter);
  const filteredComments = comments
    .filter((comment) => commentPlatformFilter === 'all' || comment.platform === commentPlatformFilter)
    .sort((first, second) => {
      const firstTime = first.createdAt ? Date.parse(first.createdAt) : Number.NaN;
      const secondTime = second.createdAt ? Date.parse(second.createdAt) : Number.NaN;
      if (Number.isNaN(firstTime)) return Number.isNaN(secondTime) ? 0 : 1;
      if (Number.isNaN(secondTime)) return -1;
      return secondTime - firstTime;
    });
  const facebookCommentsWithoutAuthor = comments.filter(
    (comment) => comment.platform === 'Facebook' && comment.author === 'Utilisateur Facebook',
  ).length;
  const negativeAlerts = socialComments.filter((comment) => comment.sentiment === 'negatif');

  const handleSendReply = async (id: string) => {
    const message = replyText.trim();
    if (!message || isReplying) return;
    if (!accessToken) {
      setReplyError('Connectez-vous avec un compte INPTIC autorisé pour publier une réponse.');
      setReplySuccess('');
      return;
    }

    setIsReplying(true);
    setReplyError('');
    setReplySuccess('');
    try {
      const response = await fetch('/api/ereputation', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ commentId: id, message }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Facebook n’a pas publié la réponse.');
      }

      setReplyText('');
      setReplySuccess('Réponse publiée sur Facebook.');
      void loadLiveMentions(true);
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : 'Impossible de publier la réponse sur Facebook.');
    } finally {
      setIsReplying(false);
    }
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
            <p className="text-xs text-slate-500">Derniers commentaires actualisés chaque minute et alertes de réputation institutionnelle</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isScanning ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
              {isScanning ? 'Scan en cours' : lastScannedAt ? `Actualisé à ${lastScannedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'En attente'}
            </span>
            <span className="text-lg font-black text-emerald-600">{score}% de commentaires positifs</span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <TrendingUp size={18} />
          </div>
        </div>
      </div>

      {/* Canal officiel INPTIC surveillé */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700">Canaux surveillés :</span>
          <a
            href="https://www.facebook.com/people/Inptic-Gabon/61557159190234/?mibextid=wwXIfr"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:border-blue-400 transition"
          >
            <img src="/partages/facebook.svg" alt="" className="h-4 w-4" />
            <span>Facebook</span>
          </a>
          <a
            href="https://www.youtube.com/@INPTICGabonOfficiel"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:border-red-400 transition"
          >
            <img src="/partages/youtube.svg" alt="" className="h-4 w-4" />
            <span>YouTube</span>
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
                Alerte E-réputation : {negativeAlerts.length} alerte(s) critique(s) détectée(s)
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
                    <span role="img" aria-label={alertItem.platform} title={alertItem.platform} className="inline-flex h-8 w-8 items-center justify-center bg-red-100 text-red-800">
                      {getPlatformIcon(alertItem.platform)}
                    </span>
                    <strong className="text-slate-900">Auteur : {alertItem.author}</strong>
                  </div>
                  <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                    <Clock size={12} />
                    <span>{alertItem.date}</span>
                  </span>
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
                    <span>Lien vers le commentaire d&apos;origine</span>
                  </a>

                  {alertItem.platform === 'Facebook' && alertItem.id.startsWith('fb-live-') && (
                    <button
                      onClick={() => {
                        setReplyingId(replyingId === alertItem.id ? null : alertItem.id);
                        setReplyError('');
                        setReplySuccess('');
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600 transition"
                    >
                      <MessageSquare size={13} />
                      <span>Publier un droit de réponse</span>
                    </button>
                  )}
                </div>

                {replyingId === alertItem.id && alertItem.platform === 'Facebook' && alertItem.id.startsWith('fb-live-') && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      value={replyText}
                      maxLength={8000}
                      disabled={isReplying}
                      onChange={(e) => {
                        setReplyText(e.target.value);
                        setReplyError('');
                        setReplySuccess('');
                      }}
                      placeholder="Rédiger la réponse de l'INPTIC..."
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleSendReply(alertItem.id)}
                      disabled={isReplying || !replyText.trim()}
                      className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isReplying ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                      <span>{isReplying ? 'Publication…' : 'Publier sur Facebook'}</span>
                    </button>
                    {(replyError || replySuccess) && (
                      <p role={replyError ? 'alert' : 'status'} className={`basis-full text-xs ${replyError ? 'text-red-700' : 'text-emerald-700'}`}>
                        {replyError || replySuccess}
                      </p>
                    )}
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
          <span className="text-xs text-emerald-700 font-semibold inline-flex items-center gap-1">
            <ThumbsUp size={13} /> Commentaires positifs
          </span>
          <p className="mt-1 text-2xl font-black text-emerald-800">{positiveCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-blue-50 p-4">
          <span className="text-xs text-blue-700 font-semibold inline-flex items-center gap-1">
            <Globe size={13} /> Commentaires neutres
          </span>
          <p className="mt-1 text-2xl font-black text-blue-800">{neutralCount}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <span className="text-xs text-red-700 font-semibold inline-flex items-center gap-1">
            <AlertTriangle size={13} /> Commentaires négatifs
          </span>
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
          type="button"
          onClick={() => loadLiveMentions(true)}
          disabled={isScanning}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
          <span>{isScanning ? 'Scan en cours…' : 'Actualiser le scan web'}</span>
        </button>
      </div>

      {(scanError || scanWarning) && (
        <div
          role="status"
          className={`rounded-xl border p-3 text-xs ${scanError ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}
        >
          {scanError || scanWarning}
        </div>
      )}

      {/* ── SECTION COMMENTAIRES FACEBOOK & YOUTUBE ── */}
      <section aria-labelledby="recent-comments-heading" className="space-y-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-600" />
            <h4 id="recent-comments-heading" className="text-sm font-black text-slate-900">
              Commentaires récents
            </h4>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{filteredComments.length} commentaire{filteredComments.length > 1 ? 's' : ''}</span>
            <select
              aria-label="Filtrer les commentaires par plateforme"
              value={commentPlatformFilter}
              onChange={(event) => setCommentPlatformFilter(event.target.value as 'all' | 'Facebook' | 'YouTube')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">Toutes les plateformes</option>
              <option value="Facebook">Facebook</option>
              <option value="YouTube">YouTube</option>
            </select>
          </div>
        </div>
        {(commentPlatformFilter === 'all' || commentPlatformFilter === 'Facebook') && facebookCommentsWithoutAuthor > 0 && (
          <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Meta n’a pas transmis le nom pour {facebookCommentsWithoutAuthor} commentaire{facebookCommentsWithoutAuthor > 1 ? 's' : ''} Facebook.
            Vérifiez que le jeton de la Page dispose de l’autorisation <code>pages_read_user_content</code>, puis régénérez-le.
            Si le champ du nom reste absent, l’API Meta ne permet pas de le récupérer pour ce commentaire.
          </p>
        )}
        {filteredComments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
            {comments.length === 0
              ? 'Aucun commentaire récent accessible. Vérifiez les accès Facebook et YouTube.'
              : `Aucun commentaire récent sur ${commentPlatformFilter}.`}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredComments.map((comment) => (
              <article key={comment.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span role="img" aria-label={comment.platform} title={comment.platform} className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
                      {getPlatformIcon(comment.platform)}
                    </span>
                    <strong className="text-xs text-slate-900">{comment.author}</strong>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock size={11} />{comment.date}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                      comment.sentiment === 'positif'
                        ? 'bg-emerald-100 text-emerald-800'
                        : comment.sentiment === 'negatif'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {comment.sentiment}
                    </span>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-700">{comment.content}</p>
                <div className="pt-1">
                  <a href={comment.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
                    <ExternalLink size={12} />Voir sur {comment.platform}
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Liste des mentions */}
      <div className="space-y-3.5">
        {isScanning && mentions.length === 0 ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-blue-600" />
            <p className="text-xs font-medium text-slate-500">Chargement des derniers commentaires disponibles...</p>
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
                  <span role="img" aria-label={m.platform} title={m.platform} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
                    {getPlatformIcon(m.platform)}
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

                {m.platform === 'Facebook' && m.id.startsWith('fb-live-') && (
                  <button
                    onClick={() => {
                      setReplyingId(replyingId === m.id ? null : m.id);
                      setReplyError('');
                      setReplySuccess('');
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                  >
                    <MessageSquare size={13} />
                    <span>Répondre</span>
                  </button>
                )}
              </div>

              {replyingId === m.id && m.platform === 'Facebook' && m.id.startsWith('fb-live-') && (
                <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                  <input
                    type="text"
                    value={replyText}
                    maxLength={8000}
                    disabled={isReplying}
                    onChange={(e) => {
                      setReplyText(e.target.value);
                      setReplyError('');
                      setReplySuccess('');
                    }}
                    placeholder="Écrire un communiqué ou une réponse officielle..."
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleSendReply(m.id)}
                    disabled={isReplying || !replyText.trim()}
                    className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isReplying ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>{isReplying ? 'Publication…' : 'Publier sur Facebook'}</span>
                  </button>
                  {(replyError || replySuccess) && (
                    <p role={replyError ? 'alert' : 'status'} className={`basis-full text-xs ${replyError ? 'text-red-700' : 'text-emerald-700'}`}>
                      {replyError || replySuccess}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
