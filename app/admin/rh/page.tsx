'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  Archive,
  ArrowUpDown,
  Award,
  BarChart3,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Edit,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  Lock,
  LogOut,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Trash2,
  Upload,
  User,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { strToU8, unzipSync, zipSync } from 'fflate';
import { authClient } from '@/lib/auth-client';
import DeleteButton from '@/components/DeleteButton';
import {
  isAdminRole,
  isDirectorRole,
  normalizeRole,
} from '@/lib/roles';
import {
  DEFAULT_PUBLIC_WHITELIST,
  RHProfile,
  RHStaffStatus,
  RHContractType,
  RHGender,
  RHQRStatus,
  RHAuditLog,
  RH_DEPARTMENTS,
  RHPublicWhitelist,
} from '@/types/rh';
import { generateQRCodeSVG } from '@/lib/qrcode';

type TabType = 'profils' | 'qrcodes' | 'stats' | 'audit';

const escapeHtml = (value: string | null | undefined) =>
  (value ?? '').replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });

const getProfileFileName = (profile: RHProfile) =>
  [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join('_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || `profil_${profile.id}`;

const getPrintableCardMarkup = (profile: RHProfile, origin: string) => {
  const qrSvg = generateQRCodeSVG(`${origin}/agent/${profile.qrToken || profile.id}`, {
    size: 140,
    margin: 1,
  });
  const photo = profile.photoUrl
    ? `<img src="${escapeHtml(profile.photoUrl)}" class="photo" alt="Photo de ${escapeHtml(profile.firstName)} ${escapeHtml(profile.lastName)}" />`
    : '<div class="photo photo-placeholder">PHOTO</div>';

  return `
    <div class="card">
      <div class="top-header">
        <img src="${origin}/logoinptic.png" class="company-logo" alt="Logo INPTIC" />
      </div>
      <div class="photo-wrapper">${photo}</div>
      <div class="body">
        <div>
          <div class="name">${escapeHtml(profile.firstName)} ${escapeHtml(profile.lastName)}</div>
          <div class="position">${escapeHtml(profile.position)}</div>
          <div class="matr">MATR: ${escapeHtml(profile.matricule)}</div>
        </div>
        <div class="qr-box">${qrSvg}</div>
        <div class="footer">CARTE PROFESSIONNELLE OFFICIELLE</div>
      </div>
    </div>
  `;
};

const getPrintableCardsDocument = (profiles: RHProfile[], origin: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Cartes professionnelles INPTIC</title>
      <style>
        @page { size: 53.98mm 85.6mm; margin: 0; }
        html, body {
          width: 53.98mm;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .card {
          width: 53.98mm;
          height: 85.6mm;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 4mm;
          overflow: hidden;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          border: 1px solid #cbd5e1;
          break-after: page;
          page-break-after: always;
        }
        .card:last-child { break-after: auto; page-break-after: auto; }
        .top-header {
          width: 100%;
          background: #1e3a8a;
          padding: 2mm;
          box-sizing: border-box;
        }
        .company-logo {
          display: block;
          width: 30mm;
          height: auto;
          margin: 0 auto;
          padding: 0.5mm;
          box-sizing: content-box;
          background: #ffffff;
          border-radius: 1mm;
        }
        .photo-wrapper { margin-top: 2mm; position: relative; z-index: 1; }
        .photo {
          width: 22mm;
          height: 22mm;
          border-radius: 50%;
          border: 2mm solid #0ea5e9;
          object-fit: cover;
          background: #0f172a;
        }
        .photo-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 7pt;
          font-weight: bold;
        }
        .body {
          padding: 1.5mm 3mm 2mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          justify-content: space-between;
          width: 100%;
          box-sizing: border-box;
        }
        .name {
          font-size: 9pt;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.1;
          text-transform: uppercase;
        }
        .position {
          font-size: 6.5pt;
          font-weight: 700;
          color: #0284c7;
          margin-top: 0.5mm;
        }
        .matr {
          font-size: 5.5pt;
          font-family: monospace;
          color: #d4af37;
          font-weight: 800;
          margin-top: 0.5mm;
        }
        .qr-box {
          width: 20mm;
          height: 20mm;
          background: #ffffff;
          padding: 0.5mm;
          border: 1px solid #e2e8f0;
          border-radius: 1.5mm;
          margin-top: 0.5mm;
        }
        .qr-box svg { width: 100%; height: 100%; }
        .footer { font-size: 4.5pt; color: #64748b; font-weight: 600; }
        @media screen {
          body { background: #e2e8f0; }
          .card { margin-bottom: 12px; }
        }
      </style>
    </head>
    <body>
      ${profiles.map((profile) => getPrintableCardMarkup(profile, origin)).join('')}
      <script>
        window.onload = () => {
          setTimeout(() => window.print(), 250);
        };
      </script>
    </body>
  </html>
`;

function parseDelimitedText(text: string): string[][] {
  const normalizedText = text.replace(/^\uFEFF/, '');
  const firstLine = normalizedText.split(/\r?\n/, 1)[0] ?? '';
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < normalizedText.length; index++) {
    const character = normalizedText[index];
    if (character === '"') {
      if (inQuotes && normalizedText[index + 1] === '"') {
        value += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === delimiter && !inQuotes) {
      row.push(value.trim());
      value = '';
    } else if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && normalizedText[index + 1] === '\n') index++;
      row.push(value.trim());
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  row.push(value.trim());
  if (row.some((cell) => cell !== '')) rows.push(row);
  return rows;
}

function serializeDelimitedRows(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => `"${cell.replace(/"/g, '""')}"`)
        .join(';'),
    )
    .join('\n');
}

async function readXlsxRows(file: File): Promise<string[][]> {
  const archive = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const decoder = new TextDecoder();
  const readXml = (path: string) => {
    const contents = archive[path];
    if (!contents) throw new Error(`Le fichier Excel est incomplet (${path} manquant).`);
    const document = new DOMParser().parseFromString(decoder.decode(contents), 'application/xml');
    if (document.getElementsByTagName('parsererror').length > 0) {
      throw new Error('Le fichier Excel contient un document XML invalide.');
    }
    return document;
  };

  const workbook = readXml('xl/workbook.xml');
  const firstSheet = workbook.getElementsByTagNameNS('*', 'sheet')[0];
  const relationshipId =
    firstSheet?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') ||
    firstSheet?.getAttribute('r:id');
  if (!relationshipId) throw new Error('Aucune feuille de calcul trouvée dans le fichier Excel.');

  const relationships = readXml('xl/_rels/workbook.xml.rels');
  const relationship = Array.from(relationships.getElementsByTagNameNS('*', 'Relationship')).find(
    (item) => item.getAttribute('Id') === relationshipId,
  );
  const target = relationship?.getAttribute('Target');
  if (!target) throw new Error('Impossible de localiser la feuille de calcul du fichier Excel.');

  const pathParts = (target.startsWith('/') ? target.slice(1) : `xl/${target}`).split('/');
  const worksheetPath: string[] = [];
  for (const part of pathParts) {
    if (part === '..') worksheetPath.pop();
    else if (part !== '.' && part !== '') worksheetPath.push(part);
  }
  const worksheet = readXml(worksheetPath.join('/'));
  const sharedStrings = archive['xl/sharedStrings.xml']
    ? Array.from(readXml('xl/sharedStrings.xml').getElementsByTagNameNS('*', 'si')).map((item) =>
        Array.from(item.getElementsByTagNameNS('*', 't'))
          .map((text) => text.textContent ?? '')
          .join(''),
      )
    : [];

  return Array.from(worksheet.getElementsByTagNameNS('*', 'row')).map((sourceRow) => {
    const values: string[] = [];
    for (const cell of Array.from(sourceRow.getElementsByTagNameNS('*', 'c'))) {
      const reference = cell.getAttribute('r') ?? '';
      const columnLetters = reference.match(/[A-Z]+/i)?.[0]?.toUpperCase();
      if (!columnLetters) continue;
      const columnIndex = [...columnLetters].reduce(
        (index, letter) => index * 26 + letter.charCodeAt(0) - 64,
        0,
      ) - 1;
      const cellType = cell.getAttribute('t');
      const rawValue =
        cellType === 'inlineStr'
          ? Array.from(cell.getElementsByTagNameNS('*', 't'))
              .map((text) => text.textContent ?? '')
              .join('')
          : cell.getElementsByTagNameNS('*', 'v')[0]?.textContent ?? '';
      values[columnIndex] =
        cellType === 's' ? sharedStrings[Number(rawValue)] ?? '' : rawValue;
    }
    return values.map((value) => value ?? '');
  });
}

export default function AdminRHPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('profils');

  // Auth & Session
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('rh_consultation');
  const [authLoading, setAuthLoading] = useState(true);

  // Données
  const [profiles, setProfiles] = useState<RHProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<RHAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showArchived, setShowArchived] = useState(false);

  // Modals & Vues
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<RHProfile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<RHProfile | null>(null);
  const [selectedForCard, setSelectedForCard] = useState<RHProfile | null>(null);
  const [archivingProfile, setArchivingProfile] = useState<RHProfile | null>(null);
  const [archiveReason, setArchiveReason] = useState('Fin de contrat');

  // Modal Import CSV
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importReport, setImportReport] = useState<{ success: number; errors: string[] } | null>(null);

  // Formulaire Employé
  const [formMatricule, setFormMatricule] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formGender, setFormGender] = useState<RHGender>('M');
  const [formBirthDate, setFormBirthDate] = useState('1990-01-01');
  const [formBirthPlace, setFormBirthPlace] = useState('Libreville');
  const [formPhone, setFormPhone] = useState('+241 ');
  const [formEmail, setFormEmail] = useState('@inptic.ga');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formDept, setFormDept] = useState<string>(RH_DEPARTMENTS[0]);
  const [formPosition, setFormPosition] = useState('');
  const [formStatus, setFormStatus] = useState<RHStaffStatus>('contractuel');
  const [formContract, setFormContract] = useState<RHContractType>('CDI');
  const [formHireDate, setFormHireDate] = useState(new Date().toISOString().slice(0, 10));
  const [formJobDescription, setFormJobDescription] = useState('');
  const [formWhitelist, setFormWhitelist] = useState<RHPublicWhitelist>(DEFAULT_PUBLIC_WHITELIST);
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formSaveStep, setFormSaveStep] = useState<1 | 2>(1);

  // Vérification de la session
  useEffect(() => {
    authClient.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (session) {
        setToken(session.access_token);
        const email = session.user?.email || null;
        setUserEmail(email);

        const rawRole = session.user?.app_metadata?.role ?? session.user?.app_metadata?.roles;
        const normRole = normalizeRole(rawRole);

        if (isAdminRole(normRole) || isDirectorRole(normRole) || normRole === 'rh_admin') {
          setUserRole('rh_admin');
        } else if (normRole === 'rh_gestionnaire') {
          setUserRole('rh_gestionnaire');
        } else {
          setUserRole('rh_consultation');
        }
      } else {
        router.replace('/candidat');
      }
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = authClient.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setToken(session.access_token);
        setUserEmail(session.user?.email || null);
      } else {
        setToken(null);
        setUserEmail(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isReadOnly = userRole === 'rh_consultation';

  // Chargement des profils
  const loadProfiles = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rh/profiles?archived=${showArchived ? '1' : '0'}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setProfiles(json.data);
      }
    } catch (err) {
      console.error('Erreur chargement profils:', err);
    } finally {
      setLoading(false);
    }
  };

  // Chargement du journal d'audit
  const loadAuditLogs = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/rh/profiles?logs=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.logs && Array.isArray(json.logs)) {
        setAuditLogs(json.logs);
      }
    } catch (err) {
      console.error('Erreur chargement logs:', err);
    }
  };

  useEffect(() => {
    if (token) {
      loadProfiles();
      loadAuditLogs();
    }

    const refreshInterval = window.setInterval(() => {
      if (token) {
        void loadProfiles();
        void loadAuditLogs();
      }
    }, 30_000);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, [token, showArchived]);

  // Profils filtrés
  const filteredProfiles = useMemo(() => {
    let list = profiles;

    if (selectedDept !== 'all') {
      list = list.filter((p) => p.department.toLowerCase() === selectedDept.toLowerCase());
    }

    if (selectedStatus !== 'all') {
      list = list.filter((p) => p.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.matricule.toLowerCase().includes(q) ||
          p.position.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
      );
    }

    return list;
  }, [profiles, selectedDept, selectedStatus, searchQuery]);

  const exportableProfiles = useMemo(
    () => filteredProfiles.filter((profile) => !profile.isArchived && profile.qrStatus === 'actif' && profile.qrToken),
    [filteredProfiles]
  );

  // Statistiques calculées
  const stats = useMemo(() => {
    const total = profiles.length;
    const active = profiles.filter((p) => !p.isArchived).length;
    const archived = profiles.filter((p) => p.isArchived).length;

    // Répartition par sexe
    const males = profiles.filter((p) => p.gender === 'M').length;
    const females = profiles.filter((p) => p.gender === 'F').length;

    // Répartition par statut
    const statuts: Record<string, number> = {};
    profiles.forEach((p) => {
      statuts[p.status] = (statuts[p.status] || 0) + 1;
    });

    // Répartition par direction
    const depts: Record<string, number> = {};
    profiles.forEach((p) => {
      depts[p.department] = (depts[p.department] || 0) + 1;
    });

    // Répartition par tranche d'âge
    const currentYear = new Date().getFullYear();
    const ages = {
      moins30: 0,
      entre30et45: 0,
      entre45et55: 0,
      plus55: 0,
    };
    profiles.forEach((p) => {
      const birthYear = new Date(p.birthDate).getFullYear();
      const age = currentYear - birthYear;
      if (age < 30) ages.moins30++;
      else if (age <= 45) ages.entre30et45++;
      else if (age <= 55) ages.entre45et55++;
      else ages.plus55++;
    });

    // Ancienneté
    const anciennetes = {
      moins2: 0,
      entre2et5: 0,
      entre5et10: 0,
      plus10: 0,
    };
    profiles.forEach((p) => {
      const years = p.seniorityYears || 0;
      if (years < 2) anciennetes.moins2++;
      else if (years <= 5) anciennetes.entre2et5++;
      else if (years <= 10) anciennetes.entre5et10++;
      else anciennetes.plus10++;
    });

    return { total, active, archived, males, females, statuts, depts, ages, anciennetes };
  }, [profiles]);

  // Formulaire : Ouvrir création
  const handleOpenCreate = () => {
    setEditingProfile(null);
    setFormMatricule(`INPTIC-${new Date().getFullYear()}-${String(profiles.length + 1).padStart(3, '0')}`);
    setFormFirstName('');
    setFormLastName('');
    setFormGender('M');
    setFormBirthDate('1990-01-01');
    setFormBirthPlace('Libreville');
    setFormPhone('+241 ');
    setFormEmail('');
    setFormPhotoUrl('');
    setFormDept(RH_DEPARTMENTS[0]);
    setFormPosition('');
    setFormStatus('contractuel');
    setFormContract('CDI');
    setFormHireDate(new Date().toISOString().slice(0, 10));
    setFormJobDescription('');
    setFormWhitelist(DEFAULT_PUBLIC_WHITELIST);
    setFormError('');
    setShowCreateModal(true);
  };

  // Formulaire : Ouvrir modification
  const handleOpenEdit = (p: RHProfile) => {
    setEditingProfile(p);
    setFormMatricule(p.matricule);
    setFormFirstName(p.firstName);
    setFormLastName(p.lastName);
    setFormGender(p.gender);
    setFormBirthDate(p.birthDate ? p.birthDate.slice(0, 10) : '1990-01-01');
    setFormBirthPlace(p.birthPlace || '');
    setFormPhone(p.phone || '');
    setFormEmail(p.email || '');
    setFormPhotoUrl(p.photoUrl || '');
    setFormDept(p.department);
    setFormPosition(p.position);
    setFormStatus(p.status);
    setFormContract(p.contractType);
    setFormHireDate(p.hireDate ? p.hireDate.slice(0, 10) : '');
    setFormJobDescription(p.jobDescription || '');
    setFormWhitelist(p.publicWhitelist || DEFAULT_PUBLIC_WHITELIST);
    setFormError('');
    setShowCreateModal(true);
  };

  // Sauvegarde de l’employé dans PostgreSQL
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setFormError('Session administrative requise. Veuillez vous reconnecter.');
      return;
    }
    setFormSaving(true);
    setFormSaveStep(1);
    setFormError('');

    const payload = {
      id: editingProfile?.id,
      matricule: formMatricule,
      firstName: formFirstName,
      lastName: formLastName,
      gender: formGender,
      birthDate: formBirthDate,
      birthPlace: formBirthPlace,
      phone: formPhone,
      email: formEmail,
      photoUrl: formPhotoUrl,
      department: formDept,
      position: formPosition,
      status: formStatus,
      contractType: formContract,
      hireDate: formHireDate,
      jobDescription: formJobDescription,
      publicWhitelist: formWhitelist,
    };

    try {
      const res = await fetch('/api/rh/profiles', {
        method: editingProfile ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur lors de la sauvegarde dans PostgreSQL.');

      setFormSaveStep(2);
      await Promise.all([loadProfiles(), loadAuditLogs()]);
      setShowCreateModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Erreur de communication avec PostgreSQL.');
    } finally {
      setFormSaving(false);
    }
  };

  // Impression dédiée d'une Carte Professionnelle au format badge portrait vertical
  const handlePrintCard = (p: RHProfile) => {
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) {
      window.alert('Autorisez les fenêtres contextuelles pour imprimer la carte professionnelle.');
      return;
    }

    printWindow.document.write(getPrintableCardsDocument([p], window.location.origin));
    printWindow.document.close();
  };

  // Actions spéciales QR & Archivage
  const handleSpecialAction = async (
    profileId: string,
    actionType: 'regenerate_qr' | 'revoke_qr' | 'archive' | 'restore',
    extra: Record<string, any> = {}
  ) => {
    if (!token) return;
    try {
      const res = await fetch('/api/rh/profiles', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: profileId, actionType, ...extra }),
      });
      if (res.ok) {
        await loadProfiles();
        await loadAuditLogs();
        if (selectedForCard?.id === profileId) {
          const updated = profiles.find((p) => p.id === profileId);
          if (updated) setSelectedForCard(updated);
        }
      }
    } catch (err) {
      console.error('Erreur action spéciale:', err);
    }
  };

  // Téléchargement du QR Code en SVG
  const downloadQRCodeSVG = (p: RHProfile) => {
    const siteUrl = window.location.origin;
    const qrUrl = `${siteUrl}/agent/${p.qrToken}`;
    const svgString = generateQRCodeSVG(qrUrl, { size: 400 });
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.download = `qrcode_${getProfileFileName(p)}.svg`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  const handleDownloadAllQRCodes = () => {
    if (exportableProfiles.length === 0) {
      window.alert('Aucun profil actif avec un QR Code à télécharger.');
      return;
    }

    try {
      const siteUrl = window.location.origin;
      const files: Record<string, Uint8Array> = {};
      const usedFileNames = new Set<string>();
      for (const profile of exportableProfiles) {
        const name = getProfileFileName(profile);
        let fileName = name;
        if (usedFileNames.has(fileName.toLowerCase())) {
          fileName = `${name}_${profile.matricule}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        }
        if (usedFileNames.has(fileName.toLowerCase())) {
          fileName = `${fileName}_${profile.id}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        }
        usedFileNames.add(fileName.toLowerCase());
        const qrSvg = generateQRCodeSVG(`${siteUrl}/agent/${profile.qrToken}`, { size: 400 });
        files[`qrcodes/${fileName}.svg`] = strToU8(qrSvg);
      }

      const archive = zipSync(files, { level: 6 });
      const archiveBlob = new Blob(
        [archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength) as ArrayBuffer],
        { type: 'application/zip' }
      );
      const objectUrl = URL.createObjectURL(archiveBlob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'qrcodes_inptic.zip';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      console.error('Erreur export QR Codes:', error);
      window.alert('Le téléchargement groupé des QR Codes a échoué. Réessayez.');
    }
  };

  const handlePrintAllCards = () => {
    if (exportableProfiles.length === 0) {
      window.alert('Aucun profil actif avec un QR Code pour générer les cartes.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      window.alert('Autorisez les fenêtres contextuelles pour générer les cartes.');
      return;
    }

    printWindow.document.write(
      getPrintableCardsDocument(exportableProfiles, window.location.origin)
    );
    printWindow.document.close();
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Matricule',
      'Nom',
      'Prénom',
      'Sexe',
      'Date de Naissance',
      'Lieu de Naissance',
      'Direction / Service',
      'Fonction',
      'Statut',
      'Type Contrat',
      'Date Embauche',
      'Téléphone',
      'Email',
      'QR Status',
      'Token Public',
    ];

    const rows = filteredProfiles.map((p) => [
      `"${p.matricule}"`,
      `"${p.lastName}"`,
      `"${p.firstName}"`,
      `"${p.gender}"`,
      `"${p.birthDate}"`,
      `"${p.birthPlace}"`,
      `"${p.department}"`,
      `"${p.position}"`,
      `"${p.status}"`,
      `"${p.contractType}"`,
      `"${p.hireDate}"`,
      `"${p.phone}"`,
      `"${p.email}"`,
      `"${p.qrStatus}"`,
      `"${p.qrToken}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inptic_personnel_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleImportFileSelection = async (file: File) => {
    setImportFileName(file.name);
    setImportReport(null);
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Le fichier ne peut pas dépasser 10 Mo.');
      }
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv') {
        setImportText(await file.text());
      } else if (extension === 'xlsx') {
        setImportText(serializeDelimitedRows(await readXlsxRows(file)));
      } else {
        throw new Error('Format non pris en charge. Sélectionnez un fichier CSV ou Excel (.xlsx).');
      }
    } catch (error) {
      setImportText('');
      setImportReport({
        success: 0,
        errors: [error instanceof Error ? error.message : 'Impossible de lire le fichier sélectionné.'],
      });
    }
  };

  const handleExecuteImport = async () => {
    if (!token || !importText.trim()) return;

    const rows = parseDelimitedText(importText);
    if (rows.length < 2) {
      setImportReport({ success: 0, errors: ['Le fichier doit contenir au moins un en-tête et une ligne de données.'] });
      return;
    }

    const rawHeaders = rows[0].map((header) =>
      header.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(),
    );

    const colIndex = {
      matricule: rawHeaders.findIndex((h) => h.includes('matricule')),
      nom: rawHeaders.findIndex((h) => h.includes('nom')),
      prenom: rawHeaders.findIndex((h) => h.includes('prenom')),
      direction: rawHeaders.findIndex((h) => h.includes('direction') || h.includes('service')),
      fonction: rawHeaders.findIndex((h) => h.includes('fonction') || h.includes('poste')),
      email: rawHeaders.findIndex((h) => h.includes('email') || h.includes('courriel')),
      telephone: rawHeaders.findIndex((h) => h.includes('tel') || h.includes('phone')),
    };

    if (colIndex.nom === -1 || colIndex.direction === -1 || colIndex.fonction === -1) {
      setImportReport({
        success: 0,
        errors: ["Colonnes obligatoires manquantes dans l'en-tête (Nom, Direction/Service, Fonction)."],
      });
      return;
    }

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const parts = rows[i];
      const nom = parts[colIndex.nom];
      const prenom = colIndex.prenom !== -1 ? parts[colIndex.prenom] : 'Agent';
      const direction = parts[colIndex.direction];
      const fonction = parts[colIndex.fonction];
      const matricule = colIndex.matricule !== -1 && parts[colIndex.matricule] ? parts[colIndex.matricule] : `INPTIC-IMP-${Date.now().toString(36).slice(-4)}-${i}`;
      const email = colIndex.email !== -1 ? parts[colIndex.email] : '';
      const telephone = colIndex.telephone !== -1 ? parts[colIndex.telephone] : '';

      if (!nom || !direction || !fonction) {
        errors.push(`Ligne ${i + 1} ignorée : nom, direction ou fonction manquant.`);
        continue;
      }

      try {
        const res = await fetch('/api/rh/profiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            matricule,
            firstName: prenom,
            lastName: nom,
            department: direction,
            position: fonction,
            email,
            phone: telephone,
            status: 'contractuel',
            contractType: 'CDI',
          }),
        });

        if (res.ok) {
          successCount++;
        } else {
          const json = await res.json();
          errors.push(`Ligne ${i + 1} (${nom}) : ${json.error || 'Erreur insertion'}`);
        }
      } catch (err: any) {
        errors.push(`Ligne ${i + 1} (${nom}) : ${err.message}`);
      }
    }

    setImportReport({ success: successCount, errors });
    await loadProfiles();
    await loadAuditLogs();
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <RefreshCw size={30} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 pb-24">
      {/* ── BANNIÈRE EN-TÊTE RH ── */}
      <section className="bg-slate-950 text-white border-b border-slate-800">
        <div className="container-x px-4 py-8 md:px-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg">
                <Users size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white sm:text-2xl">
                    Gestion des Profils &amp; Cartes Professionnelles
                  </h1>
                  <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-blue-400/30">
                    DRTI-CDC-2026-001
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Institut National de la Poste, des Technologies de l&apos;Information et de la Communication
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-[#e6c141] transition"
              >
                <Plus size={16} />
                <span>Nouvel Employé</span>
              </button>

              <div className="rounded-xl bg-slate-900 border border-white/10 px-3.5 py-1.5 text-xs text-slate-300">
                <span className="text-slate-500">Connecté en : </span>
                <span className="font-bold text-[#D4AF37] capitalize">{userRole.replace('_', ' ')}</span>
              </div>
              <Link
                href="/"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
              >
                Retour au site
              </Link>
            </div>
          </div>

          {/* Navigation des Onglets Back-office */}
          <div className="mt-8 flex overflow-x-auto border-b border-slate-800 text-sm font-bold">
            <button
              onClick={() => setActiveTab('profils')}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 transition ${
                activeTab === 'profils'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck size={16} />
              <span>Profils du Personnel ({profiles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('qrcodes')}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 transition ${
                activeTab === 'qrcodes'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <QrCode size={16} />
              <span>QR Dynamiques &amp; Cartes</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 transition ${
                activeTab === 'stats'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 size={16} />
              <span>Tableau de Bord &amp; Stats</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 transition ${
                activeTab === 'audit'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Shield size={16} />
              <span>Journal d&apos;Audit ({auditLogs.length})</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── CONTENU DE L'ONGLET 1 : PROFILS DU PERSONNEL ── */}
      {activeTab === 'profils' && (
        <section className="container-x mt-6 px-4 md:px-0">
          {/* Barre d'outils et actions */}
          <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher nom, prénom, matricule, fonction..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Filtre Direction */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="max-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Toutes les directions</option>
                {RH_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Filtre Statut */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="titulaire">Titulaire</option>
                <option value="contractuel">Contractuel</option>
                <option value="stagiaire">Stagiaire</option>
                <option value="detache">Détaché</option>
                <option value="vacataire">Vacataire</option>
              </select>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600"
                />
                <span>Afficher archivés</span>
              </label>
            </div>

            {/* Actions : Ajouter, Import, Export */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <Download size={14} />
                <span>Export Excel / CSV</span>
              </button>

              {!isReadOnly && (
                <>
                  <button
                    onClick={() => {
                      setImportText('');
                      setImportReport(null);
                      setShowImportModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                  >
                    <Upload size={14} />
                    <span>Import CSV</span>
                  </button>

                  <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
                  >
                    <Plus size={16} />
                    <span>Nouvel Employé</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tableau des employés */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Matricule &amp; Agent</th>
                    <th className="px-4 py-3.5">Direction / Service</th>
                    <th className="px-4 py-3.5">Fonction &amp; Statut</th>
                    <th className="px-4 py-3.5">Ancienneté</th>
                    <th className="px-4 py-3.5">QR Code</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <RefreshCw size={24} className="mx-auto animate-spin text-blue-600" />
                        <p className="mt-2 font-medium">Chargement des profils...</p>
                      </td>
                    </tr>
                  ) : filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        Aucun employé ne correspond aux filtres sélectionnés.
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((p) => {
                      const isArch = p.isArchived;
                      const isQrActive = p.qrStatus === 'actif';

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50/80 transition ${isArch ? 'bg-slate-50/50 opacity-60' : ''}`}
                        >
                          {/* Photo & Nom */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shrink-0">
                                {p.photoUrl ? (
                                  <img src={p.photoUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-blue-50 text-blue-600 font-bold">
                                    {p.firstName[0]}
                                    {p.lastName[0]}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">
                                  {p.firstName} {p.lastName}
                                </p>
                                <p className="font-mono text-[11px] text-slate-500">{p.matricule}</p>
                              </div>
                            </div>
                          </td>

                          {/* Direction */}
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-800">{p.department}</span>
                          </td>

                          {/* Fonction & Statut */}
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{p.position}</p>
                            <span
                              className={`inline-block mt-0.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                p.status === 'titulaire'
                                  ? 'bg-blue-100 text-blue-800'
                                  : p.status === 'contractuel'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.status} • {p.contractType}
                            </span>
                          </td>

                          {/* Ancienneté */}
                          <td className="px-4 py-3 text-slate-600">
                            {p.seniorityYears ? `${p.seniorityYears} an(s)` : '< 1 an'}
                            <span className="block text-[10px] text-slate-400">depuis {p.hireDate}</span>
                          </td>

                          {/* QR Code Statut */}
                          <td className="px-4 py-3">
                            {isQrActive ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Actif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
                                <XCircle size={11} />
                                {p.qrStatus}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setViewingProfile(p)}
                                title="Voir la fiche complète"
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                              >
                                <Eye size={15} />
                              </button>

                              <button
                                onClick={() => setSelectedForCard(p)}
                                title="Carte professionnelle & QR"
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#D4AF37]"
                              >
                                <QrCode size={15} />
                              </button>

                              {!isReadOnly && (
                                <>
                                  <button
                                    onClick={() => handleOpenEdit(p)}
                                    title="Modifier"
                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-600"
                                  >
                                    <Edit size={15} />
                                  </button>

                                  {isArch ? (
                                    <button
                                      onClick={() => handleSpecialAction(p.id, 'restore')}
                                      title="Restaurer l'employé"
                                      className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                                    >
                                      <CheckCircle2 size={15} />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setArchivingProfile(p)}
                                      title="Archiver (Soft delete)"
                                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                    >
                                      <Archive size={15} />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── CONTENU DE L'ONGLET 2 : QR CODES & CARTES PROFESSIONNELLES ── */}
      {activeTab === 'qrcodes' && (
        <section className="container-x mt-6 px-4 md:px-0">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Colonne gauche : Liste des agents avec actions QR */}
            <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
              <h2 className="text-base font-black text-slate-900">
                Gestion des QR Codes Dynamiques &amp; Révocation
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Le QR Code encode uniquement l&apos;URL publique non-devinable{' '}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-blue-700">/agent/[token]</code>.
                Chaque consultation d&apos;une carte est enregistrée dans le journal d&apos;audit. Régénérer le token annule immédiatement l&apos;ancien QR.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDownloadAllQRCodes}
                  disabled={exportableProfiles.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download size={15} />
                  Télécharger tous les QR Codes ({exportableProfiles.length})
                </button>
                <button
                  type="button"
                  onClick={handlePrintAllCards}
                  disabled={exportableProfiles.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-slate-950 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Printer size={15} />
                  Exporter toutes les cartes en PDF ({exportableProfiles.length})
                </button>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Les exports groupés suivent les filtres de la liste et incluent les profils actifs uniquement.
                Les cartes s&apos;ouvrent dans la fenêtre d&apos;impression : choisissez « Enregistrer au format PDF » pour les télécharger ensemble.
              </p>

              <div className="mt-4 divide-y divide-slate-100">
                {filteredProfiles.map((p) => {
                  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
                  const publicUrl = `${siteUrl}/agent/${p.qrToken}`;

                  return (
                    <div key={p.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                          <QrCode size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {p.position} • {p.department}
                          </p>
                          <span className="font-mono text-[10px] text-slate-400">
                            Token: {p.qrToken.slice(0, 18)}...
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSelectedForCard(p)}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600 transition"
                        >
                          <Printer size={13} />
                          <span>Voir Carte</span>
                        </button>

                        <button
                          onClick={() => downloadQRCodeSVG(p)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Download size={13} />
                          <span>SVG</span>
                        </button>

                        {!isReadOnly && (
                          <>
                            <button
                              onClick={() => {
                                if (confirm(`Régénérer le QR Code pour ${p.firstName} ${p.lastName} ? L'ancien sera définitivement révoqué.`)) {
                                  handleSpecialAction(p.id, 'regenerate_qr');
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-800 hover:bg-cyan-100 transition"
                            >
                              <RefreshCw size={13} />
                              <span>Régénérer</span>
                            </button>

                            {p.qrStatus === 'actif' ? (
                              <button
                                onClick={() => {
                                  if (confirm(`Révoquer l'accès QR de ${p.firstName} ${p.lastName} ?`)) {
                                    handleSpecialAction(p.id, 'revoke_qr');
                                  }
                                }}
                                className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                              >
                                <XCircle size={13} />
                                <span>Révoquer</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSpecialAction(p.id, 'restore')}
                                className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                              >
                                <Check size={13} />
                                <span>Réactiver</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Colonne droite : Prévisualisation Modèle Carte Professionnelle */}
            <div>
              <div className="sticky top-20 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">Carte Professionnelle Imprimable</h3>
                  {selectedForCard && (
                    <button
                      onClick={() => handlePrintCard(selectedForCard)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow hover:brightness-110"
                    >
                      <Printer size={14} />
                      <span>Imprimer</span>
                    </button>
                  )}
                </div>

                {selectedForCard ? (
                  <div className="mt-4">
                    {/* Carte Verticale Style Modèle Référence */}
                    <div
                      id="printable-card"
                      className="relative mx-auto w-full max-w-[270px] overflow-hidden rounded-3xl border border-slate-300 bg-white text-slate-900 shadow-2xl flex flex-col items-center text-center"
                      style={{ aspectRatio: '53.98/85.6' }}
                    >
                      {/* En-tête avec le logo officiel */}
                      <div className="w-full bg-blue-900 px-2 py-2 relative">
                        <Image
                          src="/logoinptic.png"
                          alt="Logo INPTIC"
                          width={1698}
                          height={962}
                          className="mx-auto h-auto w-[56%] max-w-full rounded-md bg-white p-1 object-contain"
                        />
                      </div>

                      {/* Photo circulaire avec anneau cyan */}
                      <div className="mt-2 relative z-10">
                        <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-cyan-500 bg-slate-900 shadow-lg">
                          {selectedForCard.photoUrl ? (
                            <img src={selectedForCard.photoUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-blue-950 text-blue-200 text-xs font-bold">
                              PHOTO
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Corps de la carte : Nom, Poste, Matricule & QR Code centré en bas */}
                      <div className="p-3 pt-1 pb-2 flex flex-col items-center justify-between flex-1 w-full">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase leading-snug">
                            {selectedForCard.firstName} {selectedForCard.lastName}
                          </h4>
                          <p className="text-xs font-bold text-sky-600 mt-0.5">
                            {selectedForCard.position}
                          </p>
                          <p className="text-[10px] font-mono font-bold text-[#D4AF37] mt-1">
                            MATR: {selectedForCard.matricule}
                          </p>
                        </div>

                        {/* QR Code centré */}
                        <div
                          className="my-1 h-24 w-24 rounded-xl bg-white p-1 border border-slate-200 shadow-sm flex items-center justify-center"
                          dangerouslySetInnerHTML={{
                            __html: generateQRCodeSVG(
                              `${typeof window !== 'undefined' ? window.location.origin : 'https://inptic.ga'}/agent/${selectedForCard.qrToken}`,
                              { size: 72, margin: 1 }
                            ),
                          }}
                        />

                        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100 pt-1.5 w-full">
                          Carte Professionnelle Officielle
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                      <p className="font-bold text-slate-800">Statut du QR :</p>
                      <p className="mt-0.5">
                        Statut :{' '}
                        <span className="font-semibold text-emerald-700 capitalize">
                          {selectedForCard.qrStatus}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Token : {selectedForCard.qrToken}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                    Sélectionnez un employé dans la liste pour prévisualiser sa carte professionnelle et son QR Code.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CONTENU DE L'ONGLET 3 : TABLEAU DE BORD STATISTIQUE (BLOC B3) ── */}
      {activeTab === 'stats' && (
        <section className="container-x mt-6 px-4 md:px-0 space-y-6">
          {/* Cartes d'indicateurs clés */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Effectif Global
              </span>
              <p className="mt-2 text-3xl font-black text-slate-900">{stats.total}</p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">
                {stats.active} en activité • {stats.archived} archivé(s)
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Parité Hommes / Femmes
              </span>
              <p className="mt-2 text-3xl font-black text-blue-600">
                {stats.males} <span className="text-sm font-normal text-slate-400">H</span> /{' '}
                {stats.females} <span className="text-sm font-normal text-slate-400">F</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {stats.total > 0 ? Math.round((stats.females / stats.total) * 100) : 0}% de personnel féminin
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Titulaires Fonction Publique
              </span>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {stats.statuts['titulaire'] || 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {stats.statuts['contractuel'] || 0} contractuels • {stats.statuts['stagiaire'] || 0} stagiaires
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                QR Codes Actifs
              </span>
              <p className="mt-2 text-3xl font-black text-[#D4AF37]">
                {profiles.filter((p) => p.qrStatus === 'actif').length}
              </p>
              <p className="mt-1 text-xs text-slate-500">Cartes professionnelles vérifiables</p>
            </div>
          </div>

          {/* Graphiques et Répartitions */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Répartition par Direction / Service */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm font-black text-slate-900">
                Effectif par Direction &amp; Service
              </h3>
              <div className="mt-4 space-y-3">
                {Object.entries(stats.depts).map(([dept, count]) => {
                  const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={dept}>
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span className="truncate max-w-[280px]">{dept}</span>
                        <span>
                          {count} ({percent}%)
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pyramide des âges & Ancienneté */}
            <div className="space-y-6">
              {/* Tranches d'âge */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <h3 className="text-sm font-black text-slate-900">Répartition par Tranches d&apos;Âge</h3>
                <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-semibold">&lt; 30 ans</span>
                    <p className="mt-1 text-xl font-black text-slate-900">{stats.ages.moins30}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-semibold">30 - 45 ans</span>
                    <p className="mt-1 text-xl font-black text-blue-600">{stats.ages.entre30et45}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-semibold">45 - 55 ans</span>
                    <p className="mt-1 text-xl font-black text-cyan-600">{stats.ages.entre45et55}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-semibold">&gt; 55 ans</span>
                    <p className="mt-1 text-xl font-black text-[#D4AF37]">{stats.ages.plus55}</p>
                  </div>
                </div>
              </div>

              {/* Ancienneté */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <h3 className="text-sm font-black text-slate-900">Répartition par Ancienneté</h3>
                <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-semibold">&lt; 2 ans</span>
                    <p className="mt-1 text-xl font-black text-slate-900">{stats.anciennetes.moins2}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-semibold">2 - 5 ans</span>
                    <p className="mt-1 text-xl font-black text-blue-600">{stats.anciennetes.entre2et5}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-semibold">5 - 10 ans</span>
                    <p className="mt-1 text-xl font-black text-emerald-600">{stats.anciennetes.entre5et10}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-slate-400 font-semibold">&gt; 10 ans</span>
                    <p className="mt-1 text-xl font-black text-[#D4AF37]">{stats.anciennetes.plus10}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CONTENU DE L'ONGLET 4 : JOURNAL D'AUDIT & SÉCURITÉ ── */}
      {activeTab === 'audit' && (
        <section className="container-x mt-6 px-4 md:px-0">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-base font-black text-slate-900">
              Journal d&apos;Audit des Opérations RH &amp; Accès
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Traçabilité des créations, modifications, révocations, archivages et scans de cartes professionnelles.
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date &amp; Heure</th>
                    <th className="px-4 py-3">Utilisateur</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Agent Cible</th>
                    <th className="px-4 py-3">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Aucun événement d&apos;audit enregistré.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{log.userEmail}</td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{log.targetName || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">
                          <span>{log.details || '—'}</span>
                          {log.action === 'SCAN_CARD' && log.ipAddress && (
                            <span className="mt-1 block font-mono text-[10px] text-slate-400">
                              Adresse IP : {log.ipAddress}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── MODAL NOUVEL EMPLOYÉ / MODIFICATION ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative my-8 w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button
              disabled={formSaving}
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900">
              {editingProfile ? 'Modifier le profil employé' : 'Créer une fiche employé'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Renseignez les données administratives et personnelles du personnel de l&apos;INPTIC.
            </p>

            {formError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {formError}
              </div>
            )}

            {formSaving && (
              <div role="status" aria-live="polite" className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-bold text-blue-900">
                  {formSaveStep === 1 ? 'Envoi et enregistrement du profil…' : 'Actualisation de l’annuaire et du journal…'}
                </p>
                <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    'Envoi et enregistrement du profil',
                    'Actualisation de l’annuaire et du journal',
                  ].map((step, index) => {
                    const stepNumber = (index + 1) as 1 | 2;
                    const isComplete = stepNumber < formSaveStep;
                    const isCurrent = stepNumber === formSaveStep;

                    return (
                      <li key={step} className={`flex items-center gap-2 text-xs ${isCurrent ? 'font-bold text-blue-900' : isComplete ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {isComplete ? (
                          <CheckCircle2 size={16} className="shrink-0" />
                        ) : isCurrent ? (
                          <RefreshCw size={15} className="shrink-0 animate-spin" />
                        ) : (
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[9px]">{stepNumber}</span>
                        )}
                        <span>{step}</span>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-3 text-[11px] text-blue-700">Cela peut prendre quelques secondes. Ne fermez pas cette fenêtre.</p>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
              {/* Identité & Matricule */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Matricule INPTIC *</label>
                  <input
                    type="text"
                    required
                    value={formMatricule}
                    onChange={(e) => setFormMatricule(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Nom de famille *</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs uppercase focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* État civil */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Genre</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as RHGender)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Date de naissance</label>
                  <input
                    type="date"
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Lieu de naissance</label>
                  <input
                    type="text"
                    value={formBirthPlace}
                    onChange={(e) => setFormBirthPlace(e.target.value)}
                    placeholder="Libreville"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Coordonnées */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Téléphone professionnel</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Courriel professionnel</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Photo de l&apos;employé</label>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">
                      {formPhotoUrl ? (
                        <img src={formPhotoUrl} alt="Aperçu" className="h-full w-full object-cover" />
                      ) : (
                        <User size={18} className="text-slate-400" />
                      )}
                    </div>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs">
                      <Upload size={13} />
                      <span>Parcourir...</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (uploadEvent) => {
                              if (typeof uploadEvent.target?.result === 'string') {
                                setFormPhotoUrl(uploadEvent.target.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Affectation & Fonction */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Direction / Service *</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  >
                    {RH_DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Fonction / Intitulé de poste *</label>
                  <input
                    type="text"
                    required
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    placeholder="Ex. Enseignant-Chercheur, Chef de service..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Contrat & Prise de fonction */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Statut administratif</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as RHStaffStatus)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  >
                    <option value="titulaire">Titulaire</option>
                    <option value="contractuel">Contractuel</option>
                    <option value="stagiaire">Stagiaire</option>
                    <option value="detache">Détaché</option>
                    <option value="vacataire">Vacataire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Type de contrat</label>
                  <select
                    value={formContract}
                    onChange={(e) => setFormContract(e.target.value as RHContractType)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  >
                    <option value="Fonction Publique">Fonction Publique</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Convention de Stage">Convention de Stage</option>
                    <option value="Vacation">Vacation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Date d&apos;embauche</label>
                  <input
                    type="date"
                    value={formHireDate}
                    onChange={(e) => setFormHireDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Fiche de poste complète */}
              <div>
                <label className="block text-xs font-bold text-slate-700">Fiche de poste &amp; Missions principales</label>
                <textarea
                  rows={3}
                  value={formJobDescription}
                  onChange={(e) => setFormJobDescription(e.target.value)}
                  placeholder="Missions, responsabilités, activités récurrentes..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>

              {/* ⚠ CONFIDENTIALITÉ : Configuration de la Liste Blanche (DRTI-CDC-2026-001) */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-600" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Champs publics exposés au scan du QR Code (Liste Blanche)
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Par défaut prudent : seules photo, nom, prénom, fonction, direction et statut sont exposés. Cochez pour autoriser l&apos;exposition des données sensibles.
                </p>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formWhitelist.photo}
                      onChange={(e) => setFormWhitelist({ ...formWhitelist, photo: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Photo</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formWhitelist.lastName && formWhitelist.firstName}
                      onChange={(e) =>
                        setFormWhitelist({
                          ...formWhitelist,
                          lastName: e.target.checked,
                          firstName: e.target.checked,
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Nom / Prénom</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formWhitelist.position}
                      onChange={(e) => setFormWhitelist({ ...formWhitelist, position: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Fonction</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formWhitelist.department}
                      onChange={(e) => setFormWhitelist({ ...formWhitelist, department: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Direction</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formWhitelist.status}
                      onChange={(e) => setFormWhitelist({ ...formWhitelist, status: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Statut</span>
                  </label>
                  <label className="flex items-center gap-2 font-semibold text-amber-900">
                    <input
                      type="checkbox"
                      checked={formWhitelist.gender}
                      onChange={(e) => setFormWhitelist({ ...formWhitelist, gender: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Genre</span>
                  </label>
                  <label className="flex items-center gap-2 font-semibold text-amber-900">
                    <input
                      type="checkbox"
                      checked={formWhitelist.birthDate}
                      onChange={(e) => setFormWhitelist({ ...formWhitelist, birthDate: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Date de naissance</span>
                  </label>
                  <label className="flex items-center gap-2 font-semibold text-amber-900">
                    <input
                      type="checkbox"
                      checked={formWhitelist.birthPlace}
                      onChange={(e) => setFormWhitelist({ ...formWhitelist, birthPlace: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Lieu de naissance</span>
                  </label>
                  <label className="flex items-center gap-2 font-semibold text-amber-900">
                    <input
                      type="checkbox"
                      checked={formWhitelist.email}
                      onChange={(e) => setFormWhitelist({ ...formWhitelist, email: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Courriel</span>
                  </label>
                  <label className="flex items-center gap-2 font-semibold text-amber-900">
                    <input
                      type="checkbox"
                      checked={formWhitelist.phone}
                      onChange={(e) => setFormWhitelist({ ...formWhitelist, phone: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Téléphone</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={formSaving}
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSaving ? (formSaveStep === 1 ? 'Enregistrement...' : 'Actualisation...') : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL FICHE COMPLÈTE & HISTORIQUE ── */}
      {viewingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative my-8 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setViewingProfile(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                {viewingProfile.photoUrl ? (
                  <img src={viewingProfile.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-blue-900 text-blue-100 font-bold text-lg">
                    {viewingProfile.firstName[0]}
                    {viewingProfile.lastName[0]}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {viewingProfile.firstName} {viewingProfile.lastName}
                </h3>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  {viewingProfile.position}
                </p>
                <span className="font-mono text-xs text-slate-400">Matricule: {viewingProfile.matricule}</span>
              </div>
            </div>

            {/* Fiche de poste */}
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider">Fiche de Poste &amp; Missions</h4>
              <p className="mt-2 text-slate-600 leading-relaxed">
                {viewingProfile.jobDescription || 'Aucune description détaillée enregistrée.'}
              </p>
            </div>

            {/* Historique des modifications */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Historique des modifications du profil
              </h4>
              <div className="mt-3 max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                {viewingProfile.history?.length > 0 ? (
                  viewingProfile.history.map((h, i) => (
                    <div key={i} className="py-2.5">
                      <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                        <span>{new Date(h.changedAt).toLocaleString('fr-FR')}</span>
                        <span className="font-bold text-slate-700">{h.changedBy}</span>
                      </div>
                      <p className="mt-0.5 font-semibold text-slate-800">{h.action}</p>
                      <p className="text-slate-600">{h.details}</p>
                    </div>
                  ))
                ) : (
                  <p className="py-2 text-slate-500">Aucune modification archivée.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingProfile(null)}
                className="rounded-xl bg-slate-100 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ARCHIVAGE (SOFT DELETE) ── */}
      {archivingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Archiver l&apos;employé (Soft Delete)</h3>
            <p className="mt-2 text-xs text-slate-600">
              Conformément à la directive, le profil de{' '}
              <b>
                {archivingProfile.firstName} {archivingProfile.lastName}
              </b>{' '}
              ne sera jamais définitivement supprimé, mais archivé. Son QR Code sera immédiatement désactivé.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700">Motif de l&apos;archivage</label>
              <select
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                <option value="Fin de contrat">Fin de contrat</option>
                <option value="Démission">Démission</option>
                <option value="Départ à la retraite">Départ à la retraite</option>
                <option value="Mutation">Mutation vers une autre administration</option>
                <option value="Révocation administrative">Révocation administrative</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3 items-center">
              <button
                onClick={() => setArchivingProfile(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <DeleteButton
                onDelete={async () => {
                  await handleSpecialAction(archivingProfile.id, 'archive', { archiveReason });
                  setArchivingProfile(null);
                }}
                label="Archiver"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL IMPORT CSV ── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-black text-slate-900">Importer des profils (CSV / Excel)</h3>
            <p className="mt-1 text-xs text-slate-500">
              Sélectionnez un fichier CSV ou Excel (.xlsx), ou collez son contenu ci-dessous.
            </p>

            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700 hover:bg-blue-100">
              <FileSpreadsheet size={16} />
              <span>{importFileName || 'Choisir un fichier CSV ou Excel (.xlsx)'}</span>
              <input
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleImportFileSelection(file);
                  event.target.value = '';
                }}
              />
            </label>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600 font-mono">
              En-têtes acceptés : Matricule, Nom, Prénom, Direction, Fonction, Email, Téléphone
            </div>

            <textarea
              rows={8}
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setImportFileName('');
                setImportReport(null);
              }}
              placeholder={`Matricule;Nom;Prénom;Direction;Fonction;Email&#10;INPTIC-042;MBOUMBA;Jean;Service Scolarité;Agent;jean@inptic.ga`}
              className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-xs font-mono focus:border-blue-500 focus:outline-none"
            />

            {importReport && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs">
                <p className={`font-bold ${importReport.errors.length > 0 ? 'text-slate-700' : 'text-emerald-700'}`}>
                  {importReport.success > 0
                    ? `${importReport.success} profil(s) importé(s) avec succès.`
                    : 'Aucun profil importé.'}
                </p>
                {importReport.errors.length > 0 && (
                  <ul className="mt-2 space-y-1 text-red-600">
                    {importReport.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Fermer
              </button>
              <button
                onClick={handleExecuteImport}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Lancer l&apos;importation
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-card,
          #printable-card * {
            visibility: visible !important;
          }
          #printable-card {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) scale(1.5) !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-color: #0f172a !important;
            background-color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </main>
  );
}
