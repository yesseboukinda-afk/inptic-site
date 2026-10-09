'use client';

import { useEffect, useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { canAccessStaffService } from '@/lib/roles';

export type DirectorMessageContent = {
  title: string;
  text: string;
  name: string;
  role: string;
};

type Props = { defaults: DirectorMessageContent };

export default function DirectorMessage({ defaults }: Props) {
  const [content, setContent] = useState(defaults);
  const [draft, setDraft] = useState(defaults);
  const [canEdit, setCanEdit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setContent(defaults);
    setDraft(defaults);

    void authClient.auth.getSession().then(({ data }) => {
      if (!active) return;
      const user = data.session?.user;
      const assignedService = user?.user_metadata?.service ?? user?.user_metadata?.department;
      setCanEdit(Boolean(user && canAccessStaffService(
        user.app_metadata?.role,
        'announcements',
        assignedService,
      )));
    });

    void fetch('/api/director-message', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json() as { content?: DirectorMessageContent | null; error?: string };
        if (!response.ok) throw new Error(payload.error || 'Impossible de charger le message du DG.');
        if (active && payload.content) {
          setContent(payload.content);
          setDraft(payload.content);
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Impossible de charger le message du DG.');
      });

    return () => {
      active = false;
    };
  }, [defaults.title, defaults.text, defaults.name, defaults.role]);

  function updateDraft(field: keyof DirectorMessageContent, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function saveMessage() {
    setIsSaving(true);
    setError('');
    try {
      const response = await fetch('/api/director-message', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft }),
      });
      const payload = await response.json() as { content?: DirectorMessageContent; error?: string };
      if (!response.ok) throw new Error(payload.error || 'Impossible d’enregistrer le message du DG.');
      if (!payload.content) throw new Error('Réponse invalide du serveur.');
      setContent(payload.content);
      setDraft(payload.content);
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Impossible d’enregistrer le message du DG.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="director-message mt-8 rounded-2xl bg-blue-50 p-5">
      {isEditing ? (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-600" htmlFor="director-message-title">Titre</label>
          <input
            id="director-message-title"
            value={draft.title}
            maxLength={180}
            onChange={(event) => updateDraft('title', event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <label className="block text-xs font-semibold text-slate-600" htmlFor="director-message-text">Texte</label>
          <textarea
            id="director-message-text"
            value={draft.text}
            maxLength={3000}
            rows={5}
            onChange={(event) => updateDraft('text', event.target.value)}
            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600" htmlFor="director-message-name">Nom du DG</label>
              <input
                id="director-message-name"
                value={draft.name}
                maxLength={120}
                onChange={(event) => updateDraft('name', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600" htmlFor="director-message-role">Fonction</label>
              <input
                id="director-message-role"
                value={draft.role}
                maxLength={120}
                onChange={(event) => updateDraft('role', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => void saveMessage()}
              disabled={isSaving || !draft.title.trim() || !draft.text.trim() || !draft.name.trim() || !draft.role.trim()}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} aria-hidden="true" />
              {isSaving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(content);
                setIsEditing(false);
                setError('');
              }}
              disabled={isSaving}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white disabled:opacity-50"
            >
              <X size={14} aria-hidden="true" />
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold uppercase text-blue-700">{content.title}</p>
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setDraft(content);
                  setIsEditing(true);
                  setError('');
                }}
                aria-label="Modifier le message du DG"
                title="Modifier le message du DG"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-white/70 text-blue-800 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Pencil size={14} aria-hidden="true" />
              </button>
            )}
          </div>
          <blockquote className="mt-4 whitespace-pre-line text-lg leading-8 text-slate-800">
            « {content.text} »
          </blockquote>
          <p className="mt-3 font-semibold text-slate-900">{content.name}</p>
          <p className="text-sm text-slate-600">{content.role}</p>
        </>
      )}
      {error && canEdit && <p role="alert" className="mt-3 text-xs text-rose-700">{error}</p>}
    </div>
  );
}