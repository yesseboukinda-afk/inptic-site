'use client';

import React, { useEffect, useRef, useState } from 'react';

/* -------------------------------------------------------------------------- */
/*  Données du formulaire papier                                              */
/* -------------------------------------------------------------------------- */

const FILIERES_INITIALE = [
  'Licence Professionnelle Réseaux et Télécoms',
  'Licence Professionnelle Administration Sécurité des Réseaux',
  'Licence Professionnelle Développement des Applications Reparties',
  "Licence Professionnelle Systèmes d'Information et Bases de Données",
  'Licence Professionnelle Communication et Marketing Digital',
  'Licence Professionnelle Webmastering',
  'Licence Professionnelle Techniques de Commercialisation',
  'Licence Professionnelle Technologie Audiovisuelle',
  'Licence Professionnelle Ingénierie et Maintenance des Equipements Audiovisuels',
];

const FILIERES_CONTINUE = [
  'Licence Professionnelle Réseaux et Télécoms',
  'Licence Professionnelle Administration Sécurité des Réseaux',
  'Licence Professionnelle Développement des Applications Reparties',
  "Licence Professionnelle Systèmes d'Information et Bases de Données",
  'Licence Professionnelle Communication et Marketing Digital',
  'Licence Professionnelle Webmastering',
  'Licence Professionnelle Intégration des Contenus Multimédias',
];

const PIECES = [
  'Formulaire à remplir',
  'Une copie certifiée conforme du baccalauréat ou attestation',
  'Une copie légalisée du relevé de note du bac',
  'Deux (2) photos d’identité couleur sur ce dossier',
  'Une enveloppe A4 imprimée INPTIC 1000 Francs CFA',
  'Justification du paiement des 20.000F CFA des frais de dossier',
];

const MODALITES = [
  'Le recrutement se fait sur concours en formation initiale et sur dossier en continue ;',
  'Le concours sera organisé à Libreville selon la décision ministérielle ;',
  'Remplissez ce dossier avec précision et concision ;',
  'Mettez à l’intérieur les documents demandés que vous avez cochés ;',
  'Le dépôt de dossier se fait à l’institut aux dates et heures indiquées.',
];

const FRAIS_DOSSIER_CONTINUE = '20 000 FCFA';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface CursusRow {
  annee: string;
  etablissement: string;
  ville: string;
  classe: string;
  diplome: string;
}

export interface CandidatureValues {
  filieresInitiale: string[];
  filieresContinue: string[];
  nom: string;
  prenoms: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: 'gabonaise' | 'autre';
  nationaliteAutre: string;
  adressePostale: string;
  quartier: string;
  ville: string;
  pays: string;
  telephone1: string;
  telephone2: string;
  telephone3: string;
  email: string;
  baccalaureat: string;
  anneeBac: string;
  cursus: CursusRow[];
  niveauInformatique: '' | 'faible' | 'moyen' | 'suffisant';
  urgenceNom: string;
  urgenceProfession: string;
  urgenceAdresse: string;
  urgenceVille: string;
  urgencePays: string;
  urgenceTelephone: string;
  urgenceFax: string;
  urgenceEmail: string;
  financeur: '' | 'parents' | 'etat' | 'organisme' | 'autre';
  financeurPrecision: string;
  financeurNom: string;
  financeurVille: string;
  financeurPays: string;
  financeurTelephone: string;
  financeurEmail: string;
  formationContinueSiEchec: '' | 'oui' | 'non';
  pieces: string[];
  faitA: string;
  faitLe: string;
  certifie: boolean;
}

