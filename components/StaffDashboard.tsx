'use client';

import { CalendarDays, FileCheck2, LogOut, Plus, Upload, Users } from 'lucide-react';
import { ChangeEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { normalizeRole } from '@/lib/roles';
import { useTranslation } from 'react-i18next';

type Role = 'scolarite' | 'chef_departement' | 'direction_etudes';

type Student = {
  email: string;
  name?: string;
  filiere?: string;
  departement?: string;
  role?: string;
  documents?: Array<{
    name: string;
    type: string;
    data?: string;
    url?: string;
    path?: string;
  }>;
  emploiDuTemps?: {
    title: string;
    data?: string;
    name: string;
    type: string;
  }[];
};

type Department = {
  id: string;
  name: string;
  chefEmail: string;
};

const departments = [
  'Management des TIC',
  'Réseaux et Systèmes Numériques',
  'Audiovisuel',
];

const defaultDepartments: Department[] = departments.map((name) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name,
  chefEmail: '',
}));

export default function StaffDashboard({ role }: { role: Role }) {
  const router = useRouter();
  const { t } = useTranslation();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [department, setDepartment] = useState(departments[0]);
  const [availableDepartments, setAvailableDepartments] =
    useState<Department[]>(defaultDepartments);

  const [newDepartment, setNewDepartment] = useState('');
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [chefEmail, setChefEmail] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const session = localStorage.getItem('inptic_staff');

    let sessionData: { role?: unknown };
    try {
      sessionData = JSON.parse(session || '{}');
    } catch {
      sessionData = {};
    }

    if (!session || normalizeRole(sessionData.role) !== role) {
      router.replace('/candidat');
      return;
    }

    const storedDepartments = JSON.parse(
      localStorage.getItem('inptic_departments') || 'null'
    );

    if (Array.isArray(storedDepartments) && storedDepartments.length) {
      const normalizedDepartments: Department[] = storedDepartments.map(
        (value: Department | string) =>
          typeof value === 'string'
            ? {
                id: value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                name: value,
                chefEmail: '',
              }
            : value
      );

      setAvailableDepartments(normalizedDepartments);
      setDepartment(normalizedDepartments[0].name);
    }

    fetch('/api/candidat/profile')
      .then((response) => response.json())
      .then((data) =>
        setStudents(Array.isArray(data.profiles) ? data.profiles : [])
      )
      .catch(() => setMessage(t('pages.loadStudentsFailed')));
  }, [router]);

  const uploadForStudent = async (event: React.FormEvent) => {
    event.preventDefault();

    const student = students.find(
      (entry) => entry.email === selectedEmail
    );

    if (!student || !file) {
      setMessage(t('pages.selectStudentFile'));
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      const document = {
        name: file.name,
        type: file.type || 'application/octet-stream',
        data: typeof reader.result === 'string' ? reader.result : '',
      };

      const response = await fetch('/api/candidat/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...student,
          name: student.name || t('pages.student'),
          documents: [...(student.documents || []), document],
          role: 'etudiant',
        }),
      });

      setMessage(
        response.ok
          ? t('pages.published', { name: student.name || student.email })
          : t('pages.publishFailed')
      );

      if (response.ok) {
        setFile(null);
      }
    };

    reader.readAsDataURL(file);
  };

  const createDepartment = (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedName = newDepartment.trim().replace(/\s+/g, ' ');

    if (!normalizedName) {
      setMessage(t('pages.notProvided'));
      return;
    }

    if (
      availableDepartments.some(
        (value) =>
          value.name.toLowerCase() === normalizedName.toLowerCase()
      )
    ) {
      setMessage(t('pages.noData'));
      return;
    }

    const nextDepartments = [
      ...availableDepartments,
      {
        id: `${Date.now()}-${normalizedName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')}`,
        name: normalizedName,
        chefEmail: '',
      },
    ];

    localStorage.setItem(
      'inptic_departments',
      JSON.stringify(nextDepartments)
    );

    setAvailableDepartments(nextDepartments);
    setDepartment(normalizedName);
    setNewDepartment('');

    setMessage(
      `Département « ${normalizedName} » créé avec succès.`
    );
  };

  const saveDepartment = (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedName = newDepartment.trim().replace(/\s+/g, ' ');

    if (!normalizedName || !editingDepartmentId) {
      return;
    }

    if (
      availableDepartments.some(
        (entry) =>
          entry.id !== editingDepartmentId &&
          entry.name.toLowerCase() === normalizedName.toLowerCase()
      )
    ) {
      setMessage(t('pages.noData'));
      return;
    }

    const nextDepartments = availableDepartments.map((entry) =>
      entry.id === editingDepartmentId
        ? {
            ...entry,
            name: normalizedName,
          }
        : entry
    );

    localStorage.setItem(
      'inptic_departments',
      JSON.stringify(nextDepartments)
    );

    setAvailableDepartments(nextDepartments);

    setDepartment(
      nextDepartments.find(
        (entry) => entry.id === editingDepartmentId
      )?.name || department
    );

    setEditingDepartmentId(null);
    setNewDepartment('');

    setMessage(`Département « ${normalizedName} » modifié.`);
  };

  const deleteDepartment = (id: string) => {
    const target = availableDepartments.find(
      (entry) => entry.id === id
    );

    if (
      !target ||
      !window.confirm(
        `Supprimer le département « ${target.name} » ?`
      )
    ) {
      return;
    }

    const nextDepartments = availableDepartments.filter(
      (entry) => entry.id !== id
    );

    localStorage.setItem(
      'inptic_departments',
      JSON.stringify(nextDepartments)
    );

    setAvailableDepartments(nextDepartments);

    if (department === target.name) {
      setDepartment(nextDepartments[0]?.name || '');
    }

    setMessage(`Département « ${target.name} » supprimé.`);
  };

  const assignChef = (id: string, email: string) => {
    const nextDepartments = availableDepartments.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            chefEmail: email,
          }
        : entry
    );

    localStorage.setItem(
      'inptic_departments',
      JSON.stringify(nextDepartments)
    );

    setAvailableDepartments(nextDepartments);

    setMessage(
      email
        ? 'Chef de département attribué.'
        : 'Attribution retirée.'
    );
  };

  const uploadSchedule = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      setMessage(t('pages.selectStudentFile'));
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      const schedule = {
        title: `Emploi du temps - ${department}`,
        name: file.name,
        type: file.type || 'application/pdf',
        data: typeof reader.result === 'string' ? reader.result : '',
      };

      const targets = students.filter(
        (student) =>
          student.departement === department ||
          student.filiere === department
      );

      await Promise.all(
        targets.map((student) =>
          fetch('/api/candidat/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...student,
              documents: student.documents || [],
              emploiDuTemps: [
                ...(student.emploiDuTemps || []),
                schedule,
              ],
              role: 'etudiant',
            }),
          })
        )
      );

      setMessage(
        `${schedule.title} publié pour ${targets.length} étudiant(s).`
      );

      setFile(null);
    };

    reader.readAsDataURL(file);
  };

  const logout = () => {
    localStorage.removeItem('inptic_staff');
    router.replace('/candidat');
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 px-6 py-8 text-white md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">
              {role === 'scolarite'
                ? 'Scolarité'
                : role === 'direction_etudes'
                  ? 'Direction des études pédagogiques'
                  : 'Chef de département'}
            </h1>
          </div>

          {role !== 'direction_etudes' && (
            <button
              type="button"
              onClick={logout}
              aria-label={t('pages.logout')}
              title={t('pages.logout')}
              className="flex items-center gap-2 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <LogOut size={17} aria-hidden="true" />
              {t('pages.logout')}
            </button>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        {message && (
          <p
            className="mb-6 border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"
            role="status"
          >
            {message}
          </p>
        )}

        <div
          className={`grid gap-6 ${
            role === 'direction_etudes'
              ? 'lg:grid-cols-1'
              : 'lg:grid-cols-[280px_1fr]'
          }`}
        >
          {role !== 'direction_etudes' && (
            <aside className="border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <Users
                  size={22}
                  className="text-blue-700"
                  aria-hidden="true"
                />

                <h2 className="font-bold">{t('pages.student')}</h2>
              </div>

              <div className="mt-4 space-y-2">
                {students.map((student) => (
                  <button
                    key={student.email}
                    type="button"
                    onClick={() => setSelectedEmail(student.email)}
                    className={`w-full border p-3 text-left text-sm ${
                      selectedEmail === student.email
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <p className="font-semibold">
                      {student.name || t('pages.student')}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {student.email}
                    </p>
                  </button>
                ))}
              </div>
            </aside>
          )}

          <div className="space-y-6">
            {role === 'direction_etudes' && (
              <section className="border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold">
                    {t('pages.department')}
                  </h2>

                  <span className="text-sm text-slate-500">
                    {availableDepartments.length} département(s)
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {availableDepartments.map((entry) => (
                    <div
                      key={entry.id}
                      className="border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {entry.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            Chef : {entry.chefEmail || 'Non attribué'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <select
                            value={entry.chefEmail}
                            onChange={(event) =>
                              assignChef(
                                entry.id,
                                event.target.value
                              )
                            }
                            className="border border-slate-300 bg-white px-3 py-2 text-sm"
                          >
                            <option value="">
                              Attribuer un chef
                            </option>

                            {students
                              .filter(
                                (student) =>
                                  student.role ===
                                  'chef_departement'
                              )
                              .map((student) => (
                                <option
                                  key={student.email}
                                  value={student.email}
                                >
                                  {student.name || student.email}
                                </option>
                              ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingDepartmentId(entry.id);
                              setNewDepartment(entry.name);
                            }}
                            className="border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                          >
                            {t('common.profile')}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteDepartment(entry.id)
                            }
                            className="border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                          >
                            {t('pages.reset')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {role === 'scolarite' ? (
              <form
                onSubmit={uploadForStudent}
                className="border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <FileCheck2
                    size={24}
                    className="text-blue-700"
                    aria-hidden="true"
                  />

                  <h2 className="text-xl font-bold">
                    Publier un document étudiant
                  </h2>
                </div>

                <p className="mt-2 text-sm text-slate-600">
                  Attestation de réinscription, diplôme, relevé ou
                  tout autre document.
                </p>

                <label className="mt-6 block">
                  <span className="mb-2 block text-sm font-semibold">
                    {t('pages.student')}
                  </span>

                  <select
                    required
                    value={selectedEmail}
                    onChange={(event) =>
                      setSelectedEmail(event.target.value)
                    }
                    className="w-full border border-slate-300 p-3"
                  >
                    <option value="">
                      Sélectionner un étudiant
                    </option>

                    {students.map((student) => (
                      <option
                        key={student.email}
                        value={student.email}
                      >
                        {student.name || student.email}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-semibold">
                    {t('pages.document')}
                  </span>

                  <input
                    required
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(
                      event: ChangeEvent<HTMLInputElement>
                    ) =>
                      setFile(
                        event.target.files?.[0] || null
                      )
                    }
                    className="w-full border border-slate-300 p-3"
                  />
                </label>

                <button
                  type="submit"
                  className="mt-5 flex items-center gap-2 bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  <Upload size={17} aria-hidden="true" />
                  Publier dans Documents
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <form
                  onSubmit={
                    editingDepartmentId
                      ? saveDepartment
                      : createDepartment
                  }
                  className="border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Plus
                      size={24}
                      className="text-blue-700"
                      aria-hidden="true"
                    />

                    <h2 className="text-xl font-bold">
                      {editingDepartmentId
                        ? t('pages.department')
                        : t('pages.department')}
                    </h2>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    Ajoutez un département qui pourra ensuite
                    recevoir un emploi du temps.
                  </p>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <input
                      required
                      value={newDepartment}
                      onChange={(event) =>
                        setNewDepartment(event.target.value)
                      }
                      placeholder="Nom du département"
                      className="min-w-0 flex-1 border border-slate-300 p-3"
                    />

                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
                    >
                      <Plus
                        size={17}
                        aria-hidden="true"
                      />

                      {editingDepartmentId
                        ? t('pages.savePassword')
                        : t('pages.department')}
                    </button>

                    {editingDepartmentId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDepartmentId(null);
                          setNewDepartment('');
                        }}
                        className="border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {t('pages.reset')}
                      </button>
                    )}
                  </div>
                </form>

                <form
                  onSubmit={uploadSchedule}
                  className="border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays
                      size={24}
                      className="text-blue-700"
                      aria-hidden="true"
                    />

                    <h2 className="text-xl font-bold">
                      {role === 'direction_etudes'
                        ? 'Piloter les emplois du temps'
                        : 'Publier un emploi du temps'}
                    </h2>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    {role === 'direction_etudes'
                      ? 'Publiez les calendriers pour les trois départements pédagogiques.'
                      : 'Publiez le calendrier de votre département.'}
                  </p>

                  <label className="mt-6 block">
                    <span className="mb-2 block text-sm font-semibold">
                      {t('pages.department')}
                    </span>

                    <select
                      value={department}
                      onChange={(event) =>
                        setDepartment(event.target.value)
                      }
                      className="w-full border border-slate-300 p-3"
                    >
                      {availableDepartments.map((dept) => (
                        <option
                          key={dept.id}
                          value={dept.name}
                        >
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-semibold">
                      {t('pages.document')}
                    </span>

                    <input
                      required
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(
                        event: ChangeEvent<HTMLInputElement>
                      ) =>
                        setFile(
                          event.target.files?.[0] || null
                        )
                      }
                      className="w-full border border-slate-300 p-3"
                    />
                  </label>

                  <button
                    type="submit"
                    className="mt-5 flex items-center gap-2 bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    <Upload
                      size={17}
                      aria-hidden="true"
                    />

                    Publier l’emploi du temps
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
