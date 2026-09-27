'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Facebook, Link2, Megaphone, MessageCircle, Pencil, Plus, Send, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Publication = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  publishedAt: string | null;
  createdAt: string | null;
};

type PublicationForm = {
  title: string;
  excerpt: string;
  category: string;
  status: 'draft' | 'published';
};

const emptyForm: PublicationForm = { title: '', excerpt: '', category: 'Annonce', status: 'draft' };

const formatDate = (value: string | null) => value
  ? new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  : 'Brouillon';

export default function AnnoncesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PublicationForm>(emptyForm);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const loadPublications = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/news?manage=1', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Impossible de charger les publications.');
      setPublications(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible de charger les publications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const verifySession = async () => {
      const client = supabase;
      if (!client) {
        router.replace('/candidat');
        return;
      }
      const { data } = await client.auth.getSession();
      const session = data.session;
      if (!session) {
        router.replace('/candidat');
        return;
      }
      const response = await fetch('/api/news?manage=1', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({}));
      if (!active) return;
      if (response.status === 401) {
        router.replace('/candidat');
        return;
      }
      if (response.status === 403) {
        setCheckingRole(false);
        setMessage('Cet espace est réservé au directeur général et au responsable de la communication.');
        return;
      }
      if (!response.ok) {
        setCheckingRole(false);
        setMessage(result.error || 'Le service de publication est indisponible.');
        return;
      }
      setAccessToken(session.access_token);
      setAuthorized(true);
      setPublications(Array.isArray(result.data) ? result.data : []);
      setCheckingRole(false);
    };
    void verifySession();
    return () => { active = false; };
  }, [router]);

  const beginCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage('');
    setIsComposerOpen(true);
  };

  const beginEdit = (publication: Publication) => {
    setEditingId(publication.id);
    setForm({
      title: publication.title,
      excerpt: publication.excerpt,
      category: publication.category,
      status: publication.publishedAt ? 'published' : 'draft',
    });
    setMessage('');
    setIsComposerOpen(true);
  };

  const savePublication = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const status = submitter?.value === 'published' ? 'published' : 'draft';
    const publicationForm = { ...form, status };
    setIsSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/news', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(editingId ? { id: editingId, publication: publicationForm } : publicationForm),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'La publication n’a pas pu être enregistrée.');
      setIsComposerOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      setMessage(status === 'published' ? 'Publication enregistrée.' : 'Brouillon enregistré.');
      await loadPublications(accessToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur lors de l’enregistrement.');
    } finally {
      setIsSaving(false);
    }
  };

  const getShareUrl = (publication: Publication) => `${window.location.origin}/actualites#${encodeURIComponent(publication.slug)}`;
  const sharePublication = async (publication: Publication, platform: 'whatsapp' | 'facebook' | 'linkedin' | 'x' | 'copy') => {
    const url = getShareUrl(publication);
    const text = `${publication.title} — ${url}`;
    const destinations = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(publication.title)}&url=${encodeURIComponent(url)}`,
    };
    if (platform === 'copy') {
      await navigator.clipboard.writeText(url);
      setMessage('Lien de l’annonce copié.');
      return;
    }
    window.open(destinations[platform], '_blank', 'noopener,noreferrer');
  };

  if (checkingRole) {
    return <main className="grid min-h-[60vh] place-items-center bg-slate-50 text-slate-600">Vérification de votre accès…</main>;
  }

  if (!authorized) {
    return (
      <main className="min-h-[60vh] bg-slate-50 px-4 py-20">
        <section className="mx-auto max-w-xl border border-slate-200 bg-white p-8 text-center">
          <Megaphone className="mx-auto text-blue-700" size={30} />
          <h1 className="mt-4 text-2xl font-bold text-slate-950">Espace annonces</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{message || 'Connectez-vous avec le compte du directeur général ou du responsable communication pour gérer les publications.'}</p>
          <button type="button" onClick={() => router.push('/candidat')} className="mt-6 bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">Aller à la connexion</button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-5 px-4 py-10 md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">INPTIC · Communication</p>
            <h1 className="mt-2 text-3xl font-black">Publications</h1>
            <p className="mt-2 text-sm text-slate-600">Rédigez, publiez et partagez les annonces de l’Institut.</p>
          </div>
          <button type="button" onClick={beginCreate} className="inline-flex items-center gap-2 bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800"><Plus size={17} />Nouvelle publication</button>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Liste des publications" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Toutes les annonces</h2>
            <button type="button" onClick={() => loadPublications(accessToken)} className="text-sm font-semibold text-blue-700 hover:text-blue-900">Actualiser</button>
          </div>
          {message && !isComposerOpen && <p role="status" className="border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{message}</p>}
          {isLoading ? <p className="py-10 text-center text-sm text-slate-500">Chargement des publications…</p> : publications.length === 0 ? (
            <div className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <Megaphone className="mx-auto text-slate-400" size={28} />
              <p className="mt-3 font-semibold">Aucune publication pour l’instant</p>
              <p className="mt-1 text-sm text-slate-500">Les annonces enregistrées apparaîtront ici.</p>
            </div>
          ) : publications.map((publication) => (
            <article key={publication.id} className="border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="bg-slate-100 px-2 py-1 font-semibold text-slate-700">{publication.category}</span>
                    <span className={publication.publishedAt ? 'bg-emerald-50 px-2 py-1 font-semibold text-emerald-800' : 'bg-amber-50 px-2 py-1 font-semibold text-amber-800'}>{publication.publishedAt ? 'Publiée' : 'Brouillon'}</span>
                    <span className="text-slate-500">{formatDate(publication.publishedAt || publication.createdAt)}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold">{publication.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{publication.excerpt}</p>
                </div>
                <button type="button" onClick={() => beginEdit(publication)} aria-label={`Modifier ${publication.title}`} className="inline-flex shrink-0 items-center gap-2 border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"><Pencil size={15} />Modifier</button>
              </div>
              {publication.publishedAt && <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button onClick={() => void sharePublication(publication, 'whatsapp')} className="inline-flex items-center gap-2 border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"><MessageCircle size={15} />WhatsApp</button>
                <button onClick={() => void sharePublication(publication, 'facebook')} className="inline-flex items-center gap-2 border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"><Facebook size={15} />Facebook</button>
                <button onClick={() => void sharePublication(publication, 'linkedin')} className="border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50">LinkedIn</button>
                <button onClick={() => void sharePublication(publication, 'x')} className="border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50">X</button>
                <button onClick={() => void sharePublication(publication, 'copy')} className="inline-flex items-center gap-2 border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"><Link2 size={15} />Copier le lien</button>
              </div>}
            </article>
          ))}
        </section>

        <aside className="self-start border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2"><Send size={17} className="text-blue-700" /><h2 className="font-bold">Canaux de partage</h2></div>
          <p className="mt-3 text-sm leading-6 text-slate-600">Le partage ouvre les plateformes avec un lien et un texte préremplis. La publication sur les comptes sociaux reste à confirmer par leur interface.</p>
          <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">La connexion des comptes officiels et la publication automatique nécessitent des accès API propres à chaque plateforme.</p>
        </aside>
      </div>

      {isComposerOpen && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="composer-title">
        <section className="my-8 grid max-h-[90vh] w-full max-w-5xl overflow-hidden bg-white shadow-2xl md:grid-cols-2">
          <form onSubmit={savePublication} className="overflow-y-auto p-6 md:p-8">
            <header className="mb-6 flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Éditeur d’annonce</p><h2 id="composer-title" className="mt-1 text-2xl font-black">{editingId ? 'Modifier la publication' : 'Nouvelle publication'}</h2></div>
              <button type="button" onClick={() => setIsComposerOpen(false)} aria-label="Fermer l’éditeur" className="p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </header>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Titre</span><input required maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full border border-slate-300 p-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Ex. Journée portes ouvertes" /></label>
            <label className="mt-4 block"><span className="mb-2 block text-sm font-semibold">Catégorie</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="w-full border border-slate-300 bg-white p-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"><option>Annonce</option><option>Événement</option><option>Concours</option><option>Communiqué</option><option>Vie étudiante</option></select></label>
            <label className="mt-4 block"><span className="mb-2 block text-sm font-semibold">Texte de l’annonce</span><textarea required maxLength={5000} rows={10} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} className="w-full resize-y border border-slate-300 p-3 text-sm leading-6 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Informations, date, lieu et modalités…" /><span className="mt-1 block text-right text-xs text-slate-500">{form.excerpt.length}/5000</span></label>
            {message && <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{message}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="submit" name="status" value="draft" disabled={isSaving} className="border border-slate-300 px-4 py-3 text-sm font-bold hover:bg-slate-50 disabled:opacity-50">{isSaving ? 'Enregistrement…' : 'Enregistrer brouillon'}</button>
              <button type="submit" name="status" value="published" disabled={isSaving} className="bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50">{isSaving ? 'Enregistrement…' : 'Publier'}</button>
            </div>
          </form>
          <div className="overflow-y-auto border-t border-slate-200 bg-slate-50 p-6 md:border-l md:border-t-0 md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Aperçu</p>
            <article className="mt-4 border border-slate-200 bg-white p-5">
              <span className="bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">{form.category}</span>
              <h3 className="mt-4 text-xl font-black">{form.title || 'Titre de l’annonce'}</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{form.excerpt || 'Le texte de votre annonce apparaîtra ici.'}</p>
            </article>
            <p className="mt-4 text-xs leading-5 text-slate-500">Le contenu publié sera disponible dans Actualités après publication depuis le CMS.</p>
          </div>
        </section>
      </div>}
    </main>
  );
}