interface Props {
  /** Session affichée dans le titre, ex. « 2026 - 2027 ». */
  session?: string;
  /** Logo INPTIC (chemin public, ex. « /logo-inptic.png »). */
  logoSrc?: string;
  submitDisabled?: boolean;
  initialValues?: Partial<CandidatureValues>;
  lockEmail?: boolean;
  /** Appelé à l'envoi. Lancer une erreur affiche un message d'échec. */
  onSubmit?: (values: CandidatureValues, photo: File | null) => void | Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*  Petits composants                                                         */
/* -------------------------------------------------------------------------- */

const inputCls =
  'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ' +
  'focus:border-[#2f6db5] focus:outline-none focus:ring-2 focus:ring-[#2f6db5]/30 ' +
  'aria-[invalid=true]:border-red-500';

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="rounded-t-xl border-b-2 border-[#c9a227] bg-[#14306b] px-5 py-3">
        <h2 className="text-sm font-bold tracking-wide text-white">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-blue-100">{hint}</p>}
      </header>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  error,
  className = '',
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>
      <span>
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs font-normal text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

function CheckItem({
  checked,
  onChange,
  children,
  type = 'checkbox',
  name,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
  type?: 'checkbox' | 'radio';
  name?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 text-sm text-slate-800 hover:bg-[#e8f1fb]">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#14306b]"
      />
      <span>{children}</span>
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*  Composant principal                                                       */
/* -------------------------------------------------------------------------- */

function buildInitialValues(): CandidatureValues {
  return {
    filieresInitiale: [],
    filieresContinue: [],
    nom: '',
    prenoms: '',
    dateNaissance: '',
    lieuNaissance: '',
    nationalite: 'gabonaise',
    nationaliteAutre: '',
    adressePostale: '',
    quartier: '',
    ville: '',
    pays: 'Gabon',
    telephone1: '',
    telephone2: '',
    telephone3: '',
    email: '',
    baccalaureat: '',
    anneeBac: '',
    cursus: Array.from({ length: 5 }, () => ({
      annee: '',
      etablissement: '',
      ville: '',
      classe: '',
      diplome: '',
    })),
    niveauInformatique: '',
    urgenceNom: '',
    urgenceProfession: '',
    urgenceAdresse: '',
    urgenceVille: '',
    urgencePays: '',
    urgenceTelephone: '',
    urgenceFax: '',
    urgenceEmail: '',
    financeur: '',
    financeurPrecision: '',
    financeurNom: '',
    financeurVille: '',
    financeurPays: '',
    financeurTelephone: '',
    financeurEmail: '',
    formationContinueSiEchec: '',
    pieces: [],
    faitA: '',
    faitLe: '',
    certifie: false,
  };
}

function validate(v: CandidatureValues): Record<string, string> {
  const e: Record<string, string> = {};
  const req = 'Champ obligatoire';

  if (v.filieresInitiale.length + v.filieresContinue.length === 0)
    e.filieres = 'Choisissez au moins une filière.';
  if (!v.nom.trim()) e.nom = req;
  if (!v.prenoms.trim()) e.prenoms = req;
  if (!v.dateNaissance) e.dateNaissance = req;
  if (!v.lieuNaissance.trim()) e.lieuNaissance = req;
  if (v.nationalite === 'autre' && !v.nationaliteAutre.trim())
    e.nationaliteAutre = 'Précisez la nationalité.';
  if (!v.telephone1.trim()) e.telephone1 = req;
  if (!v.email.trim()) e.email = req;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Adresse e-mail invalide.';
  if (!v.baccalaureat.trim()) e.baccalaureat = req;
  if (!/^\d{4}$/.test(v.anneeBac)) e.anneeBac = 'Année sur 4 chiffres (ex. 2025).';
  if (!v.urgenceNom.trim()) e.urgenceNom = req;
  if (!v.urgenceTelephone.trim()) e.urgenceTelephone = req;
  if (!v.certifie) e.certifie = 'Vous devez certifier l’exactitude des informations.';

  return e;
}

export default function FormulaireCandidatureLicence({
  session = `${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`,
  logoSrc,
  submitDisabled = false,
  initialValues,
  lockEmail = false,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<CandidatureValues>(() => ({
    ...buildInitialValues(),
    ...initialValues,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const formRef = useRef<HTMLFormElement>(null);

  // Aperçu de la photo (et libération de l'URL temporaire)
  useEffect(() => {
    if (!photo) {
      setPhotoUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const set = <K extends keyof CandidatureValues>(key: K, value: CandidatureValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const toggle = (key: 'filieresInitiale' | 'filieresContinue' | 'pieces', item: string) =>
    setValues((prev) => ({
      ...prev,
      [key]: prev[key].includes(item)
        ? prev[key].filter((x) => x !== item)
        : [...prev[key], item],
    }));

  const setCursus = (index: number, field: keyof CursusRow, value: string) =>
    setValues((prev) => ({
      ...prev,
      cursus: prev.cursus.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));

  const text =
    (key: keyof CandidatureValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(key, e.target.value as never);

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoError('');
    if (!file) return setPhoto(null);
    if (!file.type.startsWith('image/')) return setPhotoError('Le fichier doit être une image.');
    if (file.size > 2 * 1024 * 1024) return setPhotoError('Image trop lourde (2 Mo maximum).');
    setPhoto(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      );
      return;
    }
    setStatus('sending');
    setSubmitError('');
    try {
      await onSubmit?.(values, photo);
      setStatus('sent');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'L’envoi a échoué. Réessayez.');
      setStatus('error');
    }
  };

  const reset = () => {
    setValues(buildInitialValues());
    setPhoto(null);
    setErrors({});
    setSubmitError('');
    setStatus('idle');
  };

  const showFraisContinue = values.filieresContinue.length > 0;

  if (status === 'sent') {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <h2 className="text-xl font-bold text-green-800">Candidature envoyée</h2>
        <p className="mt-2 text-sm text-green-900">
          Votre dossier a bien été enregistré. Pensez à déposer les pièces cochées à l’institut
          aux dates indiquées.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-md bg-[#14306b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2f6db5]"
        >
          Nouvelle candidature
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto max-w-4xl space-y-6 px-4 py-8"
    >
      {/* En-tête */}
      <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {logoSrc && <img src={logoSrc} alt="INPTIC" className="h-16 w-auto" />}
          <div>
            <p className="text-xs font-semibold text-[#2f6db5]">
              Institut National de la Poste, des Technologies de l’Information et de la
              Communication
            </p>
            <h1 className="text-xl font-bold text-[#14306b] sm:text-2xl">
              Concours de recrutement Licence {session}
            </h1>
            <p className="text-sm italic text-slate-600">Notre Ambition, l’Excellence</p>
          </div>
        </div>

        {/* Photo d'identité */}
        <label className="group flex h-36 w-28 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-center hover:border-[#2f6db5]">
          {photoUrl ? (
            <img src={photoUrl} alt="Photo du candidat" className="h-full w-full object-cover" />
          ) : (
            <span className="px-2 text-xs text-slate-500">Ajouter une photo d’identité</span>
          )}
          <input type="file" accept="image/*" className="sr-only" onChange={onPhotoChange} />
        </label>
      </header>
      {photoError && (
        <p role="alert" className="text-xs text-red-600">
          {photoError}
        </p>
      )}

      {/* Filières */}
      <Section
        title="Choix de la formation"
        hint="Cochez la ou les filières demandées."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <fieldset>
            <legend className="mb-1 text-sm font-bold text-[#14306b]">Formation initiale</legend>
            {FILIERES_INITIALE.map((f) => (
              <CheckItem
                key={f}
                checked={values.filieresInitiale.includes(f)}
                onChange={() => toggle('filieresInitiale', f)}
              >
                {f}
              </CheckItem>
            ))}
          </fieldset>
          <fieldset>
            <legend className="mb-1 text-sm font-bold text-[#14306b]">Formation continue</legend>
            {FILIERES_CONTINUE.map((f) => (
              <CheckItem
                key={f}
                checked={values.filieresContinue.includes(f)}
                onChange={() => toggle('filieresContinue', f)}
              >
                {f}
              </CheckItem>
            ))}
            {showFraisContinue && (
              <p className="mt-2 rounded-md bg-[#e8f1fb] px-3 py-2 text-xs text-[#14306b]">
                Frais de dossier pour le recrutement en formation continue :{' '}
                <strong>{FRAIS_DOSSIER_CONTINUE}</strong>.
              </p>
            )}
          </fieldset>
        </div>
        {errors.filieres && (
          <p role="alert" className="text-xs text-red-600">
            {errors.filieres}
          </p>
        )}
      </Section>

      {/* Identité */}
      <Section title="Identité du candidat">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du candidat" required error={errors.nom}>
            <input
              className={inputCls}
              value={values.nom}
              onChange={text('nom')}
              aria-invalid={!!errors.nom}
              autoComplete="family-name"
            />
          </Field>
          <Field label="Prénoms" required error={errors.prenoms}>
            <input
              className={inputCls}
              value={values.prenoms}
              onChange={text('prenoms')}
              aria-invalid={!!errors.prenoms}
              autoComplete="given-name"
            />
          </Field>
          <Field label="Date de naissance" required error={errors.dateNaissance}>
            <input
              type="date"
              className={inputCls}
              value={values.dateNaissance}
              onChange={text('dateNaissance')}
              aria-invalid={!!errors.dateNaissance}
              autoComplete="bday"
            />
          </Field>
          <Field label="Lieu de naissance" required error={errors.lieuNaissance}>
            <input
              className={inputCls}
              value={values.lieuNaissance}
              onChange={text('lieuNaissance')}
              aria-invalid={!!errors.lieuNaissance}
            />
          </Field>
        </div>

        <fieldset className="flex flex-wrap items-start gap-x-6 gap-y-2">
          <legend className="mb-1 text-sm font-medium text-slate-700">Nationalité</legend>
          <CheckItem
            type="radio"
            name="nationalite"
            checked={values.nationalite === 'gabonaise'}
            onChange={() => set('nationalite', 'gabonaise')}
          >
            Gabonaise
          </CheckItem>
          <CheckItem
            type="radio"
            name="nationalite"
            checked={values.nationalite === 'autre'}
            onChange={() => set('nationalite', 'autre')}
          >
            Autre
          </CheckItem>
          {values.nationalite === 'autre' && (
            <Field label="Précisez" error={errors.nationaliteAutre} className="min-w-[12rem]">
              <input
                className={inputCls}
                value={values.nationaliteAutre}
                onChange={text('nationaliteAutre')}
                aria-invalid={!!errors.nationaliteAutre}
              />
            </Field>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Adresse postale">
            <input
              className={inputCls}
              value={values.adressePostale}
              onChange={text('adressePostale')}
              autoComplete="street-address"
            />
          </Field>
          <Field label="Quartier">
            <input className={inputCls} value={values.quartier} onChange={text('quartier')} />
          </Field>
          <Field label="Ville">
            <input
              className={inputCls}
              value={values.ville}
              onChange={text('ville')}
              autoComplete="address-level2"
            />
          </Field>
          <Field label="Pays">
            <input
              className={inputCls}
              value={values.pays}
              onChange={text('pays')}
              autoComplete="country-name"
            />
          </Field>
          <Field label="Téléphone 1" required error={errors.telephone1}>
            <input
              type="tel"
              className={inputCls}
              value={values.telephone1}
              onChange={text('telephone1')}
              aria-invalid={!!errors.telephone1}
              autoComplete="tel"
            />
          </Field>
          <Field label="Téléphone 2">
            <input
              type="tel"
              className={inputCls}
              value={values.telephone2}
              onChange={text('telephone2')}
            />
          </Field>
          <Field label="Téléphone 3">
            <input
              type="tel"
              className={inputCls}
              value={values.telephone3}
              onChange={text('telephone3')}
            />
          </Field>
          <Field label="E-mail" required error={errors.email}>
            <input
              type="email"
              className={`${inputCls} ${lockEmail ? 'bg-slate-100' : ''}`}
              value={values.email}
              onChange={text('email')}
              readOnly={lockEmail}
              aria-invalid={!!errors.email}
              autoComplete="email"
            />
          </Field>
          <Field label="Quel baccalauréat avez-vous ?" required error={errors.baccalaureat}>
            <input
              className={inputCls}
              value={values.baccalaureat}
              onChange={text('baccalaureat')}
              aria-invalid={!!errors.baccalaureat}
              placeholder="Ex. Série C, D, G2…"
            />
          </Field>
          <Field label="Année d’obtention" required error={errors.anneeBac}>
            <input
              inputMode="numeric"
              maxLength={4}
              className={inputCls}
              value={values.anneeBac}
              onChange={text('anneeBac')}
              aria-invalid={!!errors.anneeBac}
              placeholder="2025"
            />
          </Field>
        </div>
      </Section>

      {/* Cursus */}
      <Section title="Cursus scolaire">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#e8f1fb] text-left text-[#14306b]">
                <th className="border border-slate-300 px-2 py-2 font-semibold">Année scolaire</th>
                <th className="border border-slate-300 px-2 py-2 font-semibold">Établissements</th>
                <th className="border border-slate-300 px-2 py-2 font-semibold">Ville / Pays</th>
                <th className="border border-slate-300 px-2 py-2 font-semibold">Classe</th>
                <th className="border border-slate-300 px-2 py-2 font-semibold">
                  Diplôme obtenu
                </th>
              </tr>
            </thead>
            <tbody>
              {values.cursus.map((row, i) => (
                <tr key={i}>
                  {(['annee', 'etablissement', 'ville', 'classe', 'diplome'] as const).map(
                    (field) => (
                      <td key={field} className="border border-slate-300 p-0">
                        <input
                          aria-label={`${field} ligne ${i + 1}`}
                          className="w-full bg-transparent px-2 py-2 text-sm focus:bg-[#e8f1fb] focus:outline-none"
                          value={row[field]}
                          onChange={(e) => setCursus(i, field, e.target.value)}
                          placeholder={field === 'annee' ? '2023 - 2024' : ''}
                        />
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <fieldset className="flex flex-wrap items-center gap-x-4">
          <legend className="mb-1 text-sm font-medium text-slate-700">
            Connaissance informatique
          </legend>
          {(
            [
              ['faible', 'Faible'],
              ['moyen', 'Moyen'],
              ['suffisant', 'Suffisant'],
            ] as const
          ).map(([val, lab]) => (
            <CheckItem
              key={val}
              type="radio"
              name="informatique"
              checked={values.niveauInformatique === val}
              onChange={() => set('niveauInformatique', val)}
            >
              {lab}
            </CheckItem>
          ))}
        </fieldset>
      </Section>

      {/* Urgence */}
      <Section title="Parents / tuteurs à contacter en cas d’urgence">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom et prénoms" required error={errors.urgenceNom}>
            <input
              className={inputCls}
              value={values.urgenceNom}
              onChange={text('urgenceNom')}
              aria-invalid={!!errors.urgenceNom}
            />
          </Field>
          <Field label="Profession">
            <input
              className={inputCls}
              value={values.urgenceProfession}
              onChange={text('urgenceProfession')}
            />
          </Field>
          <Field label="Adresse permanente" className="sm:col-span-2">
            <input
              className={inputCls}
              value={values.urgenceAdresse}
              onChange={text('urgenceAdresse')}
            />
          </Field>
          <Field label="Ville">
            <input
              className={inputCls}
              value={values.urgenceVille}
              onChange={text('urgenceVille')}
            />
          </Field>
          <Field label="Pays">
            <input
              className={inputCls}
              value={values.urgencePays}
              onChange={text('urgencePays')}
            />
          </Field>
          <Field label="Téléphone" required error={errors.urgenceTelephone}>
            <input
              type="tel"
              className={inputCls}
              value={values.urgenceTelephone}
              onChange={text('urgenceTelephone')}
              aria-invalid={!!errors.urgenceTelephone}
            />
          </Field>
          <Field label="Fax">
            <input className={inputCls} value={values.urgenceFax} onChange={text('urgenceFax')} />
          </Field>
          <Field label="E-mail" className="sm:col-span-2">
            <input
              type="email"
              className={inputCls}
              value={values.urgenceEmail}
              onChange={text('urgenceEmail')}
            />
          </Field>
        </div>
      </Section>

      {/* Financement */}
      <Section title="Financement des études">
        <div className="grid gap-6 md:grid-cols-2">
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-slate-700">
              Qui finance vos études ?
            </legend>
            {(
              [
                ['parents', 'Parents'],
                ['etat', 'L’État'],
                ['organisme', 'Organismes'],
                ['autre', 'Autres (préciser)'],
              ] as const
            ).map(([val, lab]) => (
              <CheckItem
                key={val}
                type="radio"
                name="financeur"
                checked={values.financeur === val}
                onChange={() => set('financeur', val)}
              >
                {lab}
              </CheckItem>
            ))}
            {(values.financeur === 'autre' ||
              values.financeur === 'organisme' ||
              values.financeur === 'etat') && (
              <Field label="Précisions" className="mt-2">
                <input
                  className={inputCls}
                  value={values.financeurPrecision}
                  onChange={text('financeurPrecision')}
                />
              </Field>
            )}
          </fieldset>

          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Adresse de celui qui finance</p>
            <Field label="Nom">
              <input
                className={inputCls}
                value={values.financeurNom}
                onChange={text('financeurNom')}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ville">
                <input
                  className={inputCls}
                  value={values.financeurVille}
                  onChange={text('financeurVille')}
                />
              </Field>
              <Field label="Pays">
                <input
                  className={inputCls}
                  value={values.financeurPays}
                  onChange={text('financeurPays')}
                />
              </Field>
              <Field label="Téléphone">
                <input
                  type="tel"
                  className={inputCls}
                  value={values.financeurTelephone}
                  onChange={text('financeurTelephone')}
                />
              </Field>
              <Field label="E-mail">
                <input
                  type="email"
                  className={inputCls}
                  value={values.financeurEmail}
                  onChange={text('financeurEmail')}
                />
              </Field>
            </div>
          </div>
        </div>

        <fieldset className="flex flex-wrap items-center gap-x-4">
          <legend className="mb-1 text-sm font-medium text-slate-700">
            Souhaiteriez-vous intégrer la formation continue en cas d’échec au concours ?
          </legend>
          {(
            [
              ['oui', 'Oui'],
              ['non', 'Non'],
            ] as const
          ).map(([val, lab]) => (
            <CheckItem
              key={val}
              type="radio"
              name="continueSiEchec"
              checked={values.formationContinueSiEchec === val}
              onChange={() => set('formationContinueSiEchec', val)}
            >
              {lab}
            </CheckItem>
          ))}
        </fieldset>
      </Section>

      {/* Dossier */}
      <Section
        title="Constitution du dossier de candidature"
        hint="Cochez les pièces fournies."
      >
        <div>
          {PIECES.map((p) => (
            <CheckItem key={p} checked={values.pieces.includes(p)} onChange={() => toggle('pieces', p)}>
              {p}
            </CheckItem>
          ))}
        </div>

        <div className="rounded-md border border-slate-300 bg-slate-50 p-4">
          <p className="mb-2 text-sm font-bold text-[#14306b]">
            Modalités de candidature et d’admission
          </p>
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-700">
            {MODALITES.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Signature */}
      <Section title="Certification">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fait à">
            <input className={inputCls} value={values.faitA} onChange={text('faitA')} />
          </Field>
          <Field label="Le">
            <input
              type="date"
              className={inputCls}
              value={values.faitLe}
              onChange={text('faitLe')}
            />
          </Field>
        </div>
        <label className="flex items-start gap-3 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={values.certifie}
            onChange={(e) => set('certifie', e.target.checked)}
            aria-invalid={!!errors.certifie}
            className="mt-0.5 h-4 w-4 accent-[#14306b]"
          />
          <span>Je certifie l’exactitude des informations fournies (signature du candidat).</span>
        </label>
        {errors.certifie && (
          <p role="alert" className="text-xs text-red-600">
            {errors.certifie}
          </p>
        )}
      </Section>

      {status === 'error' && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError || 'L’envoi a échoué. Vérifiez votre connexion et réessayez.'}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Imprimer
        </button>
        <button
          type="submit"
          disabled={status === 'sending' || submitDisabled}
          className="rounded-md bg-[#14306b] px-6 py-2 text-sm font-semibold text-white hover:bg-[#2f6db5] disabled:opacity-60"
        >
          {status === 'sending' ? 'Envoi en cours…' : 'Envoyer ma candidature'}
        </button>
      </div>

      <footer className="border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
        BP : 13 124 Libreville – Gabon · Téléphone : 011 73 81 31 – 011 73 23 49 · Fax : 011 73 44
        16 · inptic@inptic-ga.org
      </footer>
    </form>
  );
}