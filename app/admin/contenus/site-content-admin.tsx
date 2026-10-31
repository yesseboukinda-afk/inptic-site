'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ImageUp, LoaderCircle, Pencil, Save, Trash2, X } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { isSuperAdminRole } from '@/lib/roles';
import { SITE_IMAGE_SLOTS, type PublicSiteContent, type SiteCertification, type SiteTrack, type SiteTraining } from '@/lib/site-content';
import { useRouter } from 'next/navigation';

type TrackForm = {
  name: string;
  presentation: string;
  opportunities: string;
};

type CertificationForm = {
  name: string;
  presentation: string;
  issuer: string;
  duration: string;
  website: string;
};

type TrainingForm = {
  name: string;
  category: SiteTraining['category'];
  trackId: string;
  presentation: string;
  opportunities: string;
};

const EMPTY_TRACK: TrackForm = { name: '', presentation: '', opportunities: '' };
const EMPTY_CERTIFICATION: CertificationForm = { name: '', presentation: '', issuer: '', duration: '', website: '' };
const EMPTY_TRAINING: TrainingForm = { name: '', category: 'qualifiante', trackId: '', presentation: '', opportunities: '' };

export default function SiteContentAdmin() {
  const router = useRouter();
  const [access, setAccess] = useState<'loading' | 'allowed' | 'unavailable'>('loading');
  const [content, setContent] = useState<PublicSiteContent>({ filieres: [], formations: [], certifications: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingTrack, setEditingTrack] = useState<string | null>(null);
  const [editingCertification, setEditingCertification] = useState<string | null>(null);
  const [editingTraining, setEditingTraining] = useState<string | null>(null);
  const [trackForm, setTrackForm] = useState<TrackForm>(EMPTY_TRACK);
  const [certificationForm, setCertificationForm] = useState<CertificationForm>(EMPTY_CERTIFICATION);
  const [trainingForm, setTrainingForm] = useState<TrainingForm>(EMPTY_TRAINING);
  const [imageSlot, setImageSlot] = useState<string>(SITE_IMAGE_SLOTS[0].path);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageVersion, setImageVersion] = useState(0);
  const [imageInputVersion, setImageInputVersion] = useState(0);

  const selectedImage = useMemo(
    () => SITE_IMAGE_SLOTS.find((slot) => slot.path === imageSlot) ?? SITE_IMAGE_SLOTS[0],
    [imageSlot],
  );

  useEffect(() => {
    let active = true;
    void authClient.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setAccess('unavailable');
        setError('Vérification de la session impossible. Reconnectez-vous puis réessayez.');
        return;
      }
      const session = data.session;
      if (!session) {
        router.replace('/candidat');
        return;
      }
      if (!isSuperAdminRole(session.user.app_metadata?.role)) {
        router.replace('/candidat');
        return;
      }
      setAccess('allowed');
    });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (access !== 'allowed') return;
    void loadContent();
  }, [access]);

  async function loadContent() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/site-content?manage=1', { cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Chargement des contenus impossible.');
      setContent(result.data as PublicSiteContent);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Chargement des contenus impossible.');
    } finally {
      setLoading(false);
    }
  }

  async function saveTrack(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        resource: 'filiere',
        name: trackForm.name,
        presentation: trackForm.presentation,
        opportunities: trackForm.opportunities.split('\n').map((item) => item.trim()).filter(Boolean),
        ...(editingTrack ? { id: editingTrack } : {}),
      };
      await sendContent(payload, editingTrack ? 'PATCH' : 'POST');
      setTrackForm(EMPTY_TRACK);
      setEditingTrack(null);
      setMessage(editingTrack ? 'La filière a été mise à jour.' : 'La filière a été créée.');
      await loadContent();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Enregistrement de la filière impossible.');
    } finally {
      setSaving(false);
    }
  }

  async function saveCertification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        resource: 'certification',
        ...certificationForm,
        ...(editingCertification ? { id: editingCertification } : {}),
      };
      await sendContent(payload, editingCertification ? 'PATCH' : 'POST');
      setCertificationForm(EMPTY_CERTIFICATION);
      setEditingCertification(null);
      setMessage(editingCertification ? 'La certification a été mise à jour.' : 'La certification a été créée.');
      await loadContent();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Enregistrement de la certification impossible.');
    } finally {
      setSaving(false);
    }
  }

  async function saveTraining(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        resource: 'formation',
        ...trainingForm,
        trackId: trainingForm.category === 'diplomante' ? trainingForm.trackId || null : null,
        opportunities: trainingForm.opportunities.split('\n').map((item) => item.trim()).filter(Boolean),
        ...(editingTraining ? { id: editingTraining } : {}),
      };
      await sendContent(payload, editingTraining ? 'PATCH' : 'POST');
      setTrainingForm(EMPTY_TRAINING);
      setEditingTraining(null);
      setMessage(editingTraining ? 'La formation a été mise à jour.' : 'La formation a été créée.');
      await loadContent();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Enregistrement de la formation impossible.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteContent(resource: 'filiere' | 'certification' | 'formation', item: SiteTrack | SiteCertification | SiteTraining) {
    if (!window.confirm(`Supprimer « ${item.name} » ? Cette action est définitive.`)) return;
    setDeleting(item.id);
    setError('');
    setMessage('');
    try {
      const response = await fetch(
        `/api/site-content/manage?resource=${resource}&id=${encodeURIComponent(item.id)}`,
        { method: 'DELETE', credentials: 'same-origin' },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Suppression impossible.');
      setMessage(
        resource === 'filiere' ? 'La filière a été supprimée.'
          : resource === 'certification' ? 'La certification a été supprimée.'
            : 'La formation a été supprimée.',
      );
      await loadContent();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Suppression impossible.');
    } finally {
      setDeleting('');
    }
  }

  async function saveImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!imageFile) {
      setError('Sélectionnez une image et vérifiez son aperçu avant de l’enregistrer.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const form = new FormData();
      form.set('slot', imageSlot);
      form.set('file', imageFile);
      const response = await fetch('/api/site-content/media', {
        method: 'POST',
        credentials: 'same-origin',
        body: form,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Remplacement de la photo impossible.');
      setImageFile(null);
      setImageInputVersion((version) => version + 1);
      setImageVersion(Date.now());
      setMessage(`La photo « ${selectedImage.label} » a bien été mise à jour.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Remplacement de la photo impossible.');
    } finally {
      setSaving(false);
    }
  }

  if (access === 'loading') {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-slate-50 px-4">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
          <LoaderCircle className="animate-spin" size={18} /> Vérification de l’accès…
        </p>
      </main>
    );
  }

  if (access === 'unavailable') {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-slate-50 px-4">
        <p role="alert" className="rounded-xl border border-red-200 bg-white p-5 text-sm text-red-800">{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl bg-slate-950 px-5 py-7 text-white shadow-lg sm:px-9">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-200 hover:text-white">
            <ArrowLeft size={16} /> Administration générale
          </Link>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">Contenus du site</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Remplacez les photos, gérez les filières et formations, et mettez à jour les certifications publiées.
          </p>
        </header>

        <div className="mt-5 space-y-3" aria-live="polite">
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
          {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</p>}
        </div>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="photos-title">
          <div className="mb-5">
            <h2 id="photos-title" className="text-xl font-black">Photos et illustrations</h2>
            <p className="mt-1 text-sm text-slate-600">Choisissez un emplacement, vérifiez l’aperçu, puis confirmez le remplacement.</p>
          </div>
          <form onSubmit={saveImage} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-800">
                Emplacement sur le site
                <select
                  value={imageSlot}
                  onChange={(event) => setImageSlot(event.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"
                >
                  {SITE_IMAGE_SLOTS.map((slot) => <option key={slot.path} value={slot.path}>{slot.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-800">
                Nouvelle photo (JPEG, PNG ou WebP, 10 Mo maximum)
                <input
                  key={imageInputVersion}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700"
                />
              </label>
              <p className="text-xs text-slate-500">Le fichier est enregistré dans le stockage persistant du site et remplace cette image sur les pages publiques.</p>
              <button
                type="submit"
                disabled={!imageFile || saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <LoaderCircle size={17} className="animate-spin" /> : <ImageUp size={17} />}
                Enregistrer la photo
              </button>
            </div>
            <div className="min-w-0">
              <p className="mb-2 text-sm font-semibold text-slate-800">Aperçu avant enregistrement</p>
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <img
                  src={imagePreview || `/${imageSlot}?version=${imageVersion}`}
                  alt={`Aperçu : ${selectedImage.label}`}
                  className="h-full w-full object-cover"
                />
                {imagePreview && <span className="absolute bottom-2 left-2 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-bold text-white">Nouvelle photo</span>}
              </div>
            </div>
          </form>
        </section>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="trainings-title">
          <div className="mb-5">
            <h2 id="trainings-title" className="text-xl font-black">Formations</h2>
            <p className="mt-1 text-sm text-slate-600">Ajoutez et modifiez les formations affichées sur la page Formations.</p>
          </div>
          <form onSubmit={saveTraining} className="grid gap-4 rounded-xl bg-slate-50 p-4 md:grid-cols-2">
            <h3 className="font-bold md:col-span-2">{editingTraining ? 'Modifier la formation' : 'Ajouter une formation'}</h3>
            <label className="block text-sm font-semibold">
              Nom
              <input required minLength={2} maxLength={180} value={trainingForm.name} onChange={(event) => setTrainingForm({ ...trainingForm, name: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
            </label>
            <label className="block text-sm font-semibold">
              Type
              <select value={trainingForm.category} onChange={(event) => setTrainingForm({ ...trainingForm, category: event.target.value as SiteTraining['category'] })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">
                <option value="qualifiante">Formation qualifiante</option>
                <option value="diplomante">Formation diplômante</option>
              </select>
            </label>
            {trainingForm.category === 'diplomante' && (
              <label className="block text-sm font-semibold md:col-span-2">
                Filière
                <select required value={trainingForm.trackId} onChange={(event) => setTrainingForm({ ...trainingForm, trackId: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">
                  <option value="">Choisir une filière</option>
                  {content.filieres.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}
                </select>
              </label>
            )}
            <label className="block text-sm font-semibold md:col-span-2">
              Présentation
              <textarea required minLength={10} maxLength={3000} rows={3} value={trainingForm.presentation} onChange={(event) => setTrainingForm({ ...trainingForm, presentation: event.target.value })} className="mt-1 block w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
            </label>
            <label className="block text-sm font-semibold md:col-span-2">
              Débouchés professionnels (un par ligne, facultatif)
              <textarea rows={3} value={trainingForm.opportunities} onChange={(event) => setTrainingForm({ ...trainingForm, opportunities: event.target.value })} className="mt-1 block w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
            </label>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                {editingTraining ? 'Enregistrer les modifications' : 'Créer la formation'}
              </button>
              {editingTraining && <button type="button" onClick={cancelTrainingEdit} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"><X size={16} /> Annuler</button>}
            </div>
          </form>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {loading && <LoadingMessage />}
            {!loading && content.formations.length === 0 && <EmptyMessage>Aucune formation enregistrée.</EmptyMessage>}
            {content.formations.map((training) => (
              <article key={training.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{training.category === 'diplomante' ? 'Diplômante' : 'Qualifiante'}{training.trackName ? ` · ${training.trackName}` : ''}</p>
                    <h3 className="mt-1 font-bold">{training.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{training.presentation}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => editTraining(training)} aria-label={`Modifier ${training.name}`} className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"><Pencil size={16} /></button>
                    <button type="button" disabled={deleting === training.id} onClick={() => void deleteContent('formation', training)} aria-label={`Supprimer ${training.name}`} className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-7 grid items-start gap-7 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="tracks-title">
            <div className="mb-5">
              <h2 id="tracks-title" className="text-xl font-black">Filières</h2>
              <p className="mt-1 text-sm text-slate-600">La présentation et les débouchés sont publiés sur la page Formations.</p>
            </div>
            <form onSubmit={saveTrack} className="space-y-4 rounded-xl bg-slate-50 p-4">
              <h3 className="font-bold">{editingTrack ? 'Modifier la filière' : 'Ajouter une filière'}</h3>
              <label className="block text-sm font-semibold">
                Nom
                <input required minLength={2} maxLength={140} value={trackForm.name} onChange={(event) => setTrackForm({ ...trackForm, name: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
              </label>
              <label className="block text-sm font-semibold">
                Présentation
                <textarea required minLength={10} maxLength={3000} rows={3} value={trackForm.presentation} onChange={(event) => setTrackForm({ ...trackForm, presentation: event.target.value })} className="mt-1 block w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
              </label>
              <label className="block text-sm font-semibold">
                Débouchés professionnels (un par ligne)
                <textarea required rows={4} value={trackForm.opportunities} onChange={(event) => setTrackForm({ ...trackForm, opportunities: event.target.value })} className="mt-1 block w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
              </label>
              <div className="flex flex-wrap gap-2">
                <button disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                  {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingTrack ? 'Enregistrer les modifications' : 'Créer la filière'}
                </button>
                {editingTrack && <button type="button" onClick={cancelTrackEdit} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"><X size={16} /> Annuler</button>}
              </div>
            </form>
            <div className="mt-5 space-y-3">
              {loading && <LoadingMessage />}
              {!loading && content.filieres.length === 0 && <EmptyMessage>Les filières apparaîtront ici après le chargement.</EmptyMessage>}
              {content.filieres.map((track) => (
                <article key={track.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">{track.name}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{track.presentation}</p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">Débouchés</p>
                      <ul className="mt-1 list-inside list-disc text-sm text-slate-600">{track.opportunities.map((opportunity) => <li key={opportunity}>{opportunity}</li>)}</ul>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => editTrack(track)} aria-label={`Modifier ${track.name}`} className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"><Pencil size={16} /></button>
                      <button type="button" disabled={deleting === track.id} onClick={() => void deleteContent('filiere', track)} aria-label={`Supprimer ${track.name}`} className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="certifications-title">
            <div className="mb-5">
              <h2 id="certifications-title" className="text-xl font-black">Certifications</h2>
              <p className="mt-1 text-sm text-slate-600">Les informations enregistrées sont publiées sur la page Certifications.</p>
            </div>
            <form onSubmit={saveCertification} className="space-y-4 rounded-xl bg-slate-50 p-4">
              <h3 className="font-bold">{editingCertification ? 'Modifier la certification' : 'Ajouter une certification'}</h3>
              <label className="block text-sm font-semibold">
                Nom
                <input required minLength={2} maxLength={180} value={certificationForm.name} onChange={(event) => setCertificationForm({ ...certificationForm, name: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
              </label>
              <label className="block text-sm font-semibold">
                Présentation
                <textarea required minLength={10} maxLength={3000} rows={3} value={certificationForm.presentation} onChange={(event) => setCertificationForm({ ...certificationForm, presentation: event.target.value })} className="mt-1 block w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Organisme (facultatif)
                  <input maxLength={180} value={certificationForm.issuer} onChange={(event) => setCertificationForm({ ...certificationForm, issuer: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
                </label>
                <label className="block text-sm font-semibold">
                  Durée / validité (facultatif)
                  <input maxLength={120} value={certificationForm.duration} onChange={(event) => setCertificationForm({ ...certificationForm, duration: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
                </label>
              </div>
              <label className="block text-sm font-semibold">
                Site officiel (facultatif)
                <input type="url" maxLength={500} value={certificationForm.website} onChange={(event) => setCertificationForm({ ...certificationForm, website: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
              </label>
              <div className="flex flex-wrap gap-2">
                <button disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                  {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingCertification ? 'Enregistrer les modifications' : 'Créer la certification'}
                </button>
                {editingCertification && <button type="button" onClick={cancelCertificationEdit} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"><X size={16} /> Annuler</button>}
              </div>
            </form>
            <div className="mt-5 space-y-3">
              {loading && <LoadingMessage />}
              {!loading && content.certifications.length === 0 && <EmptyMessage>Les certifications apparaîtront ici après le chargement.</EmptyMessage>}
              {content.certifications.map((certification) => (
                <article key={certification.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">{certification.name}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{certification.presentation}</p>
                      {(certification.issuer || certification.duration) && <p className="mt-2 text-xs text-slate-500">{[certification.issuer, certification.duration].filter(Boolean).join(' · ')}</p>}
                      {certification.website && <a href={certification.website} target="_blank" rel="noreferrer" className="mt-2 inline-block break-all text-xs font-semibold text-blue-700 underline">Site officiel</a>}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => editCertification(certification)} aria-label={`Modifier ${certification.name}`} className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"><Pencil size={16} /></button>
                      <button type="button" disabled={deleting === certification.id} onClick={() => void deleteContent('certification', certification)} aria-label={`Supprimer ${certification.name}`} className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );

  function cancelTrackEdit() {
    setEditingTrack(null);
    setTrackForm(EMPTY_TRACK);
  }

  function cancelCertificationEdit() {
    setEditingCertification(null);
    setCertificationForm(EMPTY_CERTIFICATION);
  }

  function cancelTrainingEdit() {
    setEditingTraining(null);
    setTrainingForm(EMPTY_TRAINING);
  }

  function editTrack(track: SiteTrack) {
    setEditingTrack(track.id);
    setTrackForm({
      name: track.name,
      presentation: track.presentation,
      opportunities: track.opportunities.join('\n'),
    });
  }

  function editCertification(certification: SiteCertification) {
    setEditingCertification(certification.id);
    setCertificationForm({
      name: certification.name,
      presentation: certification.presentation,
      issuer: certification.issuer ?? '',
      duration: certification.duration ?? '',
      website: certification.website ?? '',
    });
  }

  function editTraining(training: SiteTraining) {
    setEditingTraining(training.id);
    setTrainingForm({
      name: training.name,
      category: training.category,
      trackId: training.trackId ?? '',
      presentation: training.presentation,
      opportunities: training.opportunities.join('\n'),
    });
  }
}

async function sendContent(payload: Record<string, unknown>, method: 'POST' | 'PATCH') {
  const response = await fetch('/api/site-content/manage', {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Enregistrement du contenu impossible.');
  return result;
}

function LoadingMessage() {
  return <p className="inline-flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin" /> Chargement des contenus…</p>;
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-500">{children}</p>;
}
