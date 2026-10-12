'use client';

import { useEffect, useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/lib/auth-client';
import { canAccessStaffService } from '@/lib/roles';

type AgendaEventId = 'openDay' | 'companiesForum' | 'aiConference';
type AgendaEvent = { id: AgendaEventId; date: string; title: string };

export default function HomeAgenda() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [editingId, setEditingId] = useState<AgendaEventId | null>(null);
  const [draftEvent, setDraftEvent] = useState<AgendaEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const defaults: AgendaEvent[] = [
      { id: 'openDay', date: '28 MAI', title: t('home.openDay') },
      { id: 'companiesForum', date: '05 JUIN', title: t('home.companiesForum') },
      { id: 'aiConference', date: '12 JUIN', title: t('home.aiConference') },
    ];
    setEvents(defaults);

    let active = true;
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

    void fetch('/api/home-agenda', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json() as { events?: AgendaEvent[]; error?: string };
        if (!response.ok) throw new Error(payload.error || 'Impossible de charger l’agenda.');
        if (active && Array.isArray(payload.events)) setEvents(payload.events);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Impossible de charger l’agenda.');
        }
      });

    return () => {
      active = false;
    };
  }, [t]);

  function beginEditing(event: AgendaEvent) {
    setDraftEvent({ ...event });
    setEditingId(event.id);
    setError('');
  }

  function updateDraft(field: 'date' | 'title', value: string) {
    setDraftEvent((current) => current ? { ...current, [field]: value } : current);
  }

  async function saveAgenda() {
    if (!draftEvent) return;
    setIsSaving(true);
    setError('');
    try {
      const updatedEvents = events.map((event) =>
        event.id === draftEvent.id ? draftEvent : event,
      );
      const response = await fetch('/api/home-agenda', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: updatedEvents }),
      });
      const payload = await response.json() as { events?: AgendaEvent[]; error?: string };
      if (!response.ok) throw new Error(payload.error || 'Impossible d’enregistrer l’agenda.');
      if (!Array.isArray(payload.events)) throw new Error('Réponse invalide du serveur.');
      setEvents(payload.events);
      setEditingId(null);
      setDraftEvent(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Impossible d’enregistrer l’agenda.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <h3 className="font-bold">{t('home.agenda')}</h3>

      <div className="mt-3 space-y-3">
        {events.map((event) => (
          <div key={event.id} className="min-w-0">
            {editingId === event.id && draftEvent ? (
              <div className="grid gap-2 sm:grid-cols-[110px_minmax(0,1fr)]">
                <label className="sr-only" htmlFor={`agenda-date-${event.id}`}>Date</label>
                <input
                  id={`agenda-date-${event.id}`}
                  value={draftEvent.date}
                  maxLength={40}
                  onChange={(inputEvent) => updateDraft('date', inputEvent.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-slate-950/60 px-2.5 py-2 text-sm text-white placeholder:text-slate-400 focus:border-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-300/30"
                  aria-label={`Date : ${event.title}`}
                />
                <label className="sr-only" htmlFor={`agenda-title-${event.id}`}>Événement</label>
                <input
                  id={`agenda-title-${event.id}`}
                  value={draftEvent.title}
                  maxLength={180}
                  onChange={(inputEvent) => updateDraft('title', inputEvent.target.value)}
                  className="w-full min-w-0 rounded-lg border border-white/15 bg-slate-950/60 px-2.5 py-2 text-sm text-white placeholder:text-slate-400 focus:border-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-300/30"
                  aria-label={`Intitulé : ${event.title}`}
                />
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => void saveAgenda()}
                    disabled={isSaving || !draftEvent.date.trim() || !draftEvent.title.trim()}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={14} aria-hidden="true" />
                    {isSaving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setDraftEvent(null);
                      setError('');
                    }}
                    disabled={isSaving}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                  >
                    <X size={14} aria-hidden="true" />
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 text-sm leading-relaxed text-slate-200">
                  <span className="font-semibold text-white">{event.date}</span>
                  {' — '}
                  {event.title}
                </p>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => beginEditing(event)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 transition hover:border-blue-300/40 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                    aria-label={`Modifier ${event.title}`}
                    title={`Modifier ${event.title}`}
                  >
                    <Pencil size={13} aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && canEdit && (
        <p role="alert" className="mt-3 text-xs text-rose-200">{error}</p>
      )}
    </div>
  );
}
