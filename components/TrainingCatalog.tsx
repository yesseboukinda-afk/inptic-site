'use client';

import { useEffect, useState } from 'react';
import { Download, ExternalLink, FileText, Loader2, PlayCircle, Plus, Trash2, Upload, Video } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { canAccessStaffService } from '@/lib/roles';

type TrainingResource = {
  id: string;
  title: string;
  kind: 'pdf' | 'video';
  url: string;
  path: string | null;
  status: 'published' | 'draft';
};

function getVideoEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host.endsWith('youtube.com')) {
      const id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).at(-1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host.endsWith('vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).at(-1);
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function getDownloadUrl(resource: TrainingResource) {
  try {
    const url = new URL(resource.url);
    const fileName = resource.title.toLowerCase().endsWith('.pdf') ? resource.title : `${resource.title}.pdf`;
    url.searchParams.set('download', fileName);
    return url.toString();
  } catch {
    return resource.url;
  }
}

export default function TrainingCatalog() {
  const [resources, setResources] = useState<TrainingResource[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'pdf' | 'video'>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingResourceId, setUpdatingResourceId] = useState<string | null>(null);
  const [updatingAction, setUpdatingAction] = useState<'delete' | 'toggle' | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    authClient.auth.getSession().then(({ data }) => {
      const session = data.session;
      const role = session?.user?.app_metadata?.role ?? null;
      const assignedService = session?.user?.user_metadata?.service ?? session?.user?.user_metadata?.department;
      setToken(session?.access_token || null);
      setCanManage(Boolean(session && canAccessStaffService(role, 'formations', assignedService)));
    });
    const { data: { subscription } } = authClient.auth.onAuthStateChange((_event, session) => {
      const role = session?.user?.app_metadata?.role ?? null;
      const assignedService = session?.user?.user_metadata?.service ?? session?.user?.user_metadata?.department;
      setToken(session?.access_token || null);
      setCanManage(Boolean(session && canAccessStaffService(role, 'formations', assignedService)));
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    const headers = canManage && token ? { Authorization: `Bearer ${token}` } : undefined;
    fetch(`/api/formations/catalogue${canManage ? '?manage=1' : ''}`, { headers, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Chargement impossible.')))
      .then((payload) => {
        if (active) setResources(Array.isArray(payload.data) ? payload.data : []);
      })
      .catch(() => {
        if (active) setMessage('Le catalogue est momentanément indisponible.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [canManage, token]);

  async function refreshResources() {
    const response = await fetch(`/api/formations/catalogue${canManage ? '?manage=1' : ''}`, {
      headers: canManage && token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: 'no-store',
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Actualisation impossible.');
    setResources(Array.isArray(payload.data) ? payload.data : []);
  }

  async function publishResource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      if (!file) throw new Error('Sélectionnez le fichier à publier.');
      const uploadData = new FormData();
      uploadData.append('kind', kind);
      uploadData.append('files', file);
      const uploadResponse = await fetch('/api/formations/catalogue/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: uploadData,
      });
      const uploadPayload = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadPayload.error || 'Téléversement impossible.');
      const path = uploadPayload.data[0].path;

      const response = await fetch('/api/formations/catalogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title, kind, path }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Publication impossible.');
      setTitle('');
      setFile(null);
      setMessage('Ressource publiée.');
      await refreshResources();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setSaving(false);
    }
  }

  async function updateResource(resource: TrainingResource, action: 'delete' | 'toggle') {
    if (!token || saving || updatingResourceId) return;
    setUpdatingResourceId(resource.id);
    setUpdatingAction(action);
    setMessage('');
    try {
      const response = action === 'delete'
        ? await fetch(`/api/formations/catalogue?id=${encodeURIComponent(resource.id)}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          })
        : await fetch('/api/formations/catalogue', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id: resource.id, status: resource.status === 'published' ? 'draft' : 'published' }),
          });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Modification impossible.');
      await refreshResources();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Modification impossible.');
    } finally {
      setUpdatingResourceId(null);
      setUpdatingAction(null);
    }
  }

  const publishedResources = resources.filter((resource) => resource.status === 'published');
  const pdfResources = publishedResources.filter((resource) => resource.kind === 'pdf');
  const videoResources = publishedResources.filter((resource) => resource.kind === 'video');
  const featuredPdf = pdfResources[0] || null;
  const featuredVideo = videoResources[0] || null;

  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-screen-2xl px-4 py-12 md:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-teal-700">INPTIC · Ressources</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Catalogue et formations vidéo</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Consultez le catalogue officiel et les vidéos publiées par l’INPTIC.</p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowManager((visible) => !visible)}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Upload size={16} aria-hidden="true" />
              {showManager ? 'Fermer la gestion' : 'Gérer le catalogue'}
            </button>
          )}
        </header>

        {canManage && showManager && (
          <div className="mt-8 border-y border-slate-200 py-6">
            <h3 className="text-lg font-bold text-slate-900">Publier une ressource</h3>
            <p className="mt-1 text-sm text-slate-600">Le catalogue public présente une seule vidéo et un seul PDF à la fois. Une nouvelle publication remplace la précédente.</p>
            <form onSubmit={publishResource} className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Titre
                <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} className="mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Type
                <select value={kind} onChange={(event) => { setKind(event.target.value as 'pdf' | 'video'); setFile(null); }} className="mt-1 block min-h-11 w-full rounded-md border border-slate-300 bg-white px-3">
                  <option value="pdf">Catalogue PDF</option>
                  <option value="video">Catalogue vidéo complet</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                {kind === 'pdf' ? 'Fichier PDF' : 'Fichier vidéo (MP4/WebM)'}
                <input
                  type="file"
                  required
                  accept={kind === 'pdf' ? 'application/pdf,.pdf' : 'video/mp4,video/webm,.mp4,.webm'}
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="mt-1 block min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  {kind === 'pdf'
                    ? 'Sélectionnez le fichier PDF à téléverser (60 Mo maximum).'
                    : 'Sélectionnez le fichier vidéo à téléverser (15 Mo maximum).'}
                </span>
              </label>
              <button type="submit" disabled={saving || Boolean(updatingResourceId)} aria-busy={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 md:col-span-2 md:justify-self-start">
                {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
                {saving ? 'Téléversement et publication…' : 'Publier en ligne'}
              </button>
            </form>

            <div className="mt-7 divide-y divide-slate-200 border-y border-slate-200">
              {loading && resources.length === 0 ? (
                <p role="status" className="flex items-center gap-2 py-5 text-sm text-slate-500">
                  <Loader2 size={16} className="animate-spin text-teal-700" aria-hidden="true" />
                  Chargement des ressources…
                </p>
              ) : resources.map((resource) => {
                const updating = updatingResourceId === resource.id;
                return (
                <div key={resource.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {resource.kind === 'pdf' ? <FileText size={18} className="shrink-0 text-teal-700" /> : <Video size={18} className="shrink-0 text-teal-700" />}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{resource.title}</p>
                      <p className="text-xs text-slate-500">{resource.kind === 'pdf' ? 'PDF' : 'Vidéo'} · {resource.status === 'published' ? 'En ligne' : 'Brouillon'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" disabled={saving || Boolean(updatingResourceId)} onClick={() => void updateResource(resource, 'toggle')} aria-busy={updating && updatingAction === 'toggle'} className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-teal-800 hover:underline disabled:cursor-wait disabled:opacity-60">
                      {updating && updatingAction === 'toggle' && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
                      {updating && updatingAction === 'toggle' ? 'Mise à jour…' : resource.status === 'published' ? 'Dépublier' : 'Publier'}
                    </button>
                    <button type="button" disabled={saving || Boolean(updatingResourceId)} onClick={() => void updateResource(resource, 'delete')} aria-label={updating && updatingAction === 'delete' ? `Suppression de ${resource.title}` : `Supprimer ${resource.title}`} aria-busy={updating && updatingAction === 'delete'} className="rounded p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-wait disabled:opacity-60">
                      {updating && updatingAction === 'delete' ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {message && <p role="status" className="mt-4 text-sm text-slate-600">{message}</p>}
        <section className="mt-10" aria-labelledby="training-video-title">
          <header className="border-b border-slate-200 pb-4">
            <p className="text-xs font-bold uppercase text-blue-700">INPTIC · Présentation générale</p>
            <h3 id="training-video-title" className="mt-1 text-xl font-black text-slate-900">Catalogue vidéo des formations</h3>
            <p className="mt-2 text-sm text-slate-600">Une vidéo unique présente l’ensemble des formations de l’INPTIC.</p>
          </header>
          <div className="mt-6 grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-6">
            <div className="relative aspect-video overflow-hidden bg-slate-950">
              {loading ? (
                <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-slate-300"><Loader2 size={18} className="animate-spin" aria-hidden="true" />Chargement de la vidéo…</div>
              ) : featuredVideo ? (() => {
                const embedUrl = getVideoEmbedUrl(featuredVideo.url);
                const isVideoFile = /\.(mp4|webm)(\?|$)/i.test(featuredVideo.url);
                if (isVideoFile) {
                  return <video controls preload="metadata" className="absolute inset-0 h-full w-full bg-slate-950 object-contain" src={featuredVideo.url} />;
                }
                if (embedUrl) {
                  return <iframe title={featuredVideo.title} src={embedUrl} className="absolute inset-0 h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />;
                }
                return (
                  <a href={featuredVideo.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center gap-3 p-5 text-white transition hover:bg-slate-900">
                    <PlayCircle size={36} aria-hidden="true" />
                    <span className="font-semibold">Ouvrir la présentation vidéo</span>
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                );
              })() : (
                <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-slate-300">
                  La vidéo de présentation de toutes les formations sera affichée ici après sa publication.
                </div>
              )}
            </div>
            <aside className="flex flex-col gap-3">
              {featuredPdf ? (
                <a
                  href={getDownloadUrl(featuredPdf)}
                  download={featuredPdf.title.toLowerCase().endsWith('.pdf') ? featuredPdf.title : `${featuredPdf.title}.pdf`}
                  className="catalogue-download-button inline-flex min-h-12 w-full items-center justify-center gap-2 bg-teal-700 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  <Download size={17} aria-hidden="true" />
                  Télécharger le PDF
                </a>
              ) : (
                <button type="button" disabled className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 bg-slate-200 px-4 py-3 text-sm font-bold text-slate-500">
                  <Download size={17} aria-hidden="true" />
                  Catalogue PDF à venir
                </button>
              )}
              <p className="text-xs leading-5 text-slate-500">
                {featuredPdf ? featuredPdf.title : 'Le téléchargement sera activé dès la publication du PDF.'}
              </p>
            </aside>
          </div>
          {featuredVideo && <p className="mt-3 text-sm font-semibold text-slate-700">{featuredVideo.title}</p>}
        </section>
      </div>
    </section>
  );
}