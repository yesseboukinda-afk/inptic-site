'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Search } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { isSuperAdminRole } from '@/lib/roles';

type Alumni = {
  id: string;
  nom: string;
  prenom: string;
  filiere: string;
  poste: string;
  entreprise: string;
  promotion: string;
  commentaire: string;
  photo: string;
  isOwner: boolean;
};

type AlumniDraft = Omit<Alumni, 'id' | 'isOwner'>;

type AuthUser = {
  id: string;
  email?: string;
  role: string;
};

const EMPTY_FORM = {
  nom: '',
  prenom: '',
  filiere: '',
  poste: '',
  entreprise: '',
  promotion: '',
  commentaire: '',
  photo: '',
};

export default function Alumni() {
  const { t } = useTranslation();

  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadingAlumni, setLoadingAlumni] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [localDraft, setLocalDraft] = useState<AlumniDraft | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [directoryQuery, setDirectoryQuery] = useState('');
  const [directorySearchBy, setDirectorySearchBy] = useState('all');
  const [directorySortBy, setDirectorySortBy] = useState('');
  const [directorySortDirection, setDirectorySortDirection] = useState<'asc' | 'desc'>('asc');

  const visibleAlumni = useMemo(() => {
    const query = directoryQuery.trim().toLocaleLowerCase();
    const fields: Record<string, (person: Alumni) => string> = {
      nom: (person) => `${person.prenom} ${person.nom}`,
      filiere: (person) => person.filiere,
      poste: (person) => person.poste,
      entreprise: (person) => person.entreprise,
      promotion: (person) => person.promotion,
    };
    const searchableFields = directorySearchBy === 'all'
      ? Object.keys(fields)
      : [directorySearchBy];
    const filtered = alumni.filter((person) =>
      !query || searchableFields.some((field) =>
        fields[field]?.(person).toLocaleLowerCase().includes(query),
      ),
    );

    if (!directorySortBy) return filtered;

    const sortField = fields[directorySortBy];
    if (!sortField) return filtered;

    return [...filtered].sort((first, second) => {
      const comparison = sortField(first).localeCompare(sortField(second), 'fr', {
        numeric: true,
        sensitivity: 'base',
      });
      return directorySortDirection === 'asc' ? comparison : -comparison;
    });
  }, [alumni, directoryQuery, directorySearchBy, directorySortBy, directorySortDirection]);

  useEffect(() => {
    const { data: { subscription } } = authClient.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ? {
        id: session.user.id,
        email: session.user.email,
        role: typeof session.user.app_metadata?.role === 'string' ? session.user.app_metadata.role : '',
      } : null);
      setAuthLoading(false);
      setIsEditing(false);
      setEditingProfileId(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAlumni() {
      setLoadingAlumni(true);
      setLoadError('');
      try {
        const response = await fetch('/api/alumni', { cache: 'no-store' });
        const payload = await response.json() as { data?: Alumni[]; error?: string };
        if (!response.ok) throw new Error(payload.error || 'Impossible de charger les anciens étudiants.');
        if (!Array.isArray(payload.data)) throw new Error('Réponse invalide du serveur Alumni.');
        if (active) setAlumni(payload.data);
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Impossible de charger les anciens étudiants.');
        }
      } finally {
        if (active) setLoadingAlumni(false);
      }
    }

    void loadAlumni();
    return () => {
      active = false;
    };
  }, [authUser?.id]);

  useEffect(() => {
    if (!authUser || loadingAlumni || alumni.some((person) => person.isOwner)) {
      setLocalDraft(null);
      return;
    }

    setLocalDraft(null);
    try {
      const cached = JSON.parse(localStorage.getItem('inptic_alumni') || '[]') as unknown;
      if (!Array.isArray(cached)) return;
      const draft = cached.find((item): item is AlumniDraft & { id: string } =>
        Boolean(
          item &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          item.id.startsWith('temp-') &&
          typeof item.nom === 'string' &&
          typeof item.prenom === 'string',
        ),
      );
      if (draft) {
        setLocalDraft({
          nom: draft.nom,
          prenom: draft.prenom,
          filiere: typeof draft.filiere === 'string' ? draft.filiere : '',
          poste: typeof draft.poste === 'string' ? draft.poste : '',
          entreprise: typeof draft.entreprise === 'string' ? draft.entreprise : '',
          promotion: typeof draft.promotion === 'string' ? draft.promotion : '',
          commentaire: typeof draft.commentaire === 'string' ? draft.commentaire : '',
          photo: typeof draft.photo === 'string' ? draft.photo : '',
        });
      }
    } catch {
      setLocalDraft(null);
    }
  }, [alumni, authUser, loadingAlumni]);

  const isSuperAdmin = isSuperAdminRole(authUser?.role);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La photo ne doit pas dépasser 5 Mo.');
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        photo: reader.result as string,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitted(false);

    const alumniInput = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      filiere: form.filiere.trim(),
      poste: form.poste.trim(),
      entreprise: form.entreprise.trim(),
      promotion: form.promotion,
      commentaire: form.commentaire.trim(),
      photo: form.photo,
    };

    try {
      const response = await fetch('/api/alumni', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...alumniInput,
          ...(isEditing && editingProfileId ? { id: editingProfileId } : {}),
        }),
      });
      const payload = await response.json() as { data?: Alumni; error?: string };
      if (!response.ok) throw new Error(payload.error || 'Impossible d’enregistrer le profil Alumni.');
      const savedProfile = payload.data;
      if (!savedProfile?.id) throw new Error('Le serveur n’a pas confirmé l’enregistrement du profil.');

      setAlumni((previous) => isEditing
        ? previous.map((person) => person.id === editingProfileId || (!editingProfileId && person.isOwner) ? savedProfile : person)
        : [savedProfile, ...previous]);
      setLocalDraft(null);
      setForm(EMPTY_FORM);
      setIsEditing(false);
      setEditingProfileId(null);
      setSubmitted(true);
      window.setTimeout(() => setSubmitted(false), 5000);
      window.setTimeout(() => {
        document.getElementById('anciens')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Impossible d’enregistrer le profil Alumni.');
    } finally {
      setSubmitting(false);
    }
  };

  const editProfile = (person: Alumni) => {
    setForm({
      nom: person.nom,
      prenom: person.prenom,
      filiere: person.filiere,
      poste: person.poste,
      entreprise: person.entreprise,
      promotion: person.promotion,
      commentaire: person.commentaire,
      photo: person.photo,
    });
    setIsEditing(true);
    setEditingProfileId(person.id);
    setSubmitted(false);
    setSubmitError('');
    document.getElementById('rejoindre')?.scrollIntoView({ behavior: 'smooth' });
  };

  const startNewProfile = () => {
    setForm(EMPTY_FORM);
    setIsEditing(false);
    setEditingProfileId(null);
    setSubmitError('');
    setSubmitted(false);
    document.getElementById('rejoindre')?.scrollIntoView({ behavior: 'smooth' });
  };

  const deleteProfile = async (person: Alumni) => {
    if (!window.confirm(`Supprimer définitivement le profil de ${person.prenom} ${person.nom} ?`)) return;
    setSubmitError('');
    try {
      const response = await fetch('/api/alumni', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: person.id }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Impossible de supprimer ce profil Alumni.');
      setAlumni((previous) => previous.filter((entry) => entry.id !== person.id));
      if (editingProfileId === person.id) {
        setForm(EMPTY_FORM);
        setIsEditing(false);
        setEditingProfileId(null);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Impossible de supprimer ce profil Alumni.');
      document.getElementById('rejoindre')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* ========================================================= */}
      {/* HERO */}
      {/* ========================================================= */}

      <section className="relative isolate overflow-hidden text-white">

        <img
          src="/banniere/1.webp"
          alt=""
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105"
          aria-hidden="true"
        />

        <div
          className="absolute inset-0 z-[1]"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">

          <img
            src="/logoinptic.png"
            alt="Logo INPTIC"
            className="h-9 w-auto object-contain object-left"
          />

          <h1 className="mt-3 max-w-3xl text-4xl font-black md:text-6xl">
            {t('pages.alumni')}
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            {t('pages.alumniIntro')}
          </p>

        </div>
      </section>

      {/* ========================================================= */}
      {/* NAVIGATION */}
      {/* ========================================================= */}

      <nav
        className="border-b border-slate-200 bg-white"
        aria-label={t('pages.alumni')}
      >
        <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 py-4 text-sm font-semibold text-slate-600 md:px-8">

          <a
            href="#rejoindre"
            className="whitespace-nowrap transition hover:text-blue-600"
          >
            Rejoindre le réseau
          </a>

          <a
            href="#services"
            className="whitespace-nowrap transition hover:text-blue-600"
          >
            {t('pages.services')}
          </a>

          <a
            href="#anciens"
            className="whitespace-nowrap transition hover:text-blue-600"
          >
            Nos Alumni
          </a>

          <a
            href="#evenements"
            className="whitespace-nowrap transition hover:text-blue-600"
          >
            {t('pages.events')}
          </a>

          <a
            href="#contact-alumni"
            className="whitespace-nowrap transition hover:text-blue-600"
          >
            {t('pages.contact')}
          </a>

        </div>
      </nav>

      {/* ========================================================= */}
      {/* INTRODUCTION */}
      {/* ========================================================= */}

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">

        <div className="grid gap-4 sm:grid-cols-3">

          {[
            ['01', t('pages.community'), t('pages.communityText')],
            ['02', t('pages.opportunities'), t('pages.opportunitiesText')],
            ['03', t('pages.commitment'), t('pages.commitmentText')],
          ].map(([number, title, text]) => (

            <div
              key={number}
              className="border-l-4 border-cyan-500 bg-white p-6 shadow-sm"
            >

              <p className="text-sm font-black text-cyan-600">
                {number}
              </p>

              <h2 className="mt-2 text-lg font-bold text-slate-900">
                {title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {text}
              </p>

            </div>

          ))}

        </div>

      </section>

      {/* ========================================================= */}
      {/* SERVICES */}
      {/* ========================================================= */}

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">

        <div
          id="services"
          className="mb-10 max-w-2xl scroll-mt-24"
        >

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
            {t('pages.network')}
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-900">
            {t('pages.networkTitle')}
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            {t('pages.networkText')}
          </p>

        </div>

        <div className="grid gap-8 md:grid-cols-3">

          {[
            {
              title: t('pages.keepContact'),
              text: t('pages.keepContactText'),
            },
            {
              title: t('pages.shareOpportunities'),
              text: t('pages.shareOpportunitiesText'),
            },
            {
              title: t('pages.supportStudents'),
              text: t('pages.supportStudentsText'),
            },
          ].map((item) => (

            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
            >

              <h2 className="text-xl font-bold text-slate-900">
                {item.title}
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                {item.text}
              </p>

            </article>

          ))}

        </div>

      </section>

      {/* ========================================================= */}
      {/* FORMULAIRE ALUMNI */}
      {/* ========================================================= */}

      <section
        id="rejoindre"
        className="scroll-mt-24 bg-slate-900 text-white"
      >

        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">

          <div className="mx-auto max-w-3xl text-center">

            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
              Rejoindre le réseau
            </p>

            <h2 className="mt-3 text-3xl font-black md:text-4xl">
              Devenez membre du réseau Alumni
            </h2>

            <p className="mt-5 leading-7 text-slate-300">
              Vous êtes un ancien étudiant de l'INPTIC ?
              Présentez votre parcours et rejoignez directement
              notre réseau d'anciens étudiants.
            </p>

          </div>

          {/* FORMULAIRE */}

          <div className="mx-auto mt-10 max-w-4xl rounded-2xl bg-white p-6 text-slate-900 shadow-2xl md:p-10">

                {submitted && (
                  <div
                    className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700"
                    role="status"
                  >
                    Votre profil Alumni a bien été enregistré dans l’annuaire.
                  </div>
                )}

                {authLoading ? (
              <p className="text-center text-slate-600" role="status">
                Vérification de votre session…
              </p>
            ) : !authUser ? (
              <div className="text-center">
                <p className="leading-7 text-slate-700">
                  Pour publier un profil partagé et pouvoir le modifier ensuite, connectez-vous
                  avec un compte INPTIC dont l’adresse e-mail a été vérifiée.
                </p>
                <a
                  href="/candidat"
                  className="mt-5 inline-flex rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  Créer un compte ou se connecter
                </a>
              </div>
            ) : loadingAlumni ? (
              <p className="text-center text-slate-600" role="status">
                Chargement de votre profil…
              </p>
            ) : !isSuperAdmin && alumni.some((person) => person.isOwner) && !isEditing ? (
              <div className="text-center">
                <p className="leading-7 text-slate-700">
                  Votre profil est publié dans l’annuaire. Utilisez le bouton « Modifier mon profil »
                  sur votre fiche pour le mettre à jour.
                </p>
              </div>
            ) : (
              <>
              {isSuperAdmin && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-violet-200 bg-violet-50 p-4">
                  <p className="text-sm font-semibold text-violet-900">
                    Administration de l’annuaire Alumni
                    {isEditing ? ' — modification d’un profil' : ' — création d’un profil'}
                  </p>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={startNewProfile}
                      className="rounded-lg border border-violet-300 px-3 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
                    >
                      Créer un autre profil
                    </button>
                  )}
                </div>
              )}

              {localDraft && !isEditing && (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p>
                    Un brouillon non synchronisé est conservé sur cet appareil. Vérifiez son contenu
                    avant de le publier avec votre compte.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setForm(localDraft);
                      setSubmitError('');
                    }}
                    className="mt-3 rounded-lg border border-amber-300 px-4 py-2 font-semibold transition hover:bg-amber-100"
                  >
                    Récupérer le brouillon de cet appareil
                  </button>
                </div>
              )}

              {submitError && (
              <p
                className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
                role="alert"
              >
                {submitError}
              </p>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >

              <div className="grid gap-6 md:grid-cols-2">

                {/* NOM */}

                <div>

                  <label
                    htmlFor="nom"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Nom *
                  </label>

                  <input
                    id="nom"
                    name="nom"
                    type="text"
                    value={form.nom}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    placeholder="Votre nom"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* PRENOM */}

                <div>

                  <label
                    htmlFor="prenom"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Prénom *
                  </label>

                  <input
                    id="prenom"
                    name="prenom"
                    type="text"
                    value={form.prenom}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    placeholder="Votre prénom"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* FILIERE */}

                <div>

                  <label
                    htmlFor="filiere"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Filière *
                  </label>

                  <select
                    id="filiere"
                    name="filiere"
                    value={form.filiere}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >

                    <option value="">
                      Sélectionnez votre filière
                    </option>

                    <option value="Télécommunications">
                      Télécommunications
                    </option>

                    <option value="Réseaux et Systèmes">
                      Réseaux et Systèmes
                    </option>

                    <option value="Informatique">
                      Informatique
                    </option>

                    <option value="Développement Web">
                      Développement Web
                    </option>

                    <option value="Cybersécurité">
                      Cybersécurité
                    </option>

                    <option value="Autre">
                      Autre
                    </option>

                  </select>

                </div>

                {/* PROMOTION */}

                <div>

                  <label
                    htmlFor="promotion"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Année de promotion *
                  </label>

                  <input
                    id="promotion"
                    name="promotion"
                    type="number"
                    min="1950"
                    max={new Date().getFullYear()}
                    value={form.promotion}
                    onChange={handleChange}
                    required
                    placeholder="Ex. 2022"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* POSTE */}

                <div>

                  <label
                    htmlFor="poste"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Poste actuel *
                  </label>

                  <input
                    id="poste"
                    name="poste"
                    type="text"
                    value={form.poste}
                    onChange={handleChange}
                    required
                    placeholder="Ex. Ingénieur réseaux"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* ENTREPRISE */}

                <div>

                  <label
                    htmlFor="entreprise"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Entreprise *
                  </label>

                  <input
                    id="entreprise"
                    name="entreprise"
                    type="text"
                    value={form.entreprise}
                    onChange={handleChange}
                    required
                    placeholder="Nom de votre entreprise"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* PHOTO */}

                <div className="md:col-span-2">

                  <label
                    htmlFor="photo"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Photo de profil
                  </label>

                  <input
                    id="photo"
                    name="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-600 hover:file:bg-blue-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Formats acceptés : JPG, PNG et WebP. Taille maximale : 5 Mo.
                  </p>

                  {form.photo && (
                    <div className="mt-5 flex items-center gap-4">

                      <img
                        src={form.photo}
                        alt="Aperçu de votre photo"
                        className="h-24 w-24 rounded-full object-cover ring-4 ring-slate-100"
                      />

                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          Aperçu de votre photo
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              photo: '',
                            }))
                          }
                          className="mt-1 text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Supprimer la photo
                        </button>
                      </div>

                    </div>
                  )}

                </div>

                {/* COMMENTAIRE */}

                <div className="md:col-span-2">

                  <label
                    htmlFor="commentaire"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Présentation / commentaire
                  </label>

                  <textarea
                    id="commentaire"
                    name="commentaire"
                    value={form.commentaire}
                    onChange={handleChange}
                    rows={5}
                    maxLength={500}
                    placeholder="Présentez votre parcours, votre expérience ou laissez un message à la communauté Alumni..."
                    className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-2 text-right text-xs text-slate-500">
                    {form.commentaire.length}/500 caractères
                  </p>

                </div>

              </div>

              {/* BOUTON */}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? 'Enregistrement…'
                  : isEditing
                    ? 'Enregistrer les modifications'
                    : 'Rejoindre le réseau Alumni'}
              </button>

              {isEditing && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setIsEditing(false);
                    setForm(EMPTY_FORM);
                    setSubmitError('');
                  }}
                  className="w-full rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Annuler les modifications
                </button>
              )}

            </form>
              </>
            )}

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* ANNUAIRE ALUMNI */}
      {/* ========================================================= */}

      <section
        id="anciens"
        className="scroll-mt-24 bg-white"
      >

        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">

          <div className="max-w-2xl">

            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
              Réseau Alumni
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-900">
              Nos anciens étudiants
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Découvrez les anciens étudiants de l'INPTIC,
              leurs parcours et leurs expériences professionnelles.
            </p>

          </div>

          {loadingAlumni ? (

            <p className="mt-10 text-center text-slate-500" role="status">
              Chargement de l’annuaire Alumni…
            </p>

          ) : loadError ? (

            <p className="mt-10 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              {loadError}
            </p>

          ) : alumni.length === 0 ? (

            <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">

              <p className="text-slate-500">
                Aucun Alumni n'est encore enregistré.
              </p>

              <a
                href="#rejoindre"
                className="mt-4 inline-flex rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Soyez le premier à vous inscrire
              </a>

            </div>

          ) : (

            <>
              <div className="alumni-directory-toolbar mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Rechercher un Alumni</span>
                  <Search
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    value={directoryQuery}
                    onChange={(event) => setDirectoryQuery(event.target.value)}
                    placeholder="Rechercher un Alumni"
                    className="alumni-directory-control w-full border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <label>
                    <span className="sr-only">Rechercher par</span>
                    <select
                      value={directorySearchBy}
                      onChange={(event) => setDirectorySearchBy(event.target.value)}
                      className="alumni-directory-control h-full min-h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 sm:w-auto"
                    >
                      <option value="all">Tous les champs</option>
                      <option value="nom">Nom</option>
                      <option value="filiere">Filière</option>
                      <option value="poste">Poste</option>
                      <option value="entreprise">Entreprise</option>
                      <option value="promotion">Promotion</option>
                    </select>
                  </label>

                  <label>
                    <span className="sr-only">Trier par</span>
                    <select
                      value={directorySortBy}
                      onChange={(event) => setDirectorySortBy(event.target.value)}
                      className="alumni-directory-control h-full min-h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 sm:w-auto"
                    >
                      <option value="">Ordre d’affichage</option>
                      <option value="nom">Nom</option>
                      <option value="promotion">Promotion</option>
                      <option value="filiere">Filière</option>
                      <option value="entreprise">Entreprise</option>
                    </select>
                  </label>

                  <label>
                    <span className="sr-only">Sens du tri</span>
                    <select
                      value={directorySortDirection}
                      onChange={(event) => setDirectorySortDirection(event.target.value as 'asc' | 'desc')}
                      className="alumni-directory-control h-full min-h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 sm:w-auto"
                    >
                      <option value="asc">Croissant</option>
                      <option value="desc">Décroissant</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setDirectoryQuery('');
                      setDirectorySearchBy('all');
                      setDirectorySortBy('');
                      setDirectorySortDirection('asc');
                    }}
                    className="alumni-directory-control inline-flex min-h-11 items-center justify-center gap-2 bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    <RotateCcw size={15} aria-hidden="true" />
                    Réinitialiser
                  </button>
                </div>
              </div>

              {visibleAlumni.length === 0 ? (
                <p className="mt-10 rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
                  Aucun Alumni ne correspond à votre recherche.
                </p>
              ) : (
                <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-4">
                  {visibleAlumni.map((person) => (
                    <article
                      key={person.id}
                      className="alumni-directory-card group mx-auto w-full max-w-64 text-center transition duration-200 hover:-translate-y-1"
                    >
                      {person.photo ? (
                        <img
                          src={person.photo}
                          alt={`Photo de ${person.prenom} ${person.nom}`}
                          className="alumni-directory-photo mx-auto aspect-square w-full max-w-40 object-cover shadow-sm transition group-hover:shadow-md"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="alumni-directory-photo mx-auto flex aspect-square w-full max-w-40 items-center justify-center bg-gradient-to-br from-blue-100 to-cyan-100 text-4xl font-black text-blue-700"
                          aria-label={`Aucune photo pour ${person.prenom} ${person.nom}`}
                        >
                          {person.prenom.charAt(0)}
                          {person.nom.charAt(0)}
                        </div>
                      )}

                      <div className="px-1 pt-4">
                        <h3 className="text-base font-bold leading-snug text-slate-900 sm:text-lg">
                          {person.prenom} {person.nom}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-slate-500">{person.filiere}</p>
                        <p className="mt-1 text-sm text-slate-500">{person.poste}</p>
                        <p className="mt-1 text-sm text-slate-500">{person.entreprise}</p>
                        <p className="mt-1 text-sm text-slate-500">Promotion {person.promotion}</p>

                        {person.commentaire && (
                          <div className="mt-4 border-t border-slate-200 pt-3 text-left">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Témoignage
                            </p>
                            <p className="mt-1 line-clamp-4 text-sm italic leading-5 text-slate-600">
                              « {person.commentaire} »
                            </p>
                          </div>
                        )}

                        {person.isOwner && (
                          <button
                            type="button"
                            onClick={() => editProfile(person)}
                            className="alumni-directory-control mt-4 w-full bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            Modifier mon profil
                          </button>
                        )}

                        {isSuperAdmin && (
                          <div className="mt-4 flex gap-2 border-t border-slate-200 pt-3">
                            <button
                              type="button"
                              onClick={() => editProfile(person)}
                              className="alumni-directory-control flex-1 border border-violet-200 px-2 py-2 text-xs font-semibold text-violet-800 transition hover:bg-violet-50"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteProfile(person)}
                              className="alumni-directory-control flex-1 border border-red-200 px-2 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                            >
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>

          )}

        </div>

      </section>

      {/* ========================================================= */}
      {/* EVENEMENTS */}
      {/* ========================================================= */}

      <section
        id="evenements"
        className="scroll-mt-24 bg-white"
      >

        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
            {t('pages.networkLife')}
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-900">
            {t('pages.meetings')}
          </h2>

          <div className="mt-8 grid gap-5 md:grid-cols-3">

            {[
              [
                t('pages.professionalMeetings'),
                t('pages.professionalMeetingsText'),
              ],
              [
                t('pages.mentoring'),
                t('pages.mentoringText'),
              ],
              [
                t('pages.testimonials'),
                t('pages.testimonialsText'),
              ],
            ].map(([title, text]) => (

              <article
                key={title}
                className="border border-slate-200 bg-slate-50 p-6"
              >

                <h3 className="text-lg font-bold text-slate-900">
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {text}
                </p>

              </article>

            ))}

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* CONTACT */}
      {/* ========================================================= */}

      <section
        id="contact-alumni"
        className="scroll-mt-24 bg-slate-50"
      >

        <div className="mx-auto max-w-4xl px-4 py-16 text-center md:px-8">

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
            {t('pages.activeCommunity')}
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-900">
            {t('pages.journeyContinues')}
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            {t('pages.journeyContinuesText')}
          </p>

          <a
            href="/contact"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            {t('pages.contactInptic')}
          </a>

        </div>

      </section>

      {/* ========================================================= */}
      {/* ACTUALITES */}
      {/* ========================================================= */}

      <section className="bg-white">

        <div className="mx-auto max-w-6xl px-4 py-10 text-center md:px-8">

          <p className="text-sm text-slate-600">
            {t('pages.latestText')}
          </p>

          <a
            href="/actualites"
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            {t('pages.allNews')}
          </a>

        </div>

      </section>

    </main>
  );
}
