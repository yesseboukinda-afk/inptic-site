'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, BookOpen, Heart, LoaderCircle, ThumbsUp, Trash2, Upload } from 'lucide-react';
import LibraryBookCard, { type LibraryBookCardData } from '@/components/library/LibraryBookCard';

type PersonalBooks = {
  collection: LibraryBookCardData[];
  favorites: LibraryBookCardData[];
  likes: LibraryBookCardData[];
};

type PersonalProfile = {
  display_name: string;
  bio: string;
  birth_date: string | null;
  has_avatar: boolean;
  email: string;
};

type Tab = keyof PersonalBooks;

const tabLabels: Record<Tab, string> = {
  collection: 'Ma collection',
  favorites: 'Mes favoris',
  likes: 'Mes mentions J’aime',
};

export default function PersonalLibraryPage() {
  const [books, setBooks] = useState<PersonalBooks>({ collection: [], favorites: [], likes: [] });
  const [profile, setProfile] = useState<PersonalProfile>({
    display_name: '', bio: '', birth_date: null, has_avatar: false, email: '',
  });
  const [tab, setTab] = useState<Tab>('collection');
  const [busy, setBusy] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadBooks = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const [booksResponse, profileResponse] = await Promise.all([
        fetch('/api/library/my-books', { cache: 'no-store' }),
        fetch('/api/library/profile', { cache: 'no-store' }),
      ]);
      const [data, profileData] = await Promise.all([
        booksResponse.json().catch(() => ({})),
        profileResponse.json().catch(() => ({})),
      ]);
      if (!booksResponse.ok) throw new Error(data.error || 'Impossible de charger votre bibliothèque.');
      if (!profileResponse.ok) throw new Error(profileData.error || 'Impossible de charger votre profil.');
      setBooks(data as PersonalBooks);
      setProfile(profileData.profile);
      setAvatarVersion(Date.now());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger votre bibliothèque.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void loadBooks(); }, [loadBooks]);

  const uploadBook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setUploading(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/library/my-books', { method: 'POST', body: new FormData(form) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible de publier ce livre.');
      form.reset();
      setNotice('Votre livre a été ajouté à votre collection et au catalogue.');
      setTab('collection');
      await loadBooks();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Impossible de publier ce livre.');
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSavingProfile(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/library/profile', { method: 'POST', body: new FormData(form) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible d’enregistrer votre profil.');
      setNotice('Votre profil a été enregistré.');
      await loadBooks();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Impossible d’enregistrer votre profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const removeBook = async (book: LibraryBookCardData) => {
    if (!window.confirm(`Retirer « ${book.title} » de votre collection ?`)) return;
    setError('');
    try {
      const response = await fetch(`/api/library/my-books?id=${encodeURIComponent(book.id)}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible de retirer ce livre.');
      await loadBooks();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Impossible de retirer ce livre.');
    }
  };

  const toggleLike = async (book: LibraryBookCardData) => {
    try {
      const response = await fetch('/api/library/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', bookId: book.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible de mettre à jour le livre.');
      await loadBooks();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Impossible de mettre à jour le livre.');
    }
  };

  const currentBooks = books[tab];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
          <Link href="/bibliotheque" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><ArrowLeft size={16} aria-hidden="true" /> Catalogue</Link>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">Mon espace bibliothèque</h1>
          <p className="mt-2 text-sm text-slate-300">Retrouvez vos ouvrages, vos favoris et votre progression de lecture.</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-8">
        <section>
          <div className="flex flex-wrap gap-2 border-b border-slate-200">
            {(Object.keys(tabLabels) as Tab[]).map((value) => (
              <button key={value} type="button" onClick={() => setTab(value)} className={`border-b-2 px-4 py-3 text-sm font-bold ${tab === value ? 'border-cyan-800 text-cyan-900' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
                {value === 'collection' ? <BookOpen size={15} className="mr-1 inline" aria-hidden="true" /> : value === 'favorites' ? <Heart size={15} className="mr-1 inline" aria-hidden="true" /> : <ThumbsUp size={15} className="mr-1 inline" aria-hidden="true" />}
                {tabLabels[value]} ({books[value].length})
              </button>
            ))}
          </div>
          {error && <p role="alert" className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
          {busy ? (
            <div className="grid min-h-48 place-items-center"><LoaderCircle size={28} className="animate-spin text-cyan-800" aria-label="Chargement" /></div>
          ) : currentBooks.length ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {currentBooks.map((book) => (
                <div key={book.id} className="relative">
                  <LibraryBookCard
                    book={book}
                    showCollectionAction={tab !== 'collection'}
                    onLike={(item) => void toggleLike(item)}
                  />
                  {tab === 'collection' && (
                    <button type="button" onClick={() => void removeBook(book)} aria-label={`Retirer ${book.title} de ma collection`} className="absolute right-2 top-2 bg-white p-2 text-slate-600 shadow hover:text-red-700">
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 border border-dashed border-slate-300 bg-white p-10 text-center">
              <BookOpen size={32} className="mx-auto text-slate-400" aria-hidden="true" />
              <p className="mt-3 text-sm text-slate-600">Cette liste est encore vide.</p>
              <Link href="/bibliotheque" className="mt-4 inline-flex text-sm font-bold text-cyan-800 hover:underline">Explorer les ouvrages</Link>
            </div>
          )}
        </section>

        <aside className="h-fit space-y-8 border border-slate-200 bg-white p-5 shadow-sm">
          {notice && <p role="status" className="mt-4 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
          <section>
            <h2 className="text-lg font-bold">Mon profil</h2>
            <p className="mt-1 text-sm text-slate-600">{profile.email}</p>
            <form key={`${profile.email}-${profile.display_name}-${profile.birth_date}-${profile.bio}`} onSubmit={saveProfile} className="mt-4 space-y-3">
              {profile.has_avatar && <img src={`/api/library/profile/avatar?version=${avatarVersion}`} alt="Votre photo de profil" className="h-16 w-16 object-cover" />}
              <label className="block text-xs font-semibold text-slate-700">Nom affiché<input name="displayName" defaultValue={profile.display_name} maxLength={160} className="mt-1 min-h-10 w-full border border-slate-300 px-3 text-sm" /></label>
              <label className="block text-xs font-semibold text-slate-700">Date de naissance<input name="birthDate" type="date" defaultValue={profile.birth_date?.slice(0, 10) || ''} className="mt-1 min-h-10 w-full border border-slate-300 px-3 text-sm" /></label>
              <label className="block text-xs font-semibold text-slate-700">Bio<textarea name="bio" rows={3} maxLength={2000} defaultValue={profile.bio} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="block text-xs font-semibold text-slate-700">Photo (JPG, PNG, WebP · 5 Mo max)<input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-xs" /></label>
              {profile.has_avatar && <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" name="removeAvatar" value="true" /> Retirer la photo actuelle</label>}
              <button type="submit" disabled={savingProfile} className="inline-flex min-h-10 w-full items-center justify-center gap-2 border border-slate-300 px-4 text-sm font-bold hover:bg-slate-50 disabled:opacity-50">
                {savingProfile ? <LoaderCircle size={15} className="animate-spin" /> : null}
                Enregistrer mon profil
              </button>
              <Link href="/candidat" className="block text-center text-xs font-semibold text-cyan-800 hover:underline">Paramètres du compte et sécurité</Link>
            </form>
          </section>

          <section className="border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold">Partager un ouvrage</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Les livres PDF publiés peuvent être consultés par toute la communauté.</p>
          </section>
          <form onSubmit={uploadBook} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">Titre<input name="title" required maxLength={300} className="mt-1 min-h-10 w-full border border-slate-300 px-3 text-sm" /></label>
            <label className="block text-xs font-semibold text-slate-700">Auteur<input name="author" maxLength={200} className="mt-1 min-h-10 w-full border border-slate-300 px-3 text-sm" /></label>
            <label className="block text-xs font-semibold text-slate-700">Catégorie<input name="category" maxLength={120} className="mt-1 min-h-10 w-full border border-slate-300 px-3 text-sm" /></label>
            <label className="block text-xs font-semibold text-slate-700">Langue<input name="language" maxLength={80} className="mt-1 min-h-10 w-full border border-slate-300 px-3 text-sm" /></label>
            <label className="block text-xs font-semibold text-slate-700">Description<textarea name="description" rows={3} maxLength={12000} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="block text-xs font-semibold text-slate-700">Fichier PDF (25 Mo maximum)<input type="file" name="file" accept="application/pdf,.pdf" required className="mt-1 block w-full text-xs" /></label>
            <button type="submit" disabled={uploading} className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-cyan-800 px-4 text-sm font-bold text-white hover:bg-cyan-900 disabled:opacity-50">
              {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} aria-hidden="true" />}
              {uploading ? 'Publication…' : 'Publier un livre'}
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}
