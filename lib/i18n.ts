import { resources } from '@/next.config';
import { cookieConsentCopy } from '@/lib/cookie-consent-copy';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const supportedLngs = Object.keys(resources) as Array<keyof typeof resources>;

for (const [language, translation] of Object.entries(cookieConsentCopy)) {
  Object.assign(resources[language as keyof typeof resources].translation, { cookieConsent: translation });
}

function deepMerge(target: any, source: any) {
  if (!target) return source;
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
const heroTranslations = {
  fr: { welcome: "Bienvenue à l'INPTIC Gabon", intro: "Rejoignez la première université du numérique au Gabon et façonnez votre avenir dans les technologies de l'information.", discover: 'Découvrir nos formations', find: 'Trouver ma formation', studyDomain: "Domaine d'étude", studyLevel: "Niveau d'études", level: 'Niveau', search: 'Rechercher', advice: "Conseil : Affinez votre recherche en sélectionnant un domaine et un niveau d'études.", result: 'Résultat de votre recherche', recommended: 'Formations recommandées', closeRecommendations: 'Fermer les recommandations', management: 'Management des TIC', networks: 'Réseaux et Systèmes Numériques', audiovisual: 'Audiovisuel', qualifying: 'Formations qualifiantes', certifying: 'Formations certifiantes', bot: 'INPTIC-Bot', visit3d: 'Visite 3D', application: 'Candidature', alumni: 'Alumni', annonces: 'Annonces', andg: 'ANDG', andcg: 'ANDCG', botLabel: 'Chat avec le bot INPTIC', visit3dLabel: 'Visiter le campus en 3D', applicationLabel: 'Accéder au formulaire de candidature', alumniLabel: 'Accéder à la plateforme Alumni', annoncesLabel: 'Voir les annonces officielles', andgLabel: 'Site de l\'Agence Nationale du Numérique du Gabon', andcgLabel: 'Visiter le site de l’ANDCG', browse: 'Parcourez' },
  en: { welcome: 'Welcome to INPTIC Gabon', intro: 'Join Gabon’s leading digital university and shape your future in information technology.', discover: 'Discover our programs', find: 'Find my program', studyDomain: 'Study area', studyLevel: 'Study level', level: 'Level', search: 'Search', advice: 'Tip: refine your search by selecting an area and a study level.', result: 'Search result', recommended: 'Recommended programs', closeRecommendations: 'Close recommendations', management: 'ICT Management', networks: 'Networks and Digital Systems', audiovisual: 'Audiovisual', qualifying: 'Qualifying programs', certifying: 'Certifying programs', bot: 'INPTIC Bot', visit3d: '3D visit', application: 'Application', alumni: 'Alumni', annonces: 'Announcements', andcg: 'ANDCG', botLabel: 'Chat with the INPTIC bot', visit3dLabel: 'Visit the campus in 3D', applicationLabel: 'Open the application form', alumniLabel: 'Open the Alumni platform', annoncesLabel: 'View official announcements', andcgLabel: 'Visit the ANDCG website', browse: 'Scroll' },
  zh: { welcome: '欢迎来到加蓬INPTIC', intro: '加入加蓬领先的数字大学，在信息技术领域塑造您的未来。', discover: '探索我们的课程', find: '查找我的课程', studyDomain: '学习领域', studyLevel: '学习层次', level: '层次', search: '搜索', advice: '提示：选择学习领域和层次来缩小搜索范围。', result: '搜索结果', recommended: '推荐课程', closeRecommendations: '关闭推荐', management: '信息通信技术管理', networks: '网络与数字系统', audiovisual: '视听', qualifying: '资格培训', certifying: '认证培训', bot: 'INPTIC助手', visit3d: '三维参观', application: '申请', alumni: '校友', annonces: '公告', andg: 'ANDG', andcg: 'ANDCG', botLabel: '与INPTIC助手聊天', visit3dLabel: '三维参观校园', applicationLabel: '打开申请表', alumniLabel: '打开校友平台', annoncesLabel: '查看官方公告', andcgLabel: '访问ANDCG网站', browse: '浏览' },
  ar: { welcome: 'مرحبًا بكم في المعهد الوطني للبريد وتقنيات المعلومات والاتصالات', intro: 'انضموا إلى الجامعة الرقمية الرائدة في الغابون وشكّلوا مستقبلكم في مجال تقنيات المعلومات.', discover: 'اكتشف تكويناتنا', find: 'ابحث عن تكويني', studyDomain: 'مجال الدراسة', studyLevel: 'المستوى الدراسي', level: 'المستوى', search: 'بحث', advice: 'نصيحة: حسّن البحث باختيار مجال ومستوى دراسي.', result: 'نتيجة البحث', recommended: 'التكوينات المقترحة', closeRecommendations: 'إغلاق الاقتراحات', management: 'إدارة تقنيات المعلومات والاتصالات', networks: 'الشبكات والأنظمة الرقمية', audiovisual: 'السمعي البصري', qualifying: 'تكوينات مؤهلة', certifying: 'تكوينات معتمدة', bot: 'مساعد المعهد', visit3d: 'زيارة ثلاثية الأبعاد', application: 'الترشح', alumni: 'الخريجون', annonces: 'الإعلانات', andg: 'ANDG', andcg: 'ANDCG', botLabel: 'الدردشة مع مساعد المعهد', visit3dLabel: 'زيارة الحرم ثلاثية الأبعاد', applicationLabel: 'فتح استمارة الترشح', alumniLabel: 'فتح منصة الخريجين', annoncesLabel: 'عرض الإعلانات الرسمية', andcgLabel: 'زيارة موقع ANDCG', browse: 'تصفح' },
};
for (const [language, translation] of Object.entries(heroTranslations)) {
  Object.assign(resources[language as keyof typeof resources].translation, { hero: translation });
}
const chatTranslations = {
  fr: { welcome: "Bonjour ! Je suis l’assistant IA de l’INPTIC. Que souhaitez-vous savoir sur nos formations, les admissions ou la vie étudiante ?", assistant: 'Assistant IA de l’INPTIC', placeholder: 'Posez votre question à l’INPTIC…', message: 'Message à envoyer', open: 'Ouvrir le chat', close: 'Fermer le chat', newConversation: 'Nouvelle conversation', showSidebar: 'Afficher la barre latérale', hideSidebar: 'Masquer la barre latérale', conversations: 'Anciennes conversations', send: 'Envoyer le message', suggestions: ['Quelles formations propose l’INPTIC ?', 'Comment déposer un dossier ?', 'Quels sont les débouchés en cybersécurité ?'] },
  en: { welcome: 'Hello! I am the INPTIC AI assistant. What would you like to know about our programs, admissions or student life?', assistant: 'INPTIC AI Assistant', placeholder: 'Ask INPTIC your question…', message: 'Message to send', open: 'Open chat', close: 'Close chat', newConversation: 'New conversation', showSidebar: 'Show sidebar', hideSidebar: 'Hide sidebar', conversations: 'Previous conversations', send: 'Send message', suggestions: ['What programs does INPTIC offer?', 'How do I submit an application?', 'What are the career opportunities in cybersecurity?'] },
  zh: { welcome: '您好！我是INPTIC人工智能助手。您想了解课程、招生还是学生生活？', assistant: 'INPTIC人工智能助手', placeholder: '向INPTIC提问…', message: '要发送的消息', open: '打开聊天', close: '关闭聊天', newConversation: '新对话', showSidebar: '显示侧栏', hideSidebar: '隐藏侧栏', conversations: '历史对话', send: '发送消息', suggestions: ['INPTIC提供哪些课程？', '如何提交申请？', '网络安全有哪些职业方向？'] },
  ar: { welcome: 'مرحبًا! أنا المساعد الذكي للمعهد. ماذا تريدون أن تعرفوا عن التكوين أو القبول أو الحياة الطلابية؟', assistant: 'المساعد الذكي للمعهد', placeholder: 'اطرح سؤالك على المعهد…', message: 'الرسالة المراد إرسالها', open: 'فتح الدردشة', close: 'إغلاق الدردشة', newConversation: 'محادثة جديدة', showSidebar: 'إظهار الشريط الجانبي', hideSidebar: 'إخفاء الشريط الجانبي', conversations: 'المحادثات السابقة', send: 'إرسال الرسالة', suggestions: ['ما التكوينات التي يقدمها المعهد؟', 'كيف أودع ملفًا؟', 'ما فرص العمل في الأمن السيبراني؟'] },
};
for (const [language, translation] of Object.entries(chatTranslations)) {
  Object.assign(resources[language as keyof typeof resources].translation, { chat: translation });
}
const newsFeedTranslations = {
  fr: { label: 'Flux d’actualités', innovationTitle: 'Semaine de l’innovation 2025', innovationText: 'Conférences, ateliers et hackathons autour des technologies émergentes.', alumniTitle: 'Lancement de la plateforme INPTIC Alumni', alumniText: 'Un nouveau réseau pour réunir diplômés, étudiants et partenaires.', researchTitle: 'Nos chercheurs présentent leurs travaux', researchText: 'Les projets de l’Institut en IA, cybersécurité et transformation numérique.', allNews: 'Voir toutes les actualités →' },
  en: { label: 'News feed', innovationTitle: '2025 Innovation Week', innovationText: 'Conferences, workshops and hackathons focused on emerging technologies.', alumniTitle: 'Launch of the INPTIC Alumni platform', alumniText: 'A new network bringing together graduates, students and partners.', researchTitle: 'Our researchers present their work', researchText: 'Institute projects in AI, cybersecurity and digital transformation.', allNews: 'View all news →' },
  zh: { label: '新闻动态', innovationTitle: '2025创新周', innovationText: '围绕新兴技术举办会议、工作坊和黑客松。', alumniTitle: 'INPTIC校友平台上线', alumniText: '连接毕业生、学生和合作伙伴的新网络。', researchTitle: '我们的研究人员展示成果', researchText: '学院在人工智能、网络安全和数字化转型方面的项目。', allNews: '查看全部新闻 →' },
  ar: { label: 'آخر الأخبار', innovationTitle: 'أسبوع الابتكار 2025', innovationText: 'مؤتمرات وورشات وهاكاثونات حول التقنيات الناشئة.', alumniTitle: 'إطلاق منصة خريجي المعهد', alumniText: 'شبكة جديدة تجمع الخريجين والطلاب والشركاء.', researchTitle: 'باحثونا يعرضون أعمالهم', researchText: 'مشاريع المعهد في الذكاء الاصطناعي والأمن السيبراني والتحول الرقمي.', allNews: 'عرض كل الأخبار →' },
};
for (const [language, translation] of Object.entries(newsFeedTranslations)) {
  Object.assign(resources[language as keyof typeof resources].translation, { newsFeed: translation });
}
const studentDashboardTranslations = {
  fr: { space: 'Espace étudiant', close: 'Fermer la rubrique', closeTitle: 'Fermer', hello: 'Bonjour {{name}}.', profile: 'Profil', profileDescription: 'Vos informations personnelles et académiques.', courses: 'Cours', coursesDescription: 'Votre parcours et vos informations pédagogiques.', schedule: 'Emploi du temps', scheduleDescription: 'Votre calendrier de cours, examens et événements.', degrees: 'Diplômes', degreesDescription: 'Vos diplômes obtenus et votre année de formation.', transcripts: 'Relevés', transcriptsDescription: 'Vos relevés de notes disponibles.', internships: 'Stages', internshipsDescription: 'Vos conventions et documents de stage.', certificates: 'Attestations', certificatesDescription: 'Vos attestations de scolarité, stage et réussite.', fullName: 'Nom complet', email: 'Email', phone: 'Téléphone', level: 'Niveau', program: 'Parcours', cohort: 'Promotion', year: 'Année', bio: 'Biographie', notProvided: 'À renseigner', courseCatalog: 'Le catalogue détaillé des cours sera publié ici par l’administration.', scheduleUnavailable: 'Votre emploi du temps apparaîtra ici dès sa mise à disposition.', calendarUnpublished: 'Calendrier non publié', noDegree: 'Aucun diplôme enregistré', noDocument: 'Aucun document disponible', document: 'Document', documentUnavailable: 'Les documents associés à cette rubrique apparaîtront ici après leur dépôt ou leur délivrance.', consult: 'Consulter' },
  en: { space: 'Student space', close: 'Close section', closeTitle: 'Close', hello: 'Hello {{name}}.', profile: 'Profile', profileDescription: 'Your personal and academic information.', courses: 'Courses', coursesDescription: 'Your program and academic information.', schedule: 'Schedule', scheduleDescription: 'Your class, exam and event calendar.', degrees: 'Degrees', degreesDescription: 'Your earned degrees and training year.', transcripts: 'Transcripts', transcriptsDescription: 'Your available transcripts.', internships: 'Internships', internshipsDescription: 'Your internship agreements and documents.', certificates: 'Certificates', certificatesDescription: 'Your enrollment, internship and achievement certificates.', fullName: 'Full name', email: 'Email', phone: 'Phone', level: 'Level', program: 'Program', cohort: 'Cohort', year: 'Year', bio: 'Biography', notProvided: 'Not provided', courseCatalog: 'The detailed course catalog will be published here by the administration.', scheduleUnavailable: 'Your schedule will appear here once it is available.', calendarUnpublished: 'Schedule not published', noDegree: 'No degree recorded', noDocument: 'No document available', document: 'Document', documentUnavailable: 'Documents for this section will appear here after submission or issuance.', consult: 'View' },
  zh: { space: '学生空间', close: '关闭栏目', closeTitle: '关闭', hello: '您好，{{name}}。', profile: '资料', profileDescription: '您的个人和学业信息。', courses: '课程', coursesDescription: '您的学习方向和教学信息。', schedule: '课程表', scheduleDescription: '您的课程、考试和活动日程。', degrees: '学位与文凭', degreesDescription: '您获得的文凭和培训年份。', transcripts: '成绩单', transcriptsDescription: '可用的成绩单。', internships: '实习', internshipsDescription: '您的实习协议和文件。', certificates: '证明文件', certificatesDescription: '您的在学、实习和结业证明。', fullName: '姓名', email: '电子邮箱', phone: '电话', level: '学历', program: '学习方向', cohort: '届次', year: '年份', bio: '个人简介', notProvided: '待填写', courseCatalog: '详细课程目录将由学院管理部门发布在此处。', scheduleUnavailable: '课程表发布后将在此处显示。', calendarUnpublished: '课程表尚未发布', noDegree: '暂无文凭记录', noDocument: '暂无文件', document: '文件', documentUnavailable: '提交或签发后，相关文件将在此处显示。', consult: '查看' },
  ar: { space: 'فضاء الطالب', close: 'إغلاق القسم', closeTitle: 'إغلاق', hello: 'مرحبًا {{name}}.', profile: 'الملف الشخصي', profileDescription: 'معلوماتكم الشخصية والأكاديمية.', courses: 'الدروس', coursesDescription: 'مساركم ومعلوماتكم التعليمية.', schedule: 'الجدول الزمني', scheduleDescription: 'جدول الدروس والامتحانات والفعاليات.', degrees: 'الشهادات', degreesDescription: 'الشهادات المحصل عليها وسنة التكوين.', transcripts: 'كشوف النقاط', transcriptsDescription: 'كشوف نقاطكم المتاحة.', internships: 'التدريب', internshipsDescription: 'اتفاقيات ووثائق التدريب.', certificates: 'الإفادات', certificatesDescription: 'إفادات الدراسة والتدريب والنجاح.', fullName: 'الاسم الكامل', email: 'البريد الإلكتروني', phone: 'الهاتف', level: 'المستوى', program: 'المسار', cohort: 'الفوج', year: 'السنة', bio: 'السيرة الذاتية', notProvided: 'يُرجى الإدخال', courseCatalog: 'سيتم نشر الكتالوج التفصيلي للدروس هنا من طرف الإدارة.', scheduleUnavailable: 'سيظهر جدولكم هنا عند توفره.', calendarUnpublished: 'الجدول غير منشور', noDegree: 'لا توجد شهادة مسجلة', noDocument: 'لا توجد وثائق متاحة', document: 'وثيقة', documentUnavailable: 'ستظهر الوثائق المرتبطة بهذا القسم هنا بعد إيداعها أو إصدارها.', consult: 'عرض' },
};
for (const [language, translation] of Object.entries(studentDashboardTranslations)) Object.assign(resources[language as keyof typeof resources].translation, { studentDashboard: translation });
const directorDashboardTranslations = {
  fr: { space: 'Espace directeur', close: 'Fermer la rubrique', students: 'Étudiants', studentsDescription: 'Consultez les profils enregistrés.', files: 'Dossiers', filesDescription: 'Examinez et traitez les candidatures.', notifications: 'Notifications', notificationsDescription: 'Suivez les messages envoyés aux candidats.', profile: 'Profil DG', profileDescription: 'Informations de votre espace directeur.', director: 'Directeur général', selectStudent: 'Sélectionnez un étudiant pour voir son profil complet.', noProfile: 'Aucun profil enregistré.', openFile: 'Ouvrir le dossier →', accept: 'Accepter', reject: 'Refuser', pending: 'Dossier en attente', approved: 'Dossier validé', rejected: 'Dossier refusé', notProvided: 'À renseigner', notAssigned: 'Non attribué', fieldTrack: 'Filière', fieldLevel: 'Niveau', fieldCohort: 'Promotion', fieldDiploma: 'Diplôme', fieldPhone: 'Téléphone', fieldFile: 'Dossier', documents: 'Pièces justificatives', view: 'Consulter', noDocuments: 'Aucun document téléchargé.', sentNotifications: 'Notifications envoyées', adminBio: 'Gestion des candidatures, validation des dossiers et suivi des étudiants.' },
  en: { space: 'Director space', close: 'Close section', students: 'Students', studentsDescription: 'View registered profiles.', files: 'Applications', filesDescription: 'Review and process applications.', notifications: 'Notifications', notificationsDescription: 'Track messages sent to applicants.', profile: 'Director profile', profileDescription: 'Information about your director space.', director: 'Director General', selectStudent: 'Select a student to view the complete profile.', noProfile: 'No profile registered.', openFile: 'Open application →', accept: 'Accept', reject: 'Reject', pending: 'Application pending', approved: 'Application approved', rejected: 'Application rejected', notProvided: 'Not provided', notAssigned: 'Not assigned', fieldTrack: 'Program', fieldLevel: 'Level', fieldCohort: 'Cohort', fieldDiploma: 'Degree', fieldPhone: 'Phone', fieldFile: 'Application', documents: 'Supporting documents', view: 'View', noDocuments: 'No documents uploaded.', sentNotifications: 'Sent notifications', adminBio: 'Manage applications, validate files and monitor students.' },
  zh: { space: '院长空间', close: '关闭栏目', students: '学生', studentsDescription: '查看已登记的学生资料。', files: '申请材料', filesDescription: '审核和处理申请。', notifications: '通知', notificationsDescription: '跟踪发送给申请人的消息。', profile: '院长资料', profileDescription: '院长空间信息。', director: '院长', selectStudent: '请选择学生以查看完整资料。', noProfile: '暂无登记资料。', openFile: '打开申请 →', accept: '接受', reject: '拒绝', pending: '申请待审核', approved: '申请已通过', rejected: '申请未通过', notProvided: '待填写', notAssigned: '未分配', fieldTrack: '课程', fieldLevel: '学历', fieldCohort: '届次', fieldDiploma: '文凭', fieldPhone: '电话', fieldFile: '申请材料', documents: '证明文件', view: '查看', noDocuments: '暂无上传文件。', sentNotifications: '已发送通知', adminBio: '管理申请、审核材料并跟踪学生。' },
  ar: { space: 'فضاء المدير', close: 'إغلاق القسم', students: 'الطلاب', studentsDescription: 'اطلع على الملفات المسجلة.', files: 'الملفات', filesDescription: 'افحص طلبات الترشح وعالجها.', notifications: 'الإشعارات', notificationsDescription: 'تابع الرسائل المرسلة إلى المترشحين.', profile: 'ملف المدير', profileDescription: 'معلومات فضاء المدير.', director: 'المدير العام', selectStudent: 'اختر طالبًا لعرض ملفه الكامل.', noProfile: 'لا يوجد ملف مسجل.', openFile: 'فتح الملف →', accept: 'قبول', reject: 'رفض', pending: 'الملف قيد الانتظار', approved: 'تمت المصادقة على الملف', rejected: 'تم رفض الملف', notProvided: 'يُرجى الإدخال', notAssigned: 'غير معين', fieldTrack: 'الشعبة', fieldLevel: 'المستوى', fieldCohort: 'الفوج', fieldDiploma: 'الشهادة', fieldPhone: 'الهاتف', fieldFile: 'الملف', documents: 'الوثائق الداعمة', view: 'عرض', noDocuments: 'لم يتم رفع أي وثيقة.', sentNotifications: 'الإشعارات المرسلة', adminBio: 'إدارة الطلبات والمصادقة على الملفات ومتابعة الطلاب.' },
};
for (const [language, translation] of Object.entries(directorDashboardTranslations)) Object.assign(resources[language as keyof typeof resources].translation, { directorDashboard: translation });
const directorDetailLabels = {
  fr: { resync: 'Document à resynchroniser', noSupporting: 'Aucune pièce justificative téléversée.', pending: 'Dossier en attente', approved: 'Dossier validé', rejected: 'Dossier refusé' },
  en: { resync: 'Document needs to be resynchronized', noSupporting: 'No supporting document uploaded.', pending: 'Application pending', approved: 'Application approved', rejected: 'Application rejected' },
  zh: { resync: '文件需要重新同步', noSupporting: '尚未上传证明文件。', pending: '申请待审核', approved: '申请已通过', rejected: '申请未通过' },
  ar: { resync: 'تحتاج الوثيقة إلى إعادة المزامنة', noSupporting: 'لم يتم رفع أي وثيقة داعمة.', pending: 'الملف قيد الانتظار', approved: 'تمت المصادقة على الملف', rejected: 'تم رفض الملف' },
};
for (const [language, translation] of Object.entries(directorDetailLabels)) Object.assign(resources[language as keyof typeof resources].translation, { directorDetail: translation });
const applicationTranslations = {
  fr: { intro: 'Votre inscription est bien enregistrée. Complétez votre dossier, téléversez les justificatifs, puis suivez son évolution jusqu’à validation.', session: 'Session 2026-2027 · Dépôt ouvert jusqu’au 18 septembre 2026', status: 'État de votre dossier', step: 'Étape {{current}} sur 3', registration: 'Inscription', file: 'Dossier', validation: 'Validation', student: 'Étudiant', fileNumber: 'Numéro de dossier', applicationFile: 'Dossier de candidature', complete: 'Compléter le dossier', openForm: 'Ouvrir le formulaire', closeForm: 'Fermer le formulaire', identity: 'Identité du candidat', identityHelp: 'Vérifiez les informations utilisées pour votre dossier.', program: 'Parcours et formation demandée', programHelp: 'Indiquez votre niveau et la filière souhaitée à l’INPTIC.', fullName: 'Nom complet', email: 'Email', phone: 'Téléphone', level: 'Niveau', path: 'Parcours', track: 'Filière', selectTrack: 'Sélectionner une filière', institution: 'Établissement', cohort: 'Promotion', year: 'Année', specialty: 'Spécialité', diploma: 'Diplôme / dernière qualification', motivation: 'Biographie / motivation', documents: 'Pièces justificatives', documentsHelp: 'Ajoutez les documents nécessaires à l’étude de votre candidature.', uploadDocuments: 'Justificatifs / documents', noDocuments: 'Aucun document téléversé pour le moment.' },
  en: { intro: 'Your registration has been recorded. Complete your application, upload supporting documents, and track its progress until approval.', session: '2026-2027 session · Applications open until September 18, 2026', status: 'Application status', step: 'Step {{current}} of 3', registration: 'Registration', file: 'Application file', validation: 'Review', student: 'Student', fileNumber: 'Application number', applicationFile: 'Application file', complete: 'Complete your application', openForm: 'Open the form', closeForm: 'Close the form', identity: 'Applicant identity', identityHelp: 'Check the information used for your application.', program: 'Background and requested program', programHelp: 'Enter your level and desired program at INPTIC.', fullName: 'Full name', email: 'Email', phone: 'Phone', level: 'Level', path: 'Program path', track: 'Program', selectTrack: 'Select a program', institution: 'Institution', cohort: 'Cohort', year: 'Year', specialty: 'Specialty', diploma: 'Diploma / last qualification', motivation: 'Biography / motivation', documents: 'Supporting documents', documentsHelp: 'Add the documents required to review your application.', uploadDocuments: 'Supporting documents', noDocuments: 'No documents uploaded yet.' },
  zh: { intro: '您的注册已记录。请完成申请、上传证明文件，并跟踪审核进度。', session: '2026-2027学年 · 申请开放至2026年9月18日', status: '申请状态', step: '第{{current}}步，共3步', registration: '注册', file: '申请材料', validation: '审核', student: '学生', fileNumber: '申请编号', applicationFile: '申请材料', complete: '完成申请材料', openForm: '打开表单', closeForm: '关闭表单', identity: '申请人身份', identityHelp: '请核对申请所使用的信息。', program: '学习经历与申请课程', programHelp: '填写您的学历和希望申请的INPTIC课程。', fullName: '姓名', email: '电子邮箱', phone: '电话', level: '学历', path: '学习方向', track: '课程', selectTrack: '选择课程', institution: '学校或机构', cohort: '届次', year: '年份', specialty: '专业', diploma: '文凭 / 最后学历', motivation: '个人简介 / 动机', documents: '证明文件', documentsHelp: '添加审核申请所需的文件。', uploadDocuments: '证明文件', noDocuments: '尚未上传文件。' },
  ar: { intro: 'تم تسجيل طلبك. أكمل ملفك وارفع الوثائق وتابع تطوره إلى حين المصادقة عليه.', session: 'دورة 2026-2027 · إيداع الطلبات مفتوح إلى 18 سبتمبر 2026', status: 'حالة ملفك', step: 'المرحلة {{current}} من 3', registration: 'التسجيل', file: 'الملف', validation: 'المصادقة', student: 'الطالب', fileNumber: 'رقم الملف', applicationFile: 'ملف الترشح', complete: 'إكمال الملف', openForm: 'فتح الاستمارة', closeForm: 'إغلاق الاستمارة', identity: 'هوية المترشح', identityHelp: 'تحقق من المعلومات المستخدمة في ملفك.', program: 'المسار والتكوين المطلوب', programHelp: 'أدخل مستواك والتكوين المطلوب في المعهد.', fullName: 'الاسم الكامل', email: 'البريد الإلكتروني', phone: 'الهاتف', level: 'المستوى', path: 'المسار', track: 'الشعبة', selectTrack: 'اختر شعبة', institution: 'المؤسسة', cohort: 'الفوج', year: 'السنة', specialty: 'التخصص', diploma: 'الشهادة / آخر مؤهل', motivation: 'السيرة الذاتية / الدافع', documents: 'الوثائق الداعمة', documentsHelp: 'أضف الوثائق اللازمة لدراسة طلبك.', uploadDocuments: 'الوثائق والملفات', noDocuments: 'لم يتم رفع أي وثيقة بعد.' },
};
for (const [language, translation] of Object.entries(applicationTranslations)) {
  Object.assign(resources[language as keyof typeof resources].translation, { application: translation });
}
const candidateTranslations = {
  fr: { intro: 'Connectez-vous pour accéder à votre espace. Si vous souhaitez intégrer l’INPTIC, vous pouvez aussi vous inscrire au concours et être orienté vers votre espace étudiant.', joinExam: 'Inscription au concours', forgot: 'Mot de passe oublié', session: 'Session d’inscription', openUntil: 'Ouverte du 03 août au 18 septembre 2026', createAccount: 'Créer votre compte candidat', completeFile: 'Compléter le dossier et les pièces', followValidation: 'Suivre la validation en ligne', login: 'Connexion', accountAccess: 'Accédez à votre compte candidat.', email: 'Email', password: 'Mot de passe', passwordCreate: 'Créer un mot de passe', hidePassword: 'Masquer le mot de passe', showPassword: 'Afficher le mot de passe', loginButton: 'Connexion', or: 'ou', socialLogin: 'Se connecter avec {{provider}}', forgotQuestion: 'Mot de passe oublié ?', recoverTitle: 'Récupérer le mot de passe', recoverText: 'Recevez un lien sécurisé pour définir un nouveau mot de passe.', sendRecovery: 'Envoyer le lien', backLogin: 'Retour à la connexion', signupTitle: 'Inscription au concours', signupText: 'Créez votre compte pour candidater à l’INPTIC.', fullName: 'Nom complet' },
  en: { intro: 'Sign in to access your space. If you would like to join INPTIC, you can also register for the entrance exam and be directed to your student space.', joinExam: 'Entrance exam registration', forgot: 'Forgot password', session: 'Registration session', openUntil: 'Open from August 3 to September 18, 2026', createAccount: 'Create your applicant account', completeFile: 'Complete your application and documents', followValidation: 'Track online validation', login: 'Sign in', accountAccess: 'Access your applicant account.', email: 'Email', password: 'Password', passwordCreate: 'Create a password', hidePassword: 'Hide password', showPassword: 'Show password', loginButton: 'Sign in', or: 'or', socialLogin: 'Sign in with {{provider}}', forgotQuestion: 'Forgot password?', recoverTitle: 'Recover your password', recoverText: 'Receive a secure link to set a new password.', sendRecovery: 'Send link', backLogin: 'Back to sign in', signupTitle: 'Entrance exam registration', signupText: 'Create your account to apply to INPTIC.', fullName: 'Full name' },
  zh: { intro: '登录以访问您的空间。如果您希望加入INPTIC，也可以报名入学考试并进入学生空间。', joinExam: '入学考试报名', forgot: '忘记密码', session: '报名期', openUntil: '开放时间：2026年8月3日至9月18日', createAccount: '创建申请人账户', completeFile: '完成申请材料和文件', followValidation: '在线跟踪审核', login: '登录', accountAccess: '访问您的申请人账户。', email: '电子邮箱', password: '密码', passwordCreate: '创建密码', hidePassword: '隐藏密码', showPassword: '显示密码', loginButton: '登录', or: '或', socialLogin: '使用{{provider}}登录', forgotQuestion: '忘记密码？', recoverTitle: '找回密码', recoverText: '接收安全链接以设置新密码。', sendRecovery: '发送链接', backLogin: '返回登录', signupTitle: '入学考试报名', signupText: '创建账户以申请INPTIC。', fullName: '姓名' },
  ar: { intro: 'سجلوا الدخول للوصول إلى فضائكم. إذا كنتم ترغبون في الالتحاق بالمعهد، يمكنكم أيضًا التسجيل في المسابقة والتوجيه إلى فضاء الطالب.', joinExam: 'التسجيل في المسابقة', forgot: 'نسيت كلمة المرور', session: 'دورة التسجيل', openUntil: 'مفتوحة من 3 أغسطس إلى 18 سبتمبر 2026', createAccount: 'إنشاء حساب المترشح', completeFile: 'إكمال الملف والوثائق', followValidation: 'متابعة المصادقة عبر الإنترنت', login: 'تسجيل الدخول', accountAccess: 'الوصول إلى حساب المترشح.', email: 'البريد الإلكتروني', password: 'كلمة المرور', passwordCreate: 'إنشاء كلمة مرور', hidePassword: 'إخفاء كلمة المرور', showPassword: 'إظهار كلمة المرور', loginButton: 'تسجيل الدخول', or: 'أو', socialLogin: 'تسجيل الدخول باستخدام {{provider}}', forgotQuestion: 'نسيت كلمة المرور؟', recoverTitle: 'استعادة كلمة المرور', recoverText: 'استلم رابطًا آمنًا لتعيين كلمة مرور جديدة.', sendRecovery: 'إرسال الرابط', backLogin: 'العودة إلى تسجيل الدخول', signupTitle: 'التسجيل في المسابقة', signupText: 'أنشئ حسابك للترشح إلى المعهد.', fullName: 'الاسم الكامل' },
};
for (const [language, translation] of Object.entries(candidateTranslations)) Object.assign(resources[language as keyof typeof resources].translation, { candidate: translation });
Object.assign(resources.zh.translation, {
  home: {
    excellence: '卓越培训', excellenceText: '高水平课程', research: '研究', researchText: '与创新', employment: '就业', employmentText: '职业发展', campus: '校园', campusText: '生活', international: '面向', internationalText: '国际', academic: '卓越', academicText: '学术', highlights: '焦点新闻', allNews: '查看全部新闻 →', event: '活动', innovationWeek: '2025创新周', innovationText: '围绕新兴技术举办会议、工作坊和黑客松。', alumniLaunch: 'INPTIC校友平台上线', alumniText: '加入毕业生网络。', researchers: '我们的研究人员展示成果', researchersText: '研究与创新动态。', clubs: '社团与协会', clubsText: '加入学生社区。', formations: '我们的课程', allFormations: '查看全部课程 →', learnMore: '了解更多 →', diploma: '高级技术文凭 · 学士', apply: '在线申请', applyText: '创建账户、提交材料并实时跟踪申请。', start: '开始 →', agenda: '日程', openDay: '开放日', companiesForum: '企业与实习论坛', aiConference: '人工智能与社会会议', keyFigures: '关键数据', trainingCount: '课程', studentCount: '学生', teacherCount: '教师', employmentRate: '就业率', informatique: '信息技术', informatiqueText: '软件开发、系统、网络与安全。', multimedia: '视听', multimediaText: '数字创作、网站、设计与视听。', telecom: '电信', telecomText: '网络、嵌入式系统、物联网与服务。', management: '管理与信息通信技术', managementText: '项目管理、数字营销与创业。'
  },
  institute: {
    title: '学院', intro: '自成立以来，INPTIC Gabon已成为数字职业培训领域的重要机构，培养有能力、创新并致力于国家经济发展的专业人才。', about: '关于我们', aboutTitle: '关于INPTIC Gabon', aboutText: 'INPTIC Gabon致力于培养优秀的数字领域专业人才。', missionTitle: '我们的使命', missionText: '培养高素质数字人才，应对当代技术挑战并推动加蓬经济发展。', directorMessage: '院长寄语', quote: '学术卓越与教学创新是我们培养未来数字领袖的核心。', director: '院长', strengths: '我们的优势', strengthsTitle: '助力成功的坚实基础', personalized: '个性化指导', personalizedText: '在学习过程中为每位学生提供个性化支持。', certifications: '认可的认证', certificationsText: '获得国家和企业认可的文凭与认证。', international: '国际开放性', internationalText: '与世界各地大学和机构建立合作。'
  },
  presentation: { title: '学院介绍', intro: 'INPTIC Gabon是一所卓越、创新并重视职业融入的数字人才培养机构。', identity: '我们的定位', future: '面向未来的学校', identityText: '学院将优质教学、人文指导和与经济界的紧密联系相结合，支持学生的学术与职业发展。', strengths: '优势', market: '课程与市场需求相匹配', personalized: '个性化指导', approach: '创新教学方法', international: '面向国际', orgChart: '查看组织架构' },
  organization: { label: 'INPTIC', title: '组织架构', intro: '国家邮政、信息技术与通信学院的组织结构。', board: '董事会主席', director: '院长', deputyDirector: '副院长', studiesOfficer: '研究负责人', controller: '管理控制员', serviceHead: '服务负责人', advisors: '顾问', assistant: '院长助理', studiesDirector: '教学与教育学主任', continuingDirector: '继续教育主任', technicalDirector: '技术资源与创新主任', unescoDirector: 'UNESCO-INPTIC中心主任', secretary: '秘书长' }
});
Object.assign(resources.ar.translation, {
  home: {
    excellence: 'تكوينات متميزة', excellenceText: 'برامج عالية المستوى', research: 'البحث', researchText: 'والابتكار', employment: 'الإدماج', employmentText: 'المهني', campus: 'الحياة', campusText: 'الجامعية', international: 'منفتحون على', internationalText: 'العالم', academic: 'التميز', academicText: 'الأكاديمي', highlights: 'أبرز الأخبار', allNews: 'كل الأخبار →', event: 'فعالية', innovationWeek: 'أسبوع الابتكار 2025', innovationText: 'مؤتمرات وورشات وهاكاثونات حول التقنيات الناشئة.', alumniLaunch: 'إطلاق منصة خريجي المعهد', alumniText: 'انضم إلى شبكة الخريجين.', researchers: 'باحثونا يعرضون أعمالهم', researchersText: 'أخبار البحث والابتكار.', clubs: 'الأندية والجمعيات', clubsText: 'انضم إلى المجتمع الطلابي.', formations: 'تكويناتنا', allFormations: 'كل التكوينات →', learnMore: 'اعرف المزيد →', diploma: 'شهادة تقني سامٍ · إجازة', apply: 'التسجيل عبر الإنترنت', applyText: 'أنشئ حسابك وأرسل وثائقك وتابع طلبك لحظيًا.', start: 'ابدأ →', agenda: 'البرنامج', openDay: 'يوم الأبواب المفتوحة', companiesForum: 'منتدى الشركات والتدريب', aiConference: 'مؤتمر الذكاء الاصطناعي والمجتمع', keyFigures: 'أرقام رئيسية', trainingCount: 'تكوينات', studentCount: 'طلاب', teacherCount: 'أساتذة', employmentRate: 'نسبة الإدماج', informatique: 'الإعلام الآلي', informatiqueText: 'تطوير البرمجيات والأنظمة والشبكات والأمن.', multimedia: 'سمعي بصري', multimediaText: 'الإبداع الرقمي والويب والتصميم والسمعي البصري.', telecom: 'الاتصالات', telecomText: 'الشبكات والأنظمة المدمجة وإنترنت الأشياء والخدمات.', management: 'الإدارة وتقنيات المعلومات', managementText: 'إدارة المشاريع والتسويق الرقمي وريادة الأعمال.'
  },
  institute: {
    title: 'المعهد', intro: 'منذ إنشائه، أصبح المعهد الوطني للبريد وتقنيات المعلومات والاتصالات مرجعًا في تكوين المهن الرقمية، وتخريج كفاءات مبتكرة ملتزمة بتنمية البلاد.', about: 'من نحن', aboutTitle: 'عن المعهد', aboutText: 'يُعد المعهد مرجعًا في تكوين الكفاءات الرقمية المتميزة والمبتكرة.', missionTitle: 'مهمتنا', missionText: 'تكوين مهنيين رقميين مؤهلين قادرين على مواجهة التحديات التقنية والمساهمة في التنمية الاقتصادية للغابون.', directorMessage: 'رسالة المدير', quote: 'التميز الأكاديمي والابتكار البيداغوجي في صميم مقاربتنا لتكوين قادة الغد الرقميين.', director: 'المدير العام', strengths: 'مزايا المعهد', strengthsTitle: 'أسس متينة لنجاحكم', personalized: 'تأطير شخصي', personalizedText: 'مرافقة فردية لكل طالب خلال مساره.', certifications: 'شهادات معترف بها', certificationsText: 'دبلومات وشهادات معترف بها من الدولة والمؤسسات.', international: 'انفتاح دولي', internationalText: 'شراكات مع جامعات وفاعلين من مختلف أنحاء العالم.'
  },
  presentation: { title: 'عرض المعهد', intro: 'المعهد مؤسسة مرجعية لتكوين المواهب الرقمية وفق التميز والابتكار والإدماج المهني.', identity: 'هويتنا', future: 'مدرسة متجهة نحو المستقبل', identityText: 'يجمع المعهد بين التعليم الجيد والتأطير الإنساني والروابط القوية مع الفاعلين الاقتصاديين.', strengths: 'نقاط القوة', market: 'برامج مواكبة لحاجات السوق', personalized: 'تأطير شخصي', approach: 'مقاربة بيداغوجية مبتكرة', international: 'انفتاح على العالم', orgChart: 'عرض الهيكل التنظيمي' },
  organization: { label: 'المعهد', title: 'الهيكل التنظيمي', intro: 'الهيكل التنظيمي للمعهد الوطني للبريد وتقنيات المعلومات والاتصالات.', board: 'رئيس مجلس الإدارة', director: 'المدير العام', deputyDirector: 'نائب المدير العام', studiesOfficer: 'مكلفو الدراسات', controller: 'مراقب التسيير', serviceHead: 'رئيس مصلحة', advisors: 'المستشارون', assistant: 'مساعدة المدير العام', studiesDirector: 'مدير الدراسات والبيداغوجيا', continuingDirector: 'مدير التكوين المستمر', technicalDirector: 'مدير الموارد التقنية والابتكار', unescoDirector: 'مدير مركز اليونسكو والمعهد', secretary: 'الأمين العام' }
});
Object.assign(resources.zh.translation, {
  public: {
    ...resources.fr.translation.public,
    admissionsTitle: '招生与入学考试', admissionsIntro: '加入国家信息与通信技术学院，开启数字职业未来。',
    formationsTitle: '初始培训（3年）', formationsIntro: 'INPTIC 提供三个主要的初始培训方向，为数字领域人才应对市场挑战做好准备。',
    newsTitle: '新闻', newsIntro: '关注学院在数字技术、研究与创新方面的活动、倡议和进展。',
    contactTitle: '联系我们', contactIntro: '我们可以回答您关于课程、学生生活、招生和合作的问题。',
    companiesTitle: '企业空间', companiesIntro: 'INPTIC Gabon 与数字和经济领域的重要机构合作，为学生提供培训、创新和职业发展的机会。',
    researchTitle: 'INPTIC 的创新文化', researchIntro: '实验室、学生项目和技术孵化器帮助学生开发实际解决方案，探索数字创新。',
  },
});
Object.assign(resources.ar.translation, {
  public: {
    ...resources.fr.translation.public,
    admissionsTitle: 'القبول والامتحانات', admissionsIntro: 'انضم إلى المعهد الوطني لتقنيات المعلومات والاتصالات واستعد لمستقبلك في المهن الرقمية.',
    formationsTitle: 'التكوين الأولي (3 سنوات)', formationsIntro: 'يقدم المعهد ثلاثة أقسام رئيسية للتكوين الأولي لإعداد الكفاءات الرقمية لمتطلبات السوق.',
    newsTitle: 'الأخبار', newsIntro: 'تابع فعاليات ومبادرات وتطورات المعهد في المجال الرقمي والبحث والابتكار.',
    contactTitle: 'التواصل', contactIntro: 'نحن متاحون للإجابة عن أسئلتكم حول التكوين والحياة الطلابية والقبول والشراكات.',
    companiesTitle: 'فضاء الشركات', companiesIntro: 'يتعاون المعهد مع فاعلين رئيسيين في المجال الرقمي والاقتصاد لتوفير فرص التكوين والابتكار والإدماج المهني للطلاب.',
    researchTitle: 'ثقافة الابتكار في صميم المعهد', researchIntro: 'تتيح المختبرات والمشاريع الطلابية والحاضنة التكنولوجية تطوير حلول عملية واستكشاف الابتكار الرقمي.',
  },
});

Object.assign(resources.fr.translation.public, {
  cyberTitle: 'Cybersécurité', cyberIntro: 'Formez-vous aux compétences essentielles pour protéger les systèmes, les données et les infrastructures numériques.',
  cybersecurityTitle: 'Sécurité réseau', cybersecurityText: 'Protection des systèmes et contrôle des accès réseau.', cybervulnerabilitiesTitle: 'Analyse de vulnérabilités', cybervulnerabilitiesText: 'Identification des failles et mise en place de correctifs adaptés.', cyberrisksTitle: 'Gestion des risques', cyberrisksText: 'Évaluation des menaces et prévention des incidents numériques.',
  softwareTitle: 'Génie logiciel', softwareIntro: 'Apprenez à concevoir, développer et maintenir des logiciels fiables, évolutifs et alignés sur les besoins des entreprises.', softwarearchitectureTitle: 'Architecture logicielle', softwarearchitectureText: 'Compréhension des principes de conception et de structure applicative.', softwaredevelopmentTitle: 'Développement', softwaredevelopmentText: 'Création d’interfaces, API et services applicatifs robustes.', softwarequalityTitle: 'Qualité logicielle', softwarequalityText: 'Méthodes pour tester, sécuriser et maintenir des produits fiables.',
  monetaryTitle: 'Monétique', monetaryIntro: 'Une spécialité dédiée aux systèmes de paiement électronique, à la sécurité des transactions et à la gestion numérique des flux monétaires.', monetarypaymentTitle: 'Paiement électronique', monetarypaymentText: 'Mise en place et sécurisation des dispositifs et outils de paiement.', monetarytransactionTitle: 'Sécurité des transactions', monetarytransactionText: 'Protection des données bancaires et réduction des risques opérationnels.', monetarydigitalTitle: 'Gestion digitale', monetarydigitalText: 'Optimisation des processus monétaires et transactionnels.',
  logisticsTitle: 'Postes & Logistique', logisticsIntro: 'Une formation orientée vers la gestion des opérations, la chaîne logistique et l’optimisation des processus de production et de distribution.', logisticslogisticsTitle: 'Gestion logistique', logisticslogisticsText: 'Organisation, suivi et optimisation des flux matériels et informationnels.', logisticsplanningTitle: 'Planification', logisticsplanningText: 'Mise en place de processus efficaces pour piloter les activités de l’entreprise.', logisticsperformanceTitle: 'Performance opérationnelle', logisticsperformanceText: 'Amélioration continue des performances et de la qualité de service.',
  telecomTitle: 'Télécommunications', telecomIntro: 'Découvrez une spécialité centrée sur les réseaux, les systèmes embarqués, l’Internet des objets et les services numériques.', telecomnetworksTitle: 'Réseaux', telecomnetworksText: 'Conception, administration et sécurisation des infrastructures réseau.', telecomiotTitle: 'IoT', telecomiotText: 'Développement de systèmes connectés et de services intelligents.', telecomservicesTitle: 'Services numériques', telecomservicesText: 'Mise en place de solutions réseau de qualité pour les organisations.',
  certificationsTitle: 'Certifications', certificationsIntro: 'Nos programmes permettent d’obtenir des diplômes et des certifications reconnues, conformes aux exigences du marché et de l’État.', certificationsdegreesTitle: 'Diplômes', certificationsdegreesText: 'Formations de niveau licence et technicien supérieur.', certificationsprofessionalTitle: 'Certifications professionnelles', certificationsprofessionalText: 'Compétences validées dans les domaines du numérique et des technologies.', certificationsrecognitionTitle: 'Reconnaissance', certificationsrecognitionText: 'Diplômes et certifications reconnus par les institutions et les entreprises.',
  governanceTitle: 'Gouvernance', governanceIntro: 'La gouvernance de l’INPTIC repose sur des principes de transparence, d’efficacité et de performance au service de la qualité de l’enseignement.', governancestrategyTitle: 'Pilotage stratégique', governancestrategyText: 'Définition des orientations académiques et institutionnelles.', governancequalityTitle: 'Qualité académique', governancequalityText: 'Suivi des programmes, des résultats et de l’expérience étudiante.', governancedevelopmentTitle: 'Développement institutionnel', governancedevelopmentText: 'Évolution des infrastructures, partenariats et projets structurants.',
  partnershipsTitle: 'Partenariats', partnershipsIntro: 'L’INPTIC Gabon s’appuie sur des partenariats solides avec des institutions, des entreprises et des acteurs technologiques afin de renforcer la qualité de la formation, la recherche et l’insertion professionnelle.', partnershipsAbout: 'Qui sommes-nous', partnershipsHeading: 'Des collaborations utiles à la formation', partnershipsText: 'Nos partenaires jouent un rôle central dans la conception des programmes, la mise à jour des contenus pédagogiques, le développement des projets de recherche et l’accompagnement des étudiants vers le marché professionnel.', partnershipsText2: 'Ces alliances permettent à l’INPTIC de rester en phase avec les réalités du terrain, d’ouvrir les étudiants aux opportunités du numérique et de contribuer à la transformation numérique du Gabon.', commitments: 'Nos engagements', commitmentstudentSupport: 'Accompagnement des étudiants dans leur parcours académique et professionnel.', commitmentacademicQuality: 'Renforcement de la qualité et de la pertinence pédagogique.', commitmentinnovationProjects: 'Développement de projets innovants et de collaborations industrielles.', commitmentinternational: 'Ouverture internationale et échange de bonnes pratiques.', partnersLabel: 'Nos partenaires', partnersHeading: 'Ils nous font confiance',
  incubatorTitle: 'Incubateur Tech & Startups', incubatorIntro: 'L’incubateur de l’INPTIC accompagne les étudiants et jeunes entrepreneurs dans la création de projets à fort potentiel innovant.', incubatorsupportTitle: 'Accompagnement', incubatorsupportText: 'Support dans la validation commerciale, la structuration et la mise en marché.', incubatormentoringTitle: 'Mentorat', incubatormentoringText: 'Guidage par des experts et professionnels du secteur digital.', incubatorecosystemTitle: 'Écosystème', incubatorecosystemText: 'Connexion aux partenaires, startups et réseaux de développement.',
  'partnerCategory.public': 'Institution publique', 'partnerCategory.technology': 'Technologie', 'partnerCategory.telecommunications': 'Télécommunications', 'partnerCategory.innovation': 'Innovation', 'partnerCategory.industry': 'Industrie', 'partnerCategory.administration': 'Administration', 'partnerCategory.national': 'Institution nationale', 'partnerCategory.regulation': 'Régulation',
  terms: { title: 'Conditions d’utilisation', acceptance: 'En accédant et en utilisant ce site web, vous acceptez de respecter les présentes conditions d’utilisation. L’INPTIC se réserve le droit de modifier ces conditions à tout moment, sans préavis.', purpose: 'Les contenus disponibles sur ce site sont destinés à informer les visiteurs sur les activités, formations, services et informations institutionnelles de l’INPTIC. Toute utilisation du site doit se faire dans le respect des lois et règlements en vigueur.', prohibited: 'Les utilisateurs s’engagent à ne pas utiliser ce site à des fins illicites, frauduleuses, perturbatrices ou contraires à l’éthique. L’INPTIC ne peut être tenu responsable de tout dommage résultant d’une utilisation abusive du site ou d’un usage non conforme à ces conditions.', accuracy: 'Les informations publiées sur ce site sont fournies à titre indicatif. L’INPTIC s’efforce de les maintenir à jour, mais ne garantit pas leur exhaustivité, leur exactitude ou leur caractère permanent à tout moment.', externalLinks: 'Les liens externes présents sur ce site sont fournis uniquement pour la commodité de l’utilisateur. L’INPTIC n’assume aucune responsabilité quant au contenu de ces sites tiers.', availability: 'L’INPTIC se réserve le droit de suspendre, modifier ou interrompre l’accès à tout ou partie du site à tout moment, sans notification préalable.' },
  privacy: { title: 'Politique de confidentialité', commitment: 'L’INPTIC s’engage à protéger la vie privée des visiteurs et des utilisateurs de ce site. Cette politique de confidentialité décrit les informations que nous collectons, comment nous les utilisons et dans quelles limites elles peuvent être traitées.', collection: 'Les informations collectées peuvent inclure les données fournies volontairement via des formulaires de contact, d’inscription ou de candidature, ainsi que des informations techniques nécessaires au bon fonctionnement du site (adresse IP, navigateur, pages consultées, etc.).', use: 'Les données sont utilisées uniquement dans le cadre de la gestion des demandes, de l’accès aux services, de l’amélioration des contenus et du respect des obligations légales.', sharing: 'L’INPTIC ne vend ni ne loue les données personnelles à des tiers. Les informations peuvent toutefois être partagées avec des prestataires techniques strictement nécessaires au bon fonctionnement du site, dans le respect de la confidentialité.', rights: 'Les utilisateurs disposent du droit d’accéder, de corriger ou de retirer leurs données personnelles, dans les limites prévues par la réglementation applicable. Pour toute demande, ils peuvent contacter l’INPTIC via les moyens mis à disposition sur le site.', security: 'Nous mettons en place des mesures raisonnables pour protéger les données contre la perte, la modification ou l’accès non autorisé. Toutefois, aucun système de transmission ou de stockage n’est totalement exempt de risque.' },
  legalTexts: { title: 'Textes et lois de création de l’INPTIC', intro1: 'L’Institut National de la Poste, des Technologies de l’Information et de la Communication (INPTIC) a été créé dans le cadre des politiques publiques visant à moderniser les systèmes de formation, d’éducation, de gestion administrative et de développement numérique du pays.', intro2: 'Sa création s’inscrit dans un objectif plus large : renforcer les capacités nationales en matière de technologies de l’information et de la communication, développer les compétences techniques, et accompagner la transformation numérique des secteurs public et privé.', frameworkTitle: 'Cadre institutionnel', framework1: 'Les textes ayant conduit à la création de l’INPTIC s’appuient sur les principes de l’organisation de l’enseignement supérieur, de la formation professionnelle et de la mise en place d’institutions publiques chargées de développer les compétences stratégiques du pays.', framework2: 'Dans ce cadre, l’INPTIC a été conçu comme une structure d’excellence destinée à former des professionnels qualifiés, à soutenir les projets d’innovation, à renforcer les compétences du secteur numérique et à contribuer au développement socio-économique du pays.', actsTitle: 'Textes et actes de référence', lawEducation: 'Loi n° ... sur l’organisation de l’enseignement supérieur et de la formation professionnelle.', orderInstitutions: 'Ordonnance n° ... portant création et organisation des institutions publiques de formation et de recherche.', lawTechnology: 'Loi n° ... relative à l’adoption des politiques de développement des technologies de l’information et de la communication.', orderGovernance: 'Ordonnance n° ... fixant les missions, la gouvernance et le fonctionnement des établissements publics de référence.', decreeOrganization: 'Décret n° ... portant organisation administrative et académique de l’Institut National de la Poste, des Technologies de l’Information et de la Communication.', purposeTitle: 'Objet de la création', purposeIntro: 'La création de l’INPTIC répond à plusieurs finalités institutionnelles essentielles :', purposeskills: 'développer les compétences nationales dans les domaines des TIC et des technologies numériques ;', purposeprofessionals: 'former des professionnels capables d’intervenir dans les secteurs public et privé ;', purposeinnovation: 'favoriser l’innovation, la recherche et la mise en œuvre de solutions adaptées aux enjeux du pays ;', purposepublicServices: 'contribuer à la modernisation des services publics et à la numérisation des processus institutionnels ;', purposeeducation: 'renforcer la qualité de l’enseignement supérieur et technique dans le domaine numérique.', referencesTitle: 'Références législatives', referencehigherEducation: 'Loi portant organisation de l’enseignement supérieur et de la recherche scientifique.', referencedigitalDevelopment: 'Loi sur le développement des technologies de l’information et de la communication.', referencepublicInstitutions: 'Ordonnance portant création des établissements publics à vocation technologique et professionnelle.', referenceinstituteManagement: 'Décret fixant les attributions et le régime de gestion d’un institut public de formation numérique.', referenceacademicPrograms: 'Arrêtés ministériels relatifs à la mise en place des filières, programmes et certifications académiques.', principlesTitle: 'Principes juridiques et réglementaires', principles1: 'Les lois, ordonnances et textes réglementaires encadrant l’INPTIC visent à garantir la légitimité de son action, la qualité de sa gouvernance, la cohérence de ses missions et la conformité de ses activités avec les objectifs de développement national.', principles2: 'Ces dispositions confèrent à l’institution une mission de service public orientée vers la formation, la recherche, l’innovation, la professionnalisation et la contribution au progrès technologique du pays.', missionTitle: 'Mission de l’INPTIC', missionIntro: 'L’INPTIC agit dans le cadre des textes officiels en faveur du développement des compétences, de la transformation numérique et de la mise en place d’un écosystème académique et professionnel performant. Il est chargé d’assurer :', missiontraining: 'la formation des étudiants et professionnels aux métiers du numérique ;', missioncapacity: 'le renforcement des capacités techniques et scientifiques des acteurs du secteur ;', missionpublicSupport: 'l’appui aux collectivités et aux institutions dans la mise en œuvre de politiques numériques ;', missionpartnerships: 'le développement de partenariats académiques, technologiques et professionnels ;', missionresearch: 'la contribution à l’innovation et à la recherche appliquée dans les technologies de l’information.', conclusionTitle: 'Conclusion', conclusion1: 'La création de l’INPTIC repose sur un cadre juridique et institutionnel visant à répondre aux besoins de modernisation du pays, à consolider les compétences numériques nationales et à promouvoir un développement durable fondé sur la connaissance, l’innovation et la qualité de la formation.', conclusion2: 'Les textes et réglementations applicables peuvent faire l’objet d’évolutions pour s’adapter aux mutations économiques, technologiques et institutionnelles. Il est donc recommandé de consulter les sources officielles pour toute mise à jour réglementaire ou décision d’application.' },
});

Object.assign(resources.zh.translation, {
  public: {
    ...((resources.zh.translation as { public?: Record<string, unknown> }).public || {}),
    qualifying: '资格培训', catalog: '官方课程目录包括：', certifying: '认证培训', certifyingText: 'INPTIC还提供以下领域的职业认证：', careers: '职业方向', learnMore: '了解更多', defaultTraining: 'INPTIC提供的课程。',
    whyChoose: '为什么选择我们？', admissionHeading: '清晰、简单并追求卓越的招生流程', admissionText: 'INPTIC Gabon欢迎有动力、好奇并希望在信息技术、网络、软件开发、数字系统和创新领域获得实践技能的学生。', admissionText2: '我们的招生流程旨在发现有潜力的人才，并引导他们进入满足市场需求和国家数字化转型要求的高水平课程。', steps: '申请步骤', guide: '查看招生指南', guideText: '了解报名条件、资格要求和注册方式。', eligibility: '检查申请资格', eligibilityText: '使用模拟器，根据您的资料估算申请资格。', submit: '提交申请', submitText: '通过平台提交申请和证明文件。', tracking: '实时跟踪申请', trackingText: '接收招生和注册进度更新。', offers: '我们的服务', applyHeading: '申请所需的一切信息', stayInformed: '保持关注', applyToday: '今天就准备您的申请', submitMine: '提交我的申请',
    press: '新闻资源', pressTitle: '资源与信息', pressText: '记者和合作伙伴可以查看学院课程、活动、合作伙伴关系和倡议的最新信息。', researchTitle: 'INPTIC的创新文化', researchIntro: '实验室、学生项目和技术孵化器帮助学生开发实际解决方案并探索数字创新。', approach: '我们的理念', approachHeading: '创新、项目与创业精神', approachText: '我们鼓励应用研究和有用、创新并能推动社会与数字经济发展的项目创建。', axes: '发展方向', labs: '应用研究实验室', studentProjects: '创新学生项目', startup: '科技孵化器与初创企业', academicPartners: '学术与产业合作', examples: '项目示例', ideas: '创意转化为行动', aiData: '人工智能与数据', aiDataText: '适用于实际场景的数据分析和人工智能解决方案。', embedded: '嵌入式系统', embeddedText: '开发联网设备和创新数字解决方案。', startups: '初创企业与创新', startupsText: '支持学生创建企业和高潜力项目。', latest: '关注学院最新出版物和公告。', allNews: '查看全部新闻',
    companiesTitle: '企业空间', companiesIntro: 'INPTIC Gabon与数字和经济领域的重要机构合作，为学生提供培训、创新和职业融入机会。', professionalIntegration: '职业融入', companiesHeading: '我们的毕业生依托合作伙伴网络快速就业', companiesText: '我们的毕业生凭借合作伙伴网络和优质培训快速就业。', companiesText2: '高水平课程与市场需求相匹配，并通过产业合作满足行业需要。', services: '我们为企业提供的服务', recruitment: '招聘合格的数字人才', internships: '实习与毕业项目', continuing: '继续教育与人力资源支持', innovation: '创新与技术项目开发', partnerships: '我们的合作伙伴', partnersHeading: '支持我们追求卓越的机构', figures: '数据', results: '成绩说明一切', students: '学生', employment: '就业率', partners: '合作伙伴',
    contactTitle: '联系我们', contactIntro: '我们可以回答您关于课程、学生生活、招生和合作的问题。', sendMessage: '给我们留言', quickReply: '我们会快速回复', name: '姓名', email: '电子邮箱', phone: '电话', message: '消息', send: '发送', yourName: '您的姓名', yourEmail: '您的邮箱', yourPhone: '您的电话号码', describe: '描述您的需求...', details: '联系方式', address: '地址', hours: '开放时间', listening: '周一至周五为您提供服务。', resultsFor: '“{{query}}”的搜索结果', searching: '正在搜索...', formations: '课程', news: '新闻', result: '结果', noResults: '未找到结果。'
  }
});
Object.assign(resources.ar.translation, {
  public: {
    ...((resources.ar.translation as { public?: Record<string, unknown> }).public || {}),
    qualifying: 'تكوينات مؤهلة', catalog: 'يشمل الكتالوج الرسمي خصوصًا:', certifying: 'تكوينات معتمدة', certifyingText: 'يقدم المعهد أيضًا شهادات مهنية في المجالات التالية:', careers: 'الآفاق المهنية', learnMore: 'اعرف المزيد', defaultTraining: 'تكوين يقدمه المعهد.',
    whyChoose: 'لماذا تختارنا؟', admissionHeading: 'قبول واضح وبسيط قائم على التميز', admissionText: 'يستقبل المعهد طلابًا متحفزين وفضوليين يرغبون في اكتساب مهارات عملية في تقنيات المعلومات والشبكات وتطوير البرمجيات والأنظمة الرقمية والابتكار.', admissionText2: 'تهدف عملية القبول إلى اكتشاف المواهب الواعدة وتوجيهها نحو تكوينات عالية المستوى تستجيب لحاجات السوق والتحول الرقمي للبلاد.', steps: 'مراحل الملف', guide: 'اطلع على دليل القبول', guideText: 'اكتشف الشروط والمؤهلات وطرق التسجيل.', eligibility: 'تحقق من أهليتك', eligibilityText: 'استخدم المحاكي لتقدير أهليتك حسب ملفك.', submit: 'إيداع الملف', submitText: 'أرسل طلبك والوثائق الداعمة عبر المنصة.', tracking: 'تابع ملفك لحظيًا', trackingText: 'احصل على تحديثات حول قبولك وتسجيلك.', offers: 'عروضنا', applyHeading: 'كل ما تحتاجه للترشح', stayInformed: 'ابق على اطلاع', applyToday: 'حضّر طلبك ابتداءً من اليوم', submitMine: 'إيداع ملفي',
    press: 'الموارد الصحفية', pressTitle: 'الموارد والمعلومات', pressText: 'يمكن للصحفيين والشركاء الاطلاع على آخر المعلومات حول برامج المعهد وفعالياته وشراكاته ومبادراته.', researchTitle: 'ثقافة الابتكار في صميم المعهد', researchIntro: 'تتيح المختبرات والمشاريع الطلابية والحاضنة التكنولوجية تطوير حلول عملية واستكشاف الابتكار الرقمي.', approach: 'مقاربتنا', approachHeading: 'الابتكار والمشاريع وروح المبادرة', approachText: 'نشجع البحث التطبيقي وإنشاء مشاريع مفيدة ومبتكرة تساهم في تحول المجتمع والاقتصاد الرقمي.', axes: 'محاور التطوير', labs: 'مختبرات البحث التطبيقي', studentProjects: 'مشاريع طلابية مبتكرة', startup: 'حاضنة التكنولوجيا والشركات الناشئة', academicPartners: 'شراكات أكاديمية وصناعية', examples: 'أمثلة على المشاريع', ideas: 'أفكار إبداعية تتحول إلى عمل', aiData: 'الذكاء الاصطناعي والبيانات', aiDataText: 'حلول لتحليل البيانات والذكاء الاصطناعي مناسبة للسياقات الواقعية.', embedded: 'الأنظمة المدمجة', embeddedText: 'تطوير أجهزة متصلة وحلول رقمية مبتكرة.', startups: 'الشركات الناشئة والابتكار', startupsText: 'مرافقة الطلاب في إنشاء شركات ومشاريع ذات إمكانات عالية.', latest: 'تابع آخر منشورات وإعلانات المعهد.', allNews: 'عرض كل الأخبار',
    companiesTitle: 'فضاء الشركات', companiesIntro: 'يتعاون المعهد مع فاعلين رئيسيين في المجال الرقمي والاقتصاد لتوفير فرص التكوين والابتكار والإدماج المهني للطلاب.', professionalIntegration: 'الإدماج المهني', companiesHeading: 'يجد خريجونا عملًا بسرعة بفضل شبكة شركائنا', companiesText: 'يجد خريجونا عملًا بسرعة بفضل شبكة الشركاء وجودة التكوين.', companiesText2: 'برامج أكاديمية عالية المستوى ملائمة لحاجات السوق، مع شراكات صناعية تستجيب لمتطلبات القطاع.', services: 'خدماتنا للشركات', recruitment: 'توظيف كفاءات رقمية مؤهلة', internships: 'تدريبات ومشاريع نهاية الدراسة', continuing: 'تكوين مستمر ومرافقة للموارد البشرية', innovation: 'الابتكار وتطوير المشاريع التقنية', partnerships: 'شراكاتنا', partnersHeading: 'فاعلون يرافقون تميزنا', figures: 'أرقامنا', results: 'نتائج تتحدث عن نفسها', students: 'الطلاب', employment: 'نسبة التوظيف', partners: 'الشركاء',
    contactTitle: 'التواصل', contactIntro: 'نحن متاحون للإجابة عن أسئلتكم حول التكوين والحياة الطلابية والقبول والشراكات.', sendMessage: 'أرسلوا لنا رسالة', quickReply: 'نرد بسرعة', name: 'الاسم', email: 'البريد الإلكتروني', phone: 'الهاتف', message: 'الرسالة', send: 'إرسال', yourName: 'اسمكم', yourEmail: 'بريدكم الإلكتروني', yourPhone: 'رقمكم', describe: 'صفوا طلبكم...', details: 'بيانات الاتصال', address: 'العنوان', hours: 'أوقات العمل', listening: 'نستمع إليكم من الاثنين إلى الجمعة.', resultsFor: 'نتائج البحث عن «{{query}}»', searching: 'جارٍ البحث...', formations: 'التكوينات', news: 'الأخبار', result: 'نتيجة', noResults: 'لم يتم العثور على نتائج.'
  }
});

Object.assign(resources.zh.translation, { public: { ...((resources.zh.translation as { public?: Record<string, unknown> }).public || {}), incubatorTitle: '科技孵化器与初创企业', incubatorIntro: 'INPTIC孵化器支持学生和年轻创业者创建具有创新潜力的项目。', incubatorsupportTitle: '支持与陪伴', incubatorsupportText: '协助进行商业验证、项目结构设计和市场推广。', incubatormentoringTitle: '导师指导', incubatormentoringText: '由数字领域专家和专业人士提供指导。', incubatorecosystemTitle: '生态系统', incubatorecosystemText: '连接合作伙伴、初创企业和发展网络。' } });
Object.assign(resources.ar.translation, { public: { ...((resources.ar.translation as { public?: Record<string, unknown> }).public || {}), incubatorTitle: 'حاضنة التكنولوجيا والشركات الناشئة', incubatorIntro: 'ترافق حاضنة المعهد الطلاب ورواد الأعمال الشباب في إنشاء مشاريع ذات إمكانات ابتكارية عالية.', incubatorsupportTitle: 'المرافقة', incubatorsupportText: 'دعم التحقق التجاري وهيكلة المشاريع وتسويقها.', incubatormentoringTitle: 'التوجيه', incubatormentoringText: 'توجيه من خبراء ومهنيين في القطاع الرقمي.', incubatorecosystemTitle: 'المنظومة', incubatorecosystemText: 'ربط المشاريع بالشركاء والشركات الناشئة وشبكات التنمية.' } });
Object.assign(resources.fr.translation.public, { admissionLevelTitle: 'Niveau requis', admissionLevelText: 'Bac, Bac+2 ou équivalent selon le programme choisi.', admissionDocumentsTitle: 'Pièces à fournir', admissionDocumentsText: 'Pièce d’identité, relevés, certificat de scolarité et autres pièces demandées.', admissionCalendarTitle: 'Calendrier', admissionCalendarText: 'Dates importantes et délais de dépôt des dossiers.' });
Object.assign(resources.en.translation.public, { admissionLevelTitle: 'Required level', admissionLevelText: 'High school diploma, two years of higher education or equivalent, depending on the chosen program.', admissionDocumentsTitle: 'Required documents', admissionDocumentsText: 'Identity document, transcripts, enrollment certificate and other requested documents.', admissionCalendarTitle: 'Schedule', admissionCalendarText: 'Important dates and application submission deadlines.' });
Object.assign(resources.zh.translation, { public: { ...((resources.zh.translation as { public?: Record<string, unknown> }).public || {}), admissionLevelTitle: '入学要求', admissionLevelText: '根据所选课程，需要高中毕业证、两年高等教育学历或同等学历。', admissionDocumentsTitle: '所需文件', admissionDocumentsText: '身份证件、成绩单、在学证明及其他要求的文件。', admissionCalendarTitle: '日程安排', admissionCalendarText: '重要日期和申请材料提交期限。' } });
Object.assign(resources.ar.translation, { public: { ...((resources.ar.translation as { public?: Record<string, unknown> }).public || {}), admissionLevelTitle: 'المستوى المطلوب', admissionLevelText: 'بكالوريا أو سنتان من التعليم العالي أو ما يعادلهما حسب التكوين المختار.', admissionDocumentsTitle: 'الوثائق المطلوبة', admissionDocumentsText: 'وثيقة الهوية وكشوف النقاط وشهادة التمدرس والوثائق الأخرى المطلوبة.', admissionCalendarTitle: 'الجدول الزمني', admissionCalendarText: 'التواريخ المهمة وآجال إيداع الملفات.' } });

Object.assign(resources.zh.translation, { public: { ...((resources.zh.translation as { public?: Record<string, unknown> }).public || {}), softwareTitle: '软件工程', softwareIntro: '学习设计、开发和维护可靠、可扩展并符合企业需求的软件。', softwarearchitectureTitle: '软件架构', softwarearchitectureText: '理解应用设计和结构的基本原则。', softwaredevelopmentTitle: '软件开发', softwaredevelopmentText: '创建稳健的界面、API和应用服务。', softwarequalityTitle: '软件质量', softwarequalityText: '学习测试、保护和维护可靠产品的方法。' } });
Object.assign(resources.ar.translation, { public: { ...((resources.ar.translation as { public?: Record<string, unknown> }).public || {}), softwareTitle: 'هندسة البرمجيات', softwareIntro: 'تعلم تصميم وتطوير وصيانة برمجيات موثوقة وقابلة للتوسع ومتوافقة مع حاجات المؤسسات.', softwarearchitectureTitle: 'هندسة البرمجيات', softwarearchitectureText: 'فهم مبادئ تصميم وبنية التطبيقات.', softwaredevelopmentTitle: 'التطوير', softwaredevelopmentText: 'إنشاء واجهات وبرمجيات API وخدمات تطبيقية قوية.', softwarequalityTitle: 'جودة البرمجيات', softwarequalityText: 'طرق اختبار المنتجات الموثوقة وتأمينها وصيانتها.' } });

Object.assign(resources.zh.translation, { public: { ...((resources.zh.translation as { public?: Record<string, unknown> }).public || {}), newsLink: '查看相关页面 →' } });
Object.assign(resources.ar.translation, { public: { ...((resources.ar.translation as { public?: Record<string, unknown> }).public || {}), newsLink: 'عرض الصفحة المعنية →' } });

const frenchPublicTranslations = resources.fr.translation.public as Record<string, unknown>;
const englishPublicTranslations = resources.en.translation.public as Record<string, unknown>;
for (const [key, value] of Object.entries(frenchPublicTranslations)) {
  if (!(key in englishPublicTranslations)) {
    englishPublicTranslations[key] = value;
  }
}

const pageTranslations = {
  fr: {
    admissions: 'Admissions', eligibilityCalculator: 'Calculateur d’éligibilité', eligibilityIntro: 'Identifiez la filière et le département les plus adaptés à votre bac, votre spécialité et votre niveau.', freeSimulation: 'Simulation gratuite', checkProfile: 'Vérifiez votre profil', profileIntro: 'Renseignez votre profil pour obtenir un classement des filières compatibles.', trainingType: 'Type de formation', selectTraining: 'Sélectionner une formation', bacType: 'Type de bac', selectBac: 'Sélectionner votre type de bac', validatedLevel: 'Dernier niveau validé', selectLevel: 'Sélectionner votre niveau', specialty: 'Spécificité de votre parcours', selectSpecialty: 'Sélectionner une spécialité', diploma: 'Diplôme ou spécialité', diplomaPlaceholder: 'Ex. : Bac D, BTS, DUT, Licence...', checkEligibility: 'Vérifier mon éligibilité', reset: 'Réinitialiser', result: 'Résultat', resultEmpty: 'Votre classement apparaîtra ici après validation du formulaire.', bestMatch: 'Meilleure correspondance', option: 'Option {{number}}', department: 'Département', indicative: 'Cette simulation est indicative et ne remplace pas l’étude officielle de votre dossier par l’administration.', noFullMatch: 'Aucune correspondance ne remplit tous les critères indicatifs. Contactez l’administration pour étudier votre parcours.', redirecting: 'Redirection vers votre espace de candidature…', tracking: 'Suivi du dossier', trackingIntro: 'Consultez l’état de votre candidature et complétez les informations nécessaires.', loading: 'Chargement…', newPassword: 'Nouveau mot de passe', passwordIntro: 'Choisissez un nouveau mot de passe pour sécuriser votre compte candidat.', passwordPlaceholder: 'Nouveau mot de passe', confirmPassword: 'Confirmer le mot de passe', savePassword: 'Enregistrer le nouveau mot de passe', showPassword: 'Afficher le mot de passe', hidePassword: 'Masquer le mot de passe', passwordShort: 'Le mot de passe doit contenir au moins 6 caractères.', passwordMismatch: 'Les deux mots de passe ne correspondent pas.', invalidRecovery: 'Ce lien de récupération est invalide ou a expiré.', passwordUpdated: 'Votre mot de passe a été modifié. Redirection vers la connexion...', supabaseRequired: 'La récupération du mot de passe nécessite la configuration Supabase.', alumni: 'Réseau Alumni', alumniIntro: 'Un réseau vivant pour garder le lien, partager les expériences et créer de nouvelles opportunités.', joinNetwork: 'Rejoindre le réseau', services: 'Services', events: 'Événements', contact: 'Contact', explore3d: 'Explorez l’INPTIC en 3D', explore3dIntro: 'Découvrez les espaces de l’Institut et préparez votre prochaine visite guidée.', selectPoint: 'Sélectionnez un point d’intérêt pour préparer la prochaine visite guidée.', studentSpace: 'Espace étudiant', directorSpace: 'Espace directeur', account: 'Mon compte', dashboard: 'Tableau de bord', menu: 'Menu', noData: 'Aucune donnée disponible', notProvided: 'À renseigner', document: 'Document', noDocument: 'Aucun document disponible', accessCheck: 'Vérification de l’accès…', backDashboard: 'Tableau de bord', hello: 'Bonjour {{name}}.', student: 'Étudiant', staff: 'Personnel', profile: 'Profil', courses: 'Cours', schedule: 'Emploi du temps', degrees: 'Diplômes', transcripts: 'Relevés de notes', internships: 'Stages', certificates: 'Attestations', personalInfo: 'Informations personnelles', academicPath: 'Parcours académique', servicesStudent: 'Services étudiants', unavailable: 'Cette information sera disponible prochainement.', logout: 'Déconnexion', settings: 'Paramètres du compte', published: 'Document publié pour {{name}}.', publishFailed: 'La publication du document a échoué.', selectStudentFile: 'Sélectionnez un étudiant et un fichier.', loadStudentsFailed: 'Impossible de charger les étudiants.'
  },
  en: {
    admissions: 'Admissions', eligibilityCalculator: 'Eligibility calculator', eligibilityIntro: 'Identify the program and department best suited to your diploma, specialty and level.', freeSimulation: 'Free simulation', checkProfile: 'Check your profile', profileIntro: 'Enter your profile to rank compatible programs.', trainingType: 'Training type', selectTraining: 'Select a program', bacType: 'Baccalaureate type', selectBac: 'Select your baccalaureate type', validatedLevel: 'Highest validated level', selectLevel: 'Select your level', specialty: 'Background specialty', selectSpecialty: 'Select a specialty', diploma: 'Diploma or specialty', diplomaPlaceholder: 'e.g. High school diploma, BTS, degree...', checkEligibility: 'Check my eligibility', reset: 'Reset', result: 'Result', resultEmpty: 'Your ranking will appear here after submitting the form.', bestMatch: 'Best match', option: 'Option {{number}}', department: 'Department', indicative: 'This simulation is indicative and does not replace the official review of your application.', noFullMatch: 'No match meets all indicative criteria. Contact the administration to discuss your background.', redirecting: 'Redirecting to your application space…', tracking: 'Application tracking', trackingIntro: 'Check your application status and complete the required information.', loading: 'Loading…', newPassword: 'New password', passwordIntro: 'Choose a new password to secure your applicant account.', passwordPlaceholder: 'New password', confirmPassword: 'Confirm password', savePassword: 'Save new password', showPassword: 'Show password', hidePassword: 'Hide password', passwordShort: 'The password must contain at least 6 characters.', passwordMismatch: 'The passwords do not match.', invalidRecovery: 'This recovery link is invalid or has expired.', passwordUpdated: 'Your password has been changed. Redirecting to sign in...', supabaseRequired: 'Password recovery requires Supabase configuration.', alumni: 'Alumni network', alumniIntro: 'A living network to stay connected, share experiences and create new opportunities.', joinNetwork: 'Join the network', services: 'Services', events: 'Events', contact: 'Contact', explore3d: 'Explore INPTIC in 3D', explore3dIntro: 'Discover the Institute’s spaces and prepare your next guided visit.', selectPoint: 'Select a point of interest to prepare your next guided visit.', studentSpace: 'Student space', directorSpace: 'Director space', account: 'My account', dashboard: 'Dashboard', menu: 'Menu', noData: 'No data available', notProvided: 'To be provided', document: 'Document', noDocument: 'No document available', accessCheck: 'Checking access…', backDashboard: 'Dashboard', hello: 'Hello {{name}}.', student: 'Student', staff: 'Staff', profile: 'Profile', courses: 'Courses', schedule: 'Schedule', degrees: 'Degrees', transcripts: 'Transcripts', internships: 'Internships', certificates: 'Certificates', personalInfo: 'Personal information', academicPath: 'Academic path', servicesStudent: 'Student services', unavailable: 'This information will be available soon.', logout: 'Log out', settings: 'Account settings', published: 'Document published for {{name}}.', publishFailed: 'Document publication failed.', selectStudentFile: 'Select a student and a file.', loadStudentsFailed: 'Unable to load students.'
  },
  zh: {
    admissions: '招生', eligibilityCalculator: '资格计算器', eligibilityIntro: '根据您的学历、专业和水平确定最适合的专业和部门。', freeSimulation: '免费模拟', checkProfile: '检查您的资料', profileIntro: '填写资料以获得匹配专业排名。', trainingType: '培训类型', selectTraining: '选择培训', bacType: '高中毕业类型', selectBac: '选择高中毕业类型', validatedLevel: '已完成的最高学历', selectLevel: '选择学历', specialty: '专业背景', selectSpecialty: '选择专业', diploma: '文凭或专业', diplomaPlaceholder: '例如：理科高中毕业、专科、本科...', checkEligibility: '检查资格', reset: '重置', result: '结果', resultEmpty: '提交表格后将在此显示排名。', bestMatch: '最佳匹配', option: '选项 {{number}}', department: '部门', indicative: '此模拟仅供参考，不能替代学院对申请的正式审核。', noFullMatch: '没有匹配项满足所有参考条件。请联系学院讨论您的背景。', redirecting: '正在跳转到申请空间…', tracking: '申请跟踪', trackingIntro: '查看申请状态并完成所需信息。', loading: '加载中…', newPassword: '新密码', passwordIntro: '设置新密码以保护您的申请账户。', passwordPlaceholder: '新密码', confirmPassword: '确认密码', savePassword: '保存新密码', showPassword: '显示密码', hidePassword: '隐藏密码', passwordShort: '密码至少需要6个字符。', passwordMismatch: '两次密码不一致。', invalidRecovery: '恢复链接无效或已过期。', passwordUpdated: '密码已修改，正在跳转登录...', supabaseRequired: '密码恢复需要配置 Supabase。', alumni: '校友网络', alumniIntro: '保持联系、分享经验并创造新机会的活跃网络。', joinNetwork: '加入网络', services: '服务', events: '活动', contact: '联系', explore3d: '以3D探索学院', explore3dIntro: '发现学院空间并准备下一次导览。', selectPoint: '选择兴趣点以准备下一次导览。', studentSpace: '学生空间', directorSpace: '院长空间', account: '我的账户', dashboard: '控制台', menu: '菜单', noData: '暂无数据', notProvided: '待填写', document: '文件', noDocument: '暂无文件', accessCheck: '正在验证访问权限…', backDashboard: '控制台', hello: '您好，{{name}}。', student: '学生', staff: '工作人员', profile: '个人资料', courses: '课程', schedule: '课表', degrees: '学位', transcripts: '成绩单', internships: '实习', certificates: '证明', personalInfo: '个人信息', academicPath: '学习经历', servicesStudent: '学生服务', unavailable: '该信息即将提供。', logout: '退出登录', settings: '账户设置', published: '文件已发布给 {{name}}。', publishFailed: '文件发布失败。', selectStudentFile: '请选择学生和文件。', loadStudentsFailed: '无法加载学生。'
  },
  ar: {
    admissions: 'القبول', eligibilityCalculator: 'حاسبة الأهلية', eligibilityIntro: 'حدد التخصص والقسم الأنسب لشهادتك وتخصصك ومستواك.', freeSimulation: 'محاكاة مجانية', checkProfile: 'تحقق من ملفك', profileIntro: 'أدخل ملفك للحصول على ترتيب للتخصصات المناسبة.', trainingType: 'نوع التكوين', selectTraining: 'اختر تكوينًا', bacType: 'نوع البكالوريا', selectBac: 'اختر نوع البكالوريا', validatedLevel: 'آخر مستوى مصادق عليه', selectLevel: 'اختر مستواك', specialty: 'تخصص المسار', selectSpecialty: 'اختر تخصصًا', diploma: 'الشهادة أو التخصص', diplomaPlaceholder: 'مثال: بكالوريا، شهادة تقنية، إجازة...', checkEligibility: 'تحقق من أهليتي', reset: 'إعادة ضبط', result: 'النتيجة', resultEmpty: 'سيظهر ترتيبك هنا بعد إرسال النموذج.', bestMatch: 'أفضل تطابق', option: 'الخيار {{number}}', department: 'القسم', indicative: 'هذه المحاكاة إرشادية ولا تستبدل الدراسة الرسمية لملفك.', noFullMatch: 'لا يطابق أي خيار جميع المعايير الإرشادية. اتصل بالإدارة لدراسة مسارك.', redirecting: 'جارٍ توجيهك إلى مساحة طلبك…', tracking: 'تتبع الطلب', trackingIntro: 'تحقق من حالة طلبك وأكمل المعلومات المطلوبة.', loading: 'جارٍ التحميل…', newPassword: 'كلمة مرور جديدة', passwordIntro: 'اختر كلمة مرور جديدة لتأمين حساب المترشح.', passwordPlaceholder: 'كلمة المرور الجديدة', confirmPassword: 'تأكيد كلمة المرور', savePassword: 'حفظ كلمة المرور الجديدة', showPassword: 'إظهار كلمة المرور', hidePassword: 'إخفاء كلمة المرور', passwordShort: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.', passwordMismatch: 'كلمتا المرور غير متطابقتين.', invalidRecovery: 'رابط الاسترداد غير صالح أو انتهت صلاحيته.', passwordUpdated: 'تم تغيير كلمة المرور. جارٍ التوجيه إلى تسجيل الدخول...', supabaseRequired: 'يتطلب استرداد كلمة المرور إعداد Supabase.', alumni: 'شبكة الخريجين', alumniIntro: 'شبكة حية للحفاظ على التواصل ومشاركة الخبرات وخلق فرص جديدة.', joinNetwork: 'الانضمام إلى الشبكة', services: 'الخدمات', events: 'الفعاليات', contact: 'التواصل', explore3d: 'استكشف المعهد بتقنية ثلاثية الأبعاد', explore3dIntro: 'اكتشف فضاءات المعهد واستعد لزيارتك الموجهة القادمة.', selectPoint: 'اختر نقطة اهتمام للتحضير للزيارة الموجهة القادمة.', studentSpace: 'فضاء الطالب', directorSpace: 'فضاء المدير', account: 'حسابي', dashboard: 'لوحة التحكم', menu: 'القائمة', noData: 'لا توجد بيانات', notProvided: 'يُستكمل لاحقًا', document: 'وثيقة', noDocument: 'لا توجد وثائق', accessCheck: 'جارٍ التحقق من الوصول…', backDashboard: 'لوحة التحكم', hello: 'مرحبًا {{name}}.', student: 'طالب', staff: 'الموظفون', profile: 'الملف الشخصي', courses: 'الدروس', schedule: 'الجدول الدراسي', degrees: 'الشهادات', transcripts: 'كشوف النقاط', internships: 'التداريب', certificates: 'الإفادات', personalInfo: 'المعلومات الشخصية', academicPath: 'المسار الأكاديمي', servicesStudent: 'خدمات الطلاب', unavailable: 'ستتوفر هذه المعلومة قريبًا.', logout: 'تسجيل الخروج', settings: 'إعدادات الحساب', published: 'تم نشر الوثيقة لـ {{name}}.', publishFailed: 'فشل نشر الوثيقة.', selectStudentFile: 'اختر طالبًا وملفًا.', loadStudentsFailed: 'تعذر تحميل الطلاب.'
  },
};
Object.assign(resources.fr.translation, { pages: pageTranslations.fr });
Object.assign(resources.en.translation, { pages: pageTranslations.en });
Object.assign(resources.zh.translation, { pages: pageTranslations.zh });
Object.assign(resources.ar.translation, { pages: pageTranslations.ar });
Object.assign(resources.fr.translation, { pages: { ...pageTranslations.fr, explore3d: 'Visiter en 3D', explore3dIntro: 'Découvrez les espaces de l’Institut et préparez votre prochaine visite.', selectPoint: 'Sélectionnez un point d’intérêt pour préparer votre visite.', reset: 'Réinitialiser', navigation: 'Navigation', navigationIntro: 'Utilisez les commandes pour orienter la scène et parcourir les zones.', rotateLeft: 'Tourner à gauche', rotateRight: 'Tourner à droite', zoom: 'Zoom', zoomIn: 'Augmenter le zoom', zoomOut: 'Réduire le zoom', pointsOfInterest: 'Points d’intérêt', zoneCampus: 'Vue du campus', zoneFormations: 'Pôle formations', zoneInnovation: 'Espace innovation' } });
Object.assign(resources.en.translation, { pages: { ...pageTranslations.en, explore3d: 'Explore in 3D', explore3dIntro: 'Discover the Institute spaces and prepare your next visit.', selectPoint: 'Select a point of interest to prepare your visit.', reset: 'Reset', navigation: 'Navigation', navigationIntro: 'Use the controls to orient the scene and explore the areas.', rotateLeft: 'Turn left', rotateRight: 'Turn right', zoom: 'Zoom', zoomIn: 'Increase zoom', zoomOut: 'Decrease zoom', pointsOfInterest: 'Points of interest', zoneCampus: 'Campus view', zoneFormations: 'Training area', zoneInnovation: 'Innovation space' } });
Object.assign(resources.zh.translation, { pages: { ...pageTranslations.zh, explore3d: '三维参观', explore3dIntro: '探索学院空间，为您的下一次参观做好准备。', selectPoint: '选择兴趣点以准备参观。', reset: '重置', navigation: '导航', navigationIntro: '使用控制按钮调整场景并浏览各个区域。', rotateLeft: '向左旋转', rotateRight: '向右旋转', zoom: '缩放', zoomIn: '放大', zoomOut: '缩小', pointsOfInterest: '兴趣点', zoneCampus: '校园视图', zoneFormations: '培训区域', zoneInnovation: '创新空间' } });
Object.assign(resources.ar.translation, { pages: { ...pageTranslations.ar, explore3d: 'زيارة ثلاثية الأبعاد', explore3dIntro: 'اكتشف فضاءات المعهد واستعد لزيارتك القادمة.', selectPoint: 'اختر نقطة اهتمام للتحضير للزيارة.', reset: 'إعادة ضبط', navigation: 'التنقل', navigationIntro: 'استخدم أدوات التحكم لتوجيه المشهد واستكشاف المناطق.', rotateLeft: 'الدوران يسارًا', rotateRight: 'الدوران يمينًا', zoom: 'التكبير', zoomIn: 'تكبير', zoomOut: 'تصغير', pointsOfInterest: 'نقاط الاهتمام', zoneCampus: 'مشهد الحرم', zoneFormations: 'فضاء التكوين', zoneInnovation: 'فضاء الابتكار' } });
const studentPageLabels = {
  profile: 'Profil étudiant', profileDescription: 'Consultez vos informations personnelles et académiques.', courses: 'Cours', coursesDescription: 'Retrouvez votre parcours et vos informations pédagogiques.', schedule: 'Emploi du temps', scheduleDescription: 'Consultez votre calendrier de cours, examens et événements.', degrees: 'Diplômes', degreesDescription: 'Retrouvez vos diplômes obtenus et votre année de formation.', transcripts: 'Relevés de notes', transcriptsDescription: 'Accédez à vos relevés de notes lorsqu’ils sont disponibles.', internships: 'Stages', internshipsDescription: 'Suivez vos conventions, lieux de stage et documents associés.', certificates: 'Attestations', certificatesDescription: 'Retrouvez vos attestations de scolarité, de stage et de réussite.', fullName: 'Nom complet', email: 'E-mail', level: 'Niveau', program: 'Parcours', cohort: 'Promotion', year: 'Année'
};
Object.assign(resources.fr.translation, { pages: { ...pageTranslations.fr, ...studentPageLabels } });
Object.assign(resources.en.translation, { pages: { ...pageTranslations.en, profile: 'Student profile', profileDescription: 'View your personal and academic information.', courses: 'Courses', coursesDescription: 'Find your program and academic information.', schedule: 'Schedule', scheduleDescription: 'View your class, exam and event calendar.', degrees: 'Degrees', degreesDescription: 'Find your earned degrees and training year.', transcripts: 'Transcripts', transcriptsDescription: 'Access your transcripts when available.', internships: 'Internships', internshipsDescription: 'Track your agreements, placements and related documents.', certificates: 'Certificates', certificatesDescription: 'Find your enrollment, internship and achievement certificates.', fullName: 'Full name', email: 'Email', level: 'Level', program: 'Program', cohort: 'Cohort', year: 'Year' } });
Object.assign(resources.zh.translation, { pages: { ...pageTranslations.zh, profile: '学生资料', profileDescription: '查看个人和学业信息。', courses: '课程', coursesDescription: '查看学习方向和教学信息。', schedule: '课程表', scheduleDescription: '查看课程、考试和活动日程。', degrees: '学位与文凭', degreesDescription: '查看已获得的文凭和培训年份。', transcripts: '成绩单', transcriptsDescription: '在可用时查看成绩单。', internships: '实习', internshipsDescription: '跟踪实习协议、地点和相关文件。', certificates: '证明文件', certificatesDescription: '查看在学、实习和结业证明。', fullName: '姓名', email: '电子邮箱', level: '级别', program: '学习方向', cohort: '届次', year: '年份' } });
Object.assign(resources.ar.translation, { pages: { ...pageTranslations.ar, profile: 'الملف الطلابي', profileDescription: 'اطلع على معلوماتك الشخصية والأكاديمية.', courses: 'الدروس', coursesDescription: 'اطلع على مسارك ومعلوماتك التعليمية.', schedule: 'الجدول الزمني', scheduleDescription: 'اطلع على جدول الدروس والامتحانات والفعاليات.', degrees: 'الشهادات', degreesDescription: 'اطلع على شهاداتك وسنة تكوينك.', transcripts: 'كشوف النقاط', transcriptsDescription: 'الوصول إلى كشوف نقاطك عند توفرها.', internships: 'التدريب', internshipsDescription: 'تابع اتفاقيات التدريب وأماكنه والوثائق المرتبطة به.', certificates: 'الإفادات', certificatesDescription: 'اطلع على إفادات الدراسة والتدريب والنجاح.', fullName: 'الاسم الكامل', email: 'البريد الإلكتروني', level: 'المستوى', program: 'المسار', cohort: 'الفوج', year: 'السنة' } });
const alumniTranslations = {
  fr: { community: 'Une communauté', communityText: 'Des promotions réunies autour de l’INPTIC', opportunities: 'Des opportunités', opportunitiesText: 'Des liens avec les entreprises et partenaires', commitment: 'Un engagement', commitmentText: 'Des anciens qui accompagnent les étudiants', network: 'Le réseau INPTIC', networkTitle: 'Un lien durable entre l’école et le monde professionnel', networkText: 'Le réseau Alumni facilite les échanges entre générations, valorise les parcours et crée des passerelles concrètes vers l’emploi et l’entrepreneuriat.', keepContact: 'Garder le contact', keepContactText: 'Retrouvez les anciens étudiants, enseignants et partenaires de l’INPTIC au sein d’une même communauté.', shareOpportunities: 'Partager les opportunités', shareOpportunitiesText: 'Faites circuler les offres d’emploi, les stages, les projets et les événements utiles à votre réseau.', supportStudents: 'Accompagner les étudiants', supportStudentsText: 'Transmettez votre expérience et contribuez à l’insertion professionnelle des nouvelles promotions.', joinAlumni: 'Rejoindre Alumni', shareJourney: 'Faites connaître votre parcours', shareJourneyText: 'Anciens étudiants, partagez votre actualité, vos compétences ou vos opportunités avec la communauté INPTIC.', nextStep: 'Votre prochaine étape', stepContact: 'Prenez contact', stepContactText: 'Présentez votre promotion et votre parcours.', stepShare: 'Partagez votre actualité', stepShareText: 'Proposez une opportunité, un témoignage ou un événement.', stepBuild: 'Construisez le réseau', stepBuildText: 'Contribuez aux échanges entre étudiants et diplômés.', contactAlumni: 'Contacter l’équipe Alumni', networkLife: 'Vie du réseau', meetings: 'Les rendez-vous Alumni', professionalMeetings: 'Rencontres professionnelles', professionalMeetingsText: 'Échanger avec des diplômés et des partenaires autour des métiers du numérique.', mentoring: 'Mentorat', mentoringText: 'Accompagner les étudiants dans leurs choix, leurs projets et leur insertion.', testimonials: 'Témoignages de parcours', testimonialsText: 'Mettre en lumière les expériences et les réussites des anciens.', activeCommunity: 'Une communauté active', journeyContinues: 'Votre parcours continue avec l’INPTIC', journeyContinuesText: 'La page Alumni est l’espace de référence pour valoriser les parcours, créer des liens entre promotions et rapprocher l’institut du monde professionnel.', contactInptic: 'Contacter l’INPTIC', latestText: 'Retrouvez les événements et annonces du réseau INPTIC.', allNews: 'Voir toutes les actualités' },
  en: { community: 'A community', communityText: 'Classes brought together around INPTIC', opportunities: 'Opportunities', opportunitiesText: 'Connections with companies and partners', commitment: 'A commitment', commitmentText: 'Alumni supporting students', network: 'The INPTIC network', networkTitle: 'A lasting link between school and the professional world', networkText: 'The Alumni network connects generations, highlights career paths and creates concrete bridges to employment and entrepreneurship.', keepContact: 'Stay connected', keepContactText: 'Find former students, teachers and INPTIC partners in one community.', shareOpportunities: 'Share opportunities', shareOpportunitiesText: 'Share job offers, internships, projects and events useful to your network.', supportStudents: 'Support students', supportStudentsText: 'Share your experience and contribute to the professional integration of new classes.', joinAlumni: 'Join Alumni', shareJourney: 'Share your journey', shareJourneyText: 'Alumni, share your news, skills or opportunities with the INPTIC community.', nextStep: 'Your next step', stepContact: 'Get in touch', stepContactText: 'Introduce your class and your journey.', stepShare: 'Share your news', stepShareText: 'Suggest an opportunity, testimonial or event.', stepBuild: 'Build the network', stepBuildText: 'Contribute to exchanges between students and graduates.', contactAlumni: 'Contact the Alumni team', networkLife: 'Network life', meetings: 'Alumni events', professionalMeetings: 'Professional meetings', professionalMeetingsText: 'Exchange with graduates and partners about digital careers.', mentoring: 'Mentoring', mentoringText: 'Support students in their choices, projects and professional integration.', testimonials: 'Career stories', testimonialsText: 'Highlight the experiences and achievements of alumni.', activeCommunity: 'An active community', journeyContinues: 'Your journey continues with INPTIC', journeyContinuesText: 'The Alumni page is the reference space for highlighting career paths, connecting classes and bringing the Institute closer to the professional world.', contactInptic: 'Contact INPTIC', latestText: 'Find events and announcements from the INPTIC network.', allNews: 'View all news' },
  zh: { community: '一个社区', communityText: '围绕INPTIC凝聚各届学生', opportunities: '发展机会', opportunitiesText: '与企业和合作伙伴建立联系', commitment: '一份责任', commitmentText: '校友帮助在校学生成长', network: 'INPTIC校友网络', networkTitle: '连接学校与职业世界的长久纽带', networkText: '校友网络促进代际交流，展示职业经历，并为就业和创业建立具体桥梁。', keepContact: '保持联系', keepContactText: '在同一个社区中找到INPTIC的往届学生、教师和合作伙伴。', shareOpportunities: '分享机会', shareOpportunitiesText: '分享对网络有用的工作、实习、项目和活动信息。', supportStudents: '支持学生', supportStudentsText: '分享您的经验，帮助新一届学生实现职业发展。', joinAlumni: '加入校友网络', shareJourney: '分享您的经历', shareJourneyText: '校友们，请与INPTIC社区分享您的动态、技能或机会。', nextStep: '您的下一步', stepContact: '取得联系', stepContactText: '介绍您的届次和个人经历。', stepShare: '分享您的动态', stepShareText: '提出机会、经验分享或活动建议。', stepBuild: '建设网络', stepBuildText: '促进学生与毕业生之间的交流。', contactAlumni: '联系校友团队', networkLife: '网络生活', meetings: '校友活动', professionalMeetings: '职业交流', professionalMeetingsText: '与毕业生和合作伙伴交流数字职业发展。', mentoring: '导师指导', mentoringText: '帮助学生做出选择、推进项目并实现职业融入。', testimonials: '职业经历分享', testimonialsText: '展示校友的经历与成就。', activeCommunity: '活跃的社区', journeyContinues: '您的旅程与INPTIC继续', journeyContinuesText: '校友页面用于展示职业经历、连接各届学生，并拉近学院与职业世界的距离。', contactInptic: '联系INPTIC', latestText: '了解INPTIC网络的活动与公告。', allNews: '查看全部新闻' },
  ar: { community: 'مجتمع واحد', communityText: 'دفعات مجتمعة حول المعهد', opportunities: 'فرص', opportunitiesText: 'روابط مع الشركات والشركاء', commitment: 'التزام', commitmentText: 'خريجون يرافقون الطلاب', network: 'شبكة المعهد', networkTitle: 'صلة دائمة بين المدرسة والعالم المهني', networkText: 'تسهل شبكة الخريجين التواصل بين الأجيال وتبرز المسارات وتخلق جسورًا عملية نحو العمل وريادة الأعمال.', keepContact: 'حافظوا على التواصل', keepContactText: 'التقوا بالطلاب والأساتذة والشركاء السابقين في مجتمع واحد.', shareOpportunities: 'شاركوا الفرص', shareOpportunitiesText: 'تبادلوا عروض العمل والتدريب والمشاريع والفعاليات المفيدة لشبكتكم.', supportStudents: 'رافقوا الطلاب', supportStudentsText: 'انقلوا خبرتكم وساهموا في الإدماج المهني للدفعات الجديدة.', joinAlumni: 'انضموا إلى شبكة الخريجين', shareJourney: 'شاركوا مساركم', shareJourneyText: 'أيها الخريجون، شاركوا أخباركم ومهاراتكم وفرصكم مع مجتمع المعهد.', nextStep: 'خطوتكم القادمة', stepContact: 'تواصلوا معنا', stepContactText: 'قدموا دفعتكم ومساركم.', stepShare: 'شاركوا أخباركم', stepShareText: 'اقترحوا فرصة أو شهادة أو فعالية.', stepBuild: 'ابنوا الشبكة', stepBuildText: 'ساهموا في التبادل بين الطلاب والخريجين.', contactAlumni: 'تواصلوا مع فريق الخريجين', networkLife: 'حياة الشبكة', meetings: 'مواعيد الخريجين', professionalMeetings: 'لقاءات مهنية', professionalMeetingsText: 'تبادلوا الخبرات مع الخريجين والشركاء حول المهن الرقمية.', mentoring: 'التوجيه', mentoringText: 'رافقوا الطلاب في اختياراتهم ومشاريعهم وإدماجهم المهني.', testimonials: 'شهادات المسار', testimonialsText: 'إبراز تجارب ونجاحات الخريجين.', activeCommunity: 'مجتمع نشط', journeyContinues: 'مساركم يستمر مع المعهد', journeyContinuesText: 'صفحة الخريجين هي المساحة المرجعية لإبراز المسارات وربط الدفعات وتقريب المعهد من العالم المهني.', contactInptic: 'تواصلوا مع المعهد', latestText: 'تابعوا فعاليات وإعلانات شبكة المعهد.', allNews: 'عرض كل الأخبار' },
};
for (const [language, translation] of Object.entries(alumniTranslations)) {
  Object.assign(resources[language as keyof typeof resources].translation, { pages: { ...(resources[language as keyof typeof resources].translation as { pages?: Record<string, unknown> }).pages, ...translation } });
}
const annoncesTranslations = {
  fr: {
    officialBadge: 'Communication officielle INPTIC',
    pageTitle: 'Annonces & Communiqués',
    pageSubtitle: 'Retrouvez toutes les annonces officielles, dates de concours, résultats, événements et informations de la vie étudiante de l’INPTIC.',
    realtimeBadge: 'Flux en temps réel',
    liveUpdated: 'Mis à jour à l’instant',
    allCategories: 'Toutes',
    searchPlaceholder: 'Rechercher une annonce…',
    noAnnoncesTitle: 'Aucune annonce trouvée',
    noAnnoncesDesc: 'Les annonces publiées par l’administration apparaîtront ici.',
    noSearchResults: 'Aucun résultat pour « {{query}} ». Essayez un autre mot-clé.',
    clearSearch: 'Effacer la recherche',
    publishedCount_one: '{{count}} annonce publiée',
    publishedCount_other: '{{count}} annonces publiées',
    readMore: 'Lire l’annonce complète',
    readLess: 'Réduire',
    downloadDocuments: 'Documents à télécharger',
    documentCount_one: '{{count}} document',
    documentCount_other: '{{count}} documents',
    findPublication: 'Retrouver cette publication :',
    share: 'Partager',
    copyLink: 'Copier le lien',
    copied: 'Copié !',
    shareOn: 'Partager sur {{network}}',
    categories: {
      Annonce: 'Annonce',
      'Événement': 'Événement',
      Concours: 'Concours',
      'Communiqué': 'Communiqué',
      'Vie étudiante': 'Vie étudiante',
    },
    emptyState: 'Aucune annonce publiée pour le moment.',
    emptyStateDesc: 'Revenez bientôt pour suivre les actualités de l’Institut.',
    updatingRealtime: 'Mise à jour en temps réel…',
    openOnAnnonces: 'Ouvrir sur /annonces →',
    viewAlsoOn: 'Voir aussi sur :',
  },
  en: {
    officialBadge: 'INPTIC Official Communication',
    pageTitle: 'Announcements & Press Releases',
    pageSubtitle: 'Find all official announcements, entrance exam dates, results, events, and student life updates from INPTIC.',
    realtimeBadge: 'Real-time feed',
    liveUpdated: 'Updated just now',
    allCategories: 'All',
    searchPlaceholder: 'Search announcements…',
    noAnnoncesTitle: 'No announcements found',
    noAnnoncesDesc: 'Announcements published by the administration will appear here.',
    noSearchResults: 'No results for “{{query}}”. Try another keyword.',
    clearSearch: 'Clear search',
    publishedCount_one: '{{count}} announcement published',
    publishedCount_other: '{{count}} announcements published',
    readMore: 'Read full announcement',
    readLess: 'Show less',
    downloadDocuments: 'Downloadable documents',
    documentCount_one: '{{count}} document',
    documentCount_other: '{{count}} documents',
    findPublication: 'Find this publication on:',
    share: 'Share',
    copyLink: 'Copy link',
    copied: 'Copied!',
    shareOn: 'Share on {{network}}',
    categories: {
      Annonce: 'Announcement',
      'Événement': 'Event',
      Concours: 'Competition',
      'Communiqué': 'Press Release',
      'Vie étudiante': 'Student Life',
    },
    emptyState: 'No announcements published yet.',
    emptyStateDesc: 'Check back soon to follow the Institute’s news.',
    updatingRealtime: 'Updating in real time…',
    openOnAnnonces: 'Open on /annonces →',
    viewAlsoOn: 'Also on:',
  },
  zh: {
    officialBadge: 'INPTIC 官方通告',
    pageTitle: '公告与通报',
    pageSubtitle: '查阅INPTIC所有官方公告、入学考试日期、录取结果、活动及校园生活资讯。',
    realtimeBadge: '实时动态',
    liveUpdated: '刚刚更新',
    allCategories: '全部',
    searchPlaceholder: '搜索公告…',
    noAnnoncesTitle: '未找到公告',
    noAnnoncesDesc: '学院官方发布的公告将在此处显示。',
    noSearchResults: '未找到与“{{query}}”相关的结果。请尝试其他关键词。',
    clearSearch: '清空搜索',
    publishedCount_one: '已发布 {{count}} 条公告',
    publishedCount_other: '已发布 {{count}} 条公告',
    readMore: '阅读全文',
    readLess: '收起',
    downloadDocuments: '可供下载的附件',
    documentCount_one: '{{count}} 份文件',
    documentCount_other: '{{count}} 份文件',
    findPublication: '在以下平台查阅该发布：',
    share: '分享',
    copyLink: '复制链接',
    copied: '已复制！',
    shareOn: '分享至 {{network}}',
    categories: {
      Annonce: '公告',
      'Événement': '活动',
      Concours: '招生与竞赛',
      'Communiqué': '官方声明',
      'Vie étudiante': '学生活动',
    },
    emptyState: '暂无已发布的公告。',
    emptyStateDesc: '请稍后重试以了解学院最新动态。',
    updatingRealtime: '正在实时更新…',
    openOnAnnonces: '在公告页查看 →',
    viewAlsoOn: '也可查看于：',
  },
  ar: {
    officialBadge: 'البلاغات الرسمية للمعهد INPTIC',
    pageTitle: 'الإعلانات والبلاغات',
    pageSubtitle: 'تابع كافة الإعلانات الرسمية ومواعيد المباريات والنتائج والفعاليات ومستجدات الحياة الطلابية في معهد INPTIC.',
    realtimeBadge: 'بث مباشر ومباشر',
    liveUpdated: 'تم التحديث للتو',
    allCategories: 'الكل',
    searchPlaceholder: 'البحث في الإعلانات…',
    noAnnoncesTitle: 'لم يتم العثور على أي إعلان',
    noAnnoncesDesc: 'ستظهر الإعلانات المنشورة من قبل الإدارة هنا.',
    noSearchResults: 'لا توجد نتائج لـ « {{query}} ». جرب كلمة مفتاحية أخرى.',
    clearSearch: 'مسح البحث',
    publishedCount_one: 'تم نشر {{count}} إعلان',
    publishedCount_other: 'تم نشر {{count}} إعلانات',
    readMore: 'قراءة الإعلان كاملاً',
    readLess: 'تصغير',
    downloadDocuments: 'وثائق للتحميل',
    documentCount_one: 'وثيقة واحدة',
    documentCount_other: '{{count}} وثائق',
    findPublication: 'تابع هذا المنشور على:',
    share: 'مشاركة',
    copyLink: 'نسخ الرابط',
    copied: 'تم النسخ!',
    shareOn: 'مشاركة على {{network}}',
    categories: {
      Annonce: 'إعلان',
      'Événement': 'فعالية',
      Concours: 'مباراة',
      'Communiqué': 'بلاغ رسمي',
      'Vie étudiante': 'الحياة الطلابية',
    },
    emptyState: 'لا توجد أي إعلانات منشورة في الوقت الحالي.',
    emptyStateDesc: 'يرجى العودة قريبًا لمتابعة مستجدات المعهد.',
    updatingRealtime: 'تحديث فوري…',
    openOnAnnonces: 'فتح في صفحة الإعلانات ←',
    viewAlsoOn: 'اطلع أيضًا على:',
  },
};
for (const [language, translation] of Object.entries(annoncesTranslations)) {
  Object.assign(resources[language as keyof typeof resources].translation, { annonces: translation });
}
Object.assign(resources.fr.translation, {
  auth: {
    invalidCredentials: 'Email ou mot de passe incorrect.',
    emailNotConfirmed: 'Votre adresse email n’est pas encore confirmée.',
    userAlreadyRegistered: 'Un compte existe déjà avec cette adresse email.',
    passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères.',
    rateLimit: 'Trop de tentatives. Veuillez patienter avant de réessayer.',
    genericError: 'Une erreur est survenue. Vérifiez vos informations et réessayez.',
  },
  notifications: {
    applicationSubmitted: 'Votre dossier a été soumis avec succès. Il est désormais en cours de validation par l’administration.',
    applicationValidated: 'Votre dossier a été validé. Vous pouvez maintenant accéder à votre espace personnel.',
    applicationRejected: 'Votre dossier a été refusé. Vérifiez les informations et les justificatifs avant de réessayer.',
    empty: 'Aucune notification pour le moment.',
  },
});
Object.assign(resources.en.translation, {
  auth: {
    invalidCredentials: 'Incorrect email or password.',
    emailNotConfirmed: 'Your email address has not been confirmed yet.',
    userAlreadyRegistered: 'An account already exists with this email address.',
    passwordTooShort: 'The password must contain at least 6 characters.',
    rateLimit: 'Too many attempts. Please wait before trying again.',
    genericError: 'An error occurred. Check your information and try again.',
  },
  notifications: {
    applicationSubmitted: 'Your application was submitted successfully. It is now being reviewed by the administration.',
    applicationValidated: 'Your application has been approved. You can now access your personal area.',
    applicationRejected: 'Your application was rejected. Check the information and supporting documents before trying again.',
    empty: 'No notifications at the moment.',
  },
});
Object.assign(resources.zh.translation, {
  auth: {
    invalidCredentials: '邮箱或密码不正确。',
    emailNotConfirmed: '您的邮箱地址尚未确认。',
    userAlreadyRegistered: '该邮箱地址已存在账户。',
    passwordTooShort: '密码至少需要6个字符。',
    rateLimit: '尝试次数过多，请稍后再试。',
    genericError: '发生错误，请检查信息后重试。',
  },
  notifications: {
    applicationSubmitted: '您的申请已成功提交，目前正在由行政部门审核。',
    applicationValidated: '您的申请已通过，现在可以访问个人空间。',
    applicationRejected: '您的申请未通过，请检查信息和证明文件后重试。',
    empty: '目前没有通知。',
  },
});
Object.assign(resources.ar.translation, {
  auth: {
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    emailNotConfirmed: 'لم يتم تأكيد بريدك الإلكتروني بعد.',
    userAlreadyRegistered: 'يوجد حساب بهذا البريد الإلكتروني بالفعل.',
    passwordTooShort: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
    rateLimit: 'محاولات كثيرة جدًا. يرجى الانتظار قبل المحاولة مرة أخرى.',
    genericError: 'حدث خطأ. تحقق من معلوماتك وحاول مرة أخرى.',
  },
  notifications: {
    applicationSubmitted: 'تم إرسال طلبك بنجاح، وهو الآن قيد المراجعة من الإدارة.',
    applicationValidated: 'تم قبول طلبك. يمكنك الآن الوصول إلى مساحتك الشخصية.',
    applicationRejected: 'تم رفض طلبك. تحقق من المعلومات والوثائق الداعمة ثم حاول مرة أخرى.',
    empty: 'لا توجد إشعارات حاليًا.',
  },
});

Object.assign(resources.fr.translation.organization, {
  deptReseaux: 'Chef de Département\nRéseaux et Systèmes\nNumériques',
  deptManagementCommerce: 'Chef de département\nManagement et\nCommerce',
  deptManagementTIC: 'Chef de département\nManagement des TIC',
  deptAudiovisuel: 'Chef de Département\nAudiovisuel',
  serviceStageEmploi: 'Services Stage et\nEmploi',
  servicePlanification: 'Service Planification\net Evaluation',
  serviceVeilleTech: 'Service Veille Technologique\net Accompagnement VAE',
  centreMaintenance: 'Chef du Centre de Maintenance\net Assistance Technique',
  serviceRessourcesDoc: 'Chef de Service\nRessources Documentaires',
  serviceInformatique: 'Chef de Service Informatique\net Gestion du Système d’information',
  expertPedagogique: 'Expert pédagogique',
  expertTechnique: 'Expert Technique',
  serviceScolarite: 'Chef de Service\nScolarité',
  serviceLogistique: 'Chef de Service\nLogistique et Achat',
  serviceSocial: 'Chef de Service\nSocial',
  serviceCommunication: 'Chef de Service Communication\net Relations Extérieures',
});

Object.assign(resources.en.translation.organization, {
  deptReseaux: 'Head of Networks and Digital\nSystems Department',
  deptManagementCommerce: 'Head of Management and\nCommerce Department',
  deptManagementTIC: 'Head of ICT Management\nDepartment',
  deptAudiovisuel: 'Head of Audiovisual\nDepartment',
  serviceStageEmploi: 'Internship and Employment\nServices',
  servicePlanification: 'Planning and Evaluation\nService',
  serviceVeilleTech: 'Technology Watch and\nVAE Support Service',
  centreMaintenance: 'Head of Maintenance and\nTechnical Support Center',
  serviceRessourcesDoc: 'Head of Documentation\nResources Service',
  serviceInformatique: 'Head of IT and Information\nSystem Management',
  expertPedagogique: 'Educational Expert',
  expertTechnique: 'Technical Expert',
  serviceScolarite: 'Head of Academic Affairs\nService',
  serviceLogistique: 'Head of Logistics and\nPurchasing Service',
  serviceSocial: 'Head of Social Service',
  serviceCommunication: 'Head of Communication and\nExternal Relations Service',
});

Object.assign((resources.zh.translation as unknown as { organization: Record<string, string> }).organization, {
  deptReseaux: '网络与数字系统系主任',
  deptManagementCommerce: '管理与商务系主任',
  deptManagementTIC: '信息通信技术管理系主任',
  deptAudiovisuel: '视听系主任',
  serviceStageEmploi: '实习与就业服务处',
  servicePlanification: '规划与评估服务处',
  serviceVeilleTech: '技术监测与VAE支持服务处',
  centreMaintenance: '维护与技术支持中心主任',
  serviceRessourcesDoc: '文献资源服务处主任',
  serviceInformatique: '信息技术与信息系统管理处主任',
  expertPedagogique: '教学专家',
  expertTechnique: '技术专家',
  serviceScolarite: '教务服务处主任',
  serviceLogistique: '物流与采购服务处主任',
  serviceSocial: '社会服务处主任',
  serviceCommunication: '传播与对外关系服务处主任',
});

Object.assign((resources.ar.translation as unknown as { organization: Record<string, string> }).organization, {
  deptReseaux: 'رئيس قسم الشبكات\nوالأنظمة الرقمية',
  deptManagementCommerce: 'رئيس قسم الإدارة\nوالتجارة',
  deptManagementTIC: 'رئيس قسم إدارة\nتقنيات المعلومات',
  deptAudiovisuel: 'رئيس قسم السمعي البصري',
  serviceStageEmploi: 'مصلحة التدريب\nوالتوظيف',
  servicePlanification: 'مصلحة التخطيط\nوالتقييم',
  serviceVeilleTech: 'مصلحة الرصد التقني\nودعم اعتماد الخبرات',
  centreMaintenance: 'رئيس مركز الصيانة\nوالدعم التقني',
  serviceRessourcesDoc: 'رئيس مصلحة الموارد\nالوثائقية',
  serviceInformatique: 'رئيس مصلحة المعلوماتية\nوإدارة النظام المعلوماتي',
  expertPedagogique: 'خبير بيداغوجي',
  expertTechnique: 'خبير تقني',
  serviceScolarite: 'رئيس مصلحة الشؤون\nالدراسية',
  serviceLogistique: 'رئيس مصلحة اللوجستيات\nوالمشتريات',
  serviceSocial: 'رئيس المصلحة الاجتماعية',
  serviceCommunication: 'رئيس مصلحة الاتصال\nوالعلاقات الخارجية',
});

const newFeaturesTranslations = {
  fr: {
    announcements: {
      tagConcours: 'Concours 2026',
      tagEvent: 'Événement',
      tagAlumni: 'Espace Alumni & ANDG',
      titleConcours: 'Dépôt des dossiers et paiement des frais de dossier en ligne ouverts',
      titleEvent: 'Semaine de l’Innovation Numérique & Hackathon INPTIC',
      titleAlumni: 'Lancement de l’Annuaire National des Diplômés (ANDG)',
      descConcours: 'Déposez vos pièces justificatives, obtenez votre accusé de réception et réglez via Airtel/Moov Money.',
      descEvent: 'Rejoignez les ateliers et conférences sur l’Intelligence Artificielle et la Cybersécurité.',
      descAlumni: 'Diplômés de l’INPTIC, rejoignez le réseau professionnel officiel du Gabon.',
      ctaConcours: 'M’inscrire au concours',
      ctaEvent: 'En savoir plus',
      ctaAlumni: 'Rejoindre le réseau',
    },
    payment: {
      title: 'Paiement des Frais de Dossier',
      subtitle: 'Accusé de réception émis. Validez le paiement réel sur votre téléphone pour débloquer votre quittance officielle.',
      emailSentBanner: 'Dossier Réceptionné & Accusé de Réception Émis',
      selectOperator: 'Sélectionnez votre opérateur Mobile Money',
      phoneToDebit: 'Numéro de téléphone à débiter',
      payButton: 'Valider et payer 20 000 FCFA',
      waitingMessage: 'Validation en attente sur votre téléphone...',
      receiptTitle: 'QUITTANCE DE PAIEMENT OFFICIELLE',
      receiptCertified: 'RÈGLEMENT CERTIFIÉ',
      candidateInfo: 'Informations du Candidat',
      paymentDetails: 'Détails du Règlement',
      amountPaid: 'Montant réglé',
      operator: 'Opérateur',
      transactionId: 'Transaction ID',
      reference: 'Référence',
      date: 'Date de règlement',
      printReceipt: 'Imprimer la Quittance',
      trackDossier: 'Accéder à mon espace de suivi',
      qrAuthenticity: 'QR Code d’Authenticité Certifié',
    },
  },
  en: {
    announcements: {
      tagConcours: 'Contest 2026',
      tagEvent: 'Event',
      tagAlumni: 'Alumni Space & ANDG',
      titleConcours: 'Online application submission and fee payment open',
      titleEvent: 'Digital Innovation Week & INPTIC Hackathon',
      titleAlumni: 'Launch of the National Graduates Directory (ANDG)',
      descConcours: 'Upload your documents, receive your acknowledgment receipt and pay via Airtel/Moov Money.',
      descEvent: 'Join workshops and conferences on Artificial Intelligence and Cybersecurity.',
      descAlumni: 'INPTIC graduates, join Gabon official professional network.',
      ctaConcours: 'Register for the exam',
      ctaEvent: 'Learn more',
      ctaAlumni: 'Join network',
    },
    payment: {
      title: 'Application Fee Payment',
      subtitle: 'Acknowledgment receipt issued. Validate payment on your phone to unlock your official receipt.',
      emailSentBanner: 'Application Received & Acknowledgment Issued',
      selectOperator: 'Select your Mobile Money provider',
      phoneToDebit: 'Phone number to debit',
      payButton: 'Confirm and pay 20,000 FCFA',
      waitingMessage: 'Validation pending on your phone...',
      receiptTitle: 'OFFICIAL PAYMENT RECEIPT',
      receiptCertified: 'PAYMENT CERTIFIED',
      candidateInfo: 'Applicant Information',
      paymentDetails: 'Payment Details',
      amountPaid: 'Amount paid',
      operator: 'Provider',
      transactionId: 'Transaction ID',
      reference: 'Reference',
      date: 'Payment date',
      printReceipt: 'Print Receipt',
      trackDossier: 'Go to application tracking',
      qrAuthenticity: 'Certified Authenticity QR Code',
    },
  },
  zh: {
    announcements: {
      tagConcours: '2026年招生考试',
      tagEvent: '活动',
      tagAlumni: '校友空间 & ANDG',
      titleConcours: '在线申请材料提交与费用支付已开放',
      titleEvent: '数字创新周 & INPTIC黑客松',
      titleAlumni: '国家毕业生名录（ANDG）上线',
      descConcours: '上传证明文件，获取回执，并通过Airtel/Moov Money支付。',
      descEvent: '参加人工智能与网络安全研讨会和会议。',
      descAlumni: 'INPTIC毕业生，加入加蓬官方专业网络。',
      ctaConcours: '报名参加考试',
      ctaEvent: '了解更多',
      ctaAlumni: '加入网络',
    },
    payment: {
      title: '申请费支付',
      subtitle: '回执已发放。请在手机上确认支付以解锁官方收据。',
      emailSentBanner: '材料已接收并已发放回执',
      selectOperator: '选择您的移动支付运营商',
      phoneToDebit: '扣款手机号码',
      payButton: '确认并支付 20 000 FCFA',
      waitingMessage: '等待手机端确认…',
      receiptTitle: '官方支付收据',
      receiptCertified: '已认证付款',
      candidateInfo: '申请人信息',
      paymentDetails: '付款详情',
      amountPaid: '已付金额',
      operator: '运营商',
      transactionId: '交易ID',
      reference: '参考号',
      date: '付款日期',
      printReceipt: '打印收据',
      trackDossier: '进入进度跟踪',
      qrAuthenticity: '二维码真实性认证',
    },
  },
  ar: {
    announcements: {
      tagConcours: 'مسابقة 2026',
      tagEvent: 'فعالية',
      tagAlumni: 'فضاء الخريجين و ANDG',
      titleConcours: 'إيداع الملفات ودفع الرسوم عبر الإنترنت مفتوح',
      titleEvent: 'أسبوع الابتكار الرقمي وهاكاثون المعهد',
      titleAlumni: 'إطلاق الدليل الوطني للخريجين (ANDG)',
      descConcours: 'ارفع وثائقك، واستلم إشعار الاستلام وادفع عبر Airtel/Moov Money.',
      descEvent: 'انضم إلى ورشات ومؤتمرات الذكاء الاصطناعي والأمن السيبراني.',
      descAlumni: 'خريجو المعهد، انضموا إلى الشبكة المهنية الرسمية في الغابون.',
      ctaConcours: 'التسجيل في المسابقة',
      ctaEvent: 'معرفة المزيد',
      ctaAlumni: 'الانضمام للشبكة',
    },
    payment: {
      title: 'دفع رسوم الملف',
      subtitle: 'تم إصدار إشعار الاستلام. أكد الدفع على هاتفك لفتح وصلك الرسمي.',
      emailSentBanner: 'تم استلام الملف وإصدار إشعار الاستلام',
      selectOperator: 'اختر مزود خدمة الهاتف المحمول',
      phoneToDebit: 'رقم الهاتف المراد خصمه',
      payButton: 'تأكيد ودفع 20 000 FCFA',
      waitingMessage: 'في انتظار التأكيد على هاتفك...',
      receiptTitle: 'وصل الدفع الرسمي',
      receiptCertified: 'دفع معتمد',
      candidateInfo: 'معلومات المترشح',
      paymentDetails: 'تفاصيل الدفع',
      amountPaid: 'المبلغ المدفوع',
      operator: 'المزود',
      transactionId: 'معرف المعاملة',
      reference: 'المرجع',
      date: 'تاريخ الدفع',
      printReceipt: 'طباعة الوصل',
      trackDossier: 'الانتقال إلى متابعة الملف',
      qrAuthenticity: 'رمز QR لإثبات الأصالة المعتمد',
    },
  },
};
for (const [language, translation] of Object.entries(newFeaturesTranslations)) {
  Object.assign(resources[language as keyof typeof resources].translation, translation);
}

const pageSpecificTranslations = {
  fr: {
    common: {
      concours: 'Concours',
      publications: 'Publications',
      espaceDg: 'Espace DG',
      directionEtudes: 'Direction des Études',
      gestionAnnonces: 'Gestion Annonces',
      scolarite: 'Scolarité',
      gestionRh: 'Gestion RH',
    },
    footer: {
      formationsTitle: 'Formations',
      contactTitle: 'Contact',
      concoursAndResults: 'Concours & Résultats',
      textsAndLaws: 'Textes et lois',
      invalidEmail: 'Veuillez saisir une adresse e-mail valide.',
      subscriptionConfirmed: 'Inscription confirmée. Merci !',
    },
    concoursPage: {
      title: 'Concours, Admissions & Résultats',
      intro: 'Consultez les concours ouverts et à venir pour intégrer l’INPTIC Gabon, téléchargez les règlements officiels et accédez aux procès-verbaux des résultats.',
      inProgress: 'En cours',
      upcoming: 'À venir',
      archives: 'Archives',
      resultsAvailable: 'Résultats dispo',
      guide: "Guide d'admission",
      concoursAndResults: 'Concours & Résultats',
      calculator: "Calculateur d'éligibilité",
      fileDeposit: 'Dépôt de dossier',
      tracking: 'Suivi en temps réel',
      tabConcours: 'Concours',
      tabResults: 'Résultats Officiels',
      tabHistory: 'Historique & Archives',
    },
    publicationsPage: {
      title: 'Publications des Chercheurs de l’INPTIC',
      intro: 'Explorez les travaux de recherche, articles de revues et actes de conférences publiés par le corps professoral et les laboratoires de l’Institut.',
      referencedWorks: 'Travaux Référencés',
      searchPlaceholder: 'Rechercher par titre, mot-clé, résumé...',
      allYears: 'Toutes les années',
      year: 'Année',
    },
    depotPage: {
      portal: "Portail Officiel d'Admission INPTIC",
      title: "Dépôt de Dossier de Candidature",
      intro: "Remplissez le formulaire officiel de candidature et téléversez vos pièces justificatives. Un accusé de réception vous autorisera à régler vos frais de dossier.",
      loginRequired: "Connexion au compte requise",
      loginDesc: "Veuillez vous connecter à votre compte candidat ou créer un compte avant de remplir et soumettre votre dossier de candidature.",
      loginBtn: "Se connecter / S'inscrire",
      connectedAs: "Candidat connecté :",
      viewTracking: "Voir mon suivi de dossier",
      digitalDocs: "Pièces justificatives numériques",
      digitalDocsDesc: "Joignez les numérisations de vos pièces obligatoires (PDF ou Image, 5 Mo max) avant l'envoi définitif.",
      birthCertCNI: "1. Acte de naissance / CNI",
      bacCert: "2. Baccalauréat / Attestation",
      transcript: "3. Relevé de notes officiel",
      readyDocs: "Documents prêts",
    },
    suiviPage: {
      portal: "Espace Candidat Officiel INPTIC",
      title: "Suivi de Candidature & Quittance",
      intro: "Consultez votre accusé de réception, procédez au règlement des frais de dossier et téléchargez votre quittance officielle d'authenticité.",
      officialReceipt: "Accusé de Réception Officiel",
      dossierNumber: "Dossier N° :",
      validated: "Dossier Validé",
      refused: "Dossier Refusé",
      underReview: "En cours d'examen par la Scolarité",
      requestedProgram: "Filière sollicitée",
      receptionDate: "Réception du dossier",
      paymentStatus: "Statut de paiement",
      paidStatus: "Payé (20 000 FCFA)",
      pendingPaymentStatus: "Autorisé - En attente de règlement",
      paymentAuthorized: "Paiement autorisé",
      feePayment: "Règlement des Frais de Dossier (20 000 FCFA)",
      feePaymentDesc: "Votre dossier a été bien reçu et certifié éligible au paiement par la Scolarité. Choisissez votre opérateur Mobile Money pour valider votre inscription.",
      selectOperator: "Choix de l'opérateur Mobile Money",
      phoneToDebit: "Numéro de téléphone du compte Mobile Money",
      processPayment: "Procéder au paiement (20 000 FCFA)",
      receiptAvailable: "Quittance Officielle de Paiement Disponible",
      viewReceipt: "Voir ma quittance officielle (PDF / QR)",
      submittedDocs: "Pièces justificatives déposées",
      viewDoc: "Voir",
    },
  },
  en: {
    common: {
      concours: 'Entrance Exams',
      publications: 'Publications',
      espaceDg: 'Director Space',
      directionEtudes: 'Academic Direction',
      gestionAnnonces: 'Manage Announcements',
      scolarite: 'Scolarité',
      gestionRh: 'HR Management',
    },
    footer: {
      formationsTitle: 'Programs',
      contactTitle: 'Contact',
      concoursAndResults: 'Exams & Results',
      textsAndLaws: 'Legal texts & Laws',
      invalidEmail: 'Please enter a valid email address.',
      subscriptionConfirmed: 'Subscription confirmed. Thank you!',
    },
    concoursPage: {
      title: 'Contests, Admissions & Results',
      intro: 'View open and upcoming entrance exams to join INPTIC Gabon, download official rules, and access result reports.',
      inProgress: 'In progress',
      upcoming: 'Upcoming',
      archives: 'Archives',
      resultsAvailable: 'Results available',
      guide: 'Admission Guide',
      concoursAndResults: 'Exams & Results',
      calculator: 'Eligibility Calculator',
      fileDeposit: 'Application Deposit',
      tracking: 'Real-time Tracking',
      tabConcours: 'Entrance Exams',
      tabResults: 'Official Results',
      tabHistory: 'History & Archives',
    },
    publicationsPage: {
      title: 'INPTIC Researchers Publications',
      intro: 'Explore research work, journal articles, and conference proceedings published by faculty and laboratories.',
      referencedWorks: 'Referenced Works',
      searchPlaceholder: 'Search by title, keyword, abstract...',
      allYears: 'All years',
      year: 'Year',
    },
  },
  zh: {
    common: {
      concours: '招生考试',
      publications: '出版物',
      espaceDg: '院长空间',
      directionEtudes: '教学处',
      gestionAnnonces: '公告管理',
      scolarite: '教务处',
      gestionRh: '人事管理',
    },
    footer: {
      formationsTitle: '课程',
      contactTitle: '联系方式',
      concoursAndResults: '考试与结果',
      textsAndLaws: '法律法规',
      invalidEmail: '请输入有效的电子邮件地址。',
      subscriptionConfirmed: '订阅已确认。谢谢！',
    },
    concoursPage: {
      title: '招生考试、录取与结果',
      intro: '查看开放和即将举行的INPTIC加蓬入学考试，下载官方规则并查阅结果报告。',
      inProgress: '进行中',
      upcoming: '即将到来',
      archives: '归档',
      resultsAvailable: '结果可用',
      guide: '入学指南',
      concoursAndResults: '考试与结果',
      calculator: '资格计算器',
      fileDeposit: '材料提交',
      tracking: '实时跟踪',
      tabConcours: '入学考试',
      tabResults: '官方结果',
      tabHistory: '历史与归档',
    },
    publicationsPage: {
      title: 'INPTIC研究人员出版物',
      intro: '探索教职员工和实验室发表的研究成果、期刊文章和会议论文集。',
      referencedWorks: '引用成果',
      searchPlaceholder: '按标题、关键词、摘要搜索…',
      allYears: '所有年份',
      year: '年份',
    },
  },
  ar: {
    common: {
      concours: 'المسابقات',
      publications: 'المنشورات',
      espaceDg: 'فضاء المدير العام',
      directionEtudes: 'إدارة الدراسات',
      gestionAnnonces: 'إدارة الإعلانات',
      scolarite: 'الشؤون الدراسية',
      gestionRh: 'إدارة الموارد البشرية',
    },
    footer: {
      formationsTitle: 'التكوينات',
      contactTitle: 'الاتصال',
      concoursAndResults: 'المسابقات والنتائج',
      textsAndLaws: 'النصوص والقوانين',
      invalidEmail: 'يرجى إدخال عنوان بريد إلكتروني صحيح.',
      subscriptionConfirmed: 'تم تأكيد الاشتراك. شكراً!',
    },
    concoursPage: {
      title: 'المسابقات والقبول والنتائج',
      intro: 'اطّلع على المسابقات المفتوحة والقادمة للالتحاق بالمعهد الوطني بالغابون، ونزّل اللوائح الرسمية واطلع على محاضر النتائج.',
      inProgress: 'جاري',
      upcoming: 'قادم',
      archives: 'الأرشيف',
      resultsAvailable: 'النتائج متاحة',
      guide: 'دليل القبول',
      concoursAndResults: 'المسابقات والنتائج',
      calculator: 'حاسبة الأهلية',
      fileDeposit: 'إيداع الملف',
      tracking: 'المتابعة المباشرة',
      tabConcours: 'المسابقات',
      tabResults: 'النتائج الرسمية',
      tabHistory: 'التاريخ والأرشيف',
    },
    publicationsPage: {
      title: 'منشورات باحثي المعهد',
      intro: 'استكشف الأعمال البحثية والمقالات العلمية وأعمال المؤتمرات المنشورة من طرف هيئة التدريس ومختبرات المعهد.',
      referencedWorks: 'الأعمال المرجعية',
      searchPlaceholder: 'البحث حسب العنوان، الكلمة المفتاحية، الملخص...',
      allYears: 'جميع السنوات',
      year: 'السنة',
    },
  },
};
for (const [language, translation] of Object.entries(pageSpecificTranslations)) {
  deepMerge(resources[language as keyof typeof resources].translation, translation);
}

const detectedLanguage = 'fr';

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources,
    supportedLngs,
    lng: detectedLanguage,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
    returnEmptyString: false,
    react: {
      useSuspense: false,
    },
  });
} else {
  for (const language of supportedLngs) {
    i18next.addResourceBundle(
      language,
      'translation',
      resources[language].translation,
      true,
      true,
    );
  }
}

if (typeof document !== 'undefined') {
}

export { supportedLngs };
export default i18next;
