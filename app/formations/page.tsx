'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const departmentCards = [
  {
    title: 'Management des TIC',
    items: [
      'Licence Professionnelle Techniques de Commercialisation des TIC',
      'Licence Professionnelle E-commerce & Marketing Digital',
      'Licence Professionnelle Technologies de l’Information et de la Communication (TIC)',
    ],
    debouches: [
      'Chargé de marketing digital',
      'Chef de projet digital',
      'Commercial TIC / conseiller en transformation numérique',
      'Gestionnaire de e-commerce et CRM',
      'Analyste business / gestion de projets IT',
    ],
  },
  {
    title: 'Réseaux et Systèmes Numériques',
    items: [
      'Licence Professionnelle Développement d’Applications Réparties',
      'Licence Professionnelle Administration de Systèmes et de Bases de Données',
      'Licence Professionnelle Réseaux et Télécommunications',
      'Licence Professionnelle Administration et Sécurité des Réseaux',
    ],
    debouches: [
      'Administrateur système et réseaux',
      'Spécialiste support infrastructure numérique',
      'Administrateur de bases de données',
      'Consultant réseau et cybersécurité',
      'Développeur d’applications réparties',
    ],
  },
  {
    title: 'Audiovisuel',
    items: [
      'Licence Professionnelle en Son',
      'Licence Professionnelle en Image',
      'Licence Professionnelle en Montage',
      'Licence Professionnelle Réalisation / Production / Script',
    ],
    debouches: [
      'Assistant réalisateur / réalisateur junior',
      'Monteur vidéo',
      'Chef opérateur / cadreur',
      'Technicien son / spécialiste audio',
      'Producteur audiovisuel / gestion de contenu multimédia',
    ],
  },
];

const qualifyingCards = [
  'Internet des Objets (IoT) et réseaux de capteurs',
  'Cybersécurité et protection des infrastructures télécoms',
  'Formation à l’usage des TIC',
  'Infographie et montage vidéo',
  'Marketing numérique',
  'Cybersécurité',
  'Intelligence Artificielle',
  'Développement Web',
  'Journaliste Reporter d’Images (JRI)',
];

const certifyingCards = [
  'Intelligence Artificielle',
  'Internet des Objets (AET/IoT)',
  'Big Data',
  'Cybersécurité',
  'Cloud Computing',
];

const catalogLabels: Record<string, { en?: string; zh: string; ar: string }> = {
  'Management des TIC': { en: 'ICT Management', zh: '信息通信技术管理', ar: 'إدارة تقنيات المعلومات والاتصالات' },
  'Réseaux et Systèmes Numériques': { en: 'Networks and Digital Systems', zh: '网络与数字系统', ar: 'الشبكات والأنظمة الرقمية' },
  Audiovisuel: { en: 'Audiovisual', zh: '视听', ar: 'السمعي البصري' },
  'Formations qualifiantes': { zh: '资格培训', ar: 'تكوينات مؤهلة' },
  'Formations certifiantes': { zh: '认证培训', ar: 'تكوينات معتمدة' },
  'Internet des Objets (IoT) et réseaux de capteurs': { zh: '物联网与传感器网络', ar: 'إنترنت الأشياء وشبكات المستشعرات' },
  'Cybersécurité et protection des infrastructures télécoms': { zh: '网络安全与电信基础设施保护', ar: 'الأمن السيبراني وحماية البنى التحتية للاتصالات' },
  'Formation à l’usage des TIC': { zh: '信息通信技术应用培训', ar: 'التكوين على استخدام تقنيات المعلومات والاتصالات' },
  'Infographie et montage vidéo': { zh: '信息图形与视频剪辑', ar: 'الإنفوغرافيا وتركيب الفيديو' },
  'Marketing numérique': { zh: '数字营销', ar: 'التسويق الرقمي' },
  Cybersécurité: { zh: '网络安全', ar: 'الأمن السيبراني' },
  'Intelligence Artificielle': { zh: '人工智能', ar: 'الذكاء الاصطناعي' },
  'Développement Web': { zh: '网页开发', ar: 'تطوير الويب' },
  'Journaliste Reporter d’Images (JRI)': { zh: '图像记者', ar: 'صحفي مراسل للصور' },
  'Internet des Objets (AET/IoT)': { zh: '物联网', ar: 'إنترنت الأشياء' },
  'Big Data': { zh: '大数据', ar: 'البيانات الضخمة' },
  'Cloud Computing': { zh: '云计算', ar: 'الحوسبة السحابية' },
  'Licence Professionnelle Techniques de Commercialisation des TIC': { zh: '信息通信技术市场营销专业学士', ar: 'إجازة مهنية في تقنيات تسويق تقنيات المعلومات والاتصالات' },
  'Licence Professionnelle E-commerce & Marketing Digital': { zh: '电子商务与数字营销专业学士', ar: 'إجازة مهنية في التجارة الإلكترونية والتسويق الرقمي' },
  'Licence Professionnelle Technologies de l’Information et de la Communication (TIC)': { zh: '信息与通信技术专业学士', ar: 'إجازة مهنية في تقنيات المعلومات والاتصالات' },
  'Licence Professionnelle Développement d’Applications Réparties': { zh: '分布式应用开发专业学士', ar: 'إجازة مهنية في تطوير التطبيقات الموزعة' },
  'Licence Professionnelle Administration de Systèmes et de Bases de Données': { zh: '系统与数据库管理专业学士', ar: 'إجازة مهنية في إدارة الأنظمة وقواعد البيانات' },
  'Licence Professionnelle Réseaux et Télécommunications': { zh: '网络与电信专业学士', ar: 'إجازة مهنية في الشبكات والاتصالات' },
  'Licence Professionnelle Administration et Sécurité des Réseaux': { zh: '网络管理与安全专业学士', ar: 'إجازة مهنية في إدارة الشبكات وأمنها' },
  'Licence Professionnelle en Son': { zh: '声音专业学士', ar: 'إجازة مهنية في الصوت' },
  'Licence Professionnelle en Image': { zh: '影像专业学士', ar: 'إجازة مهنية في الصورة' },
  'Licence Professionnelle en Montage': { zh: '剪辑专业学士', ar: 'إجازة مهنية في المونتاج' },
  'Licence Professionnelle Réalisation / Production / Script': { zh: '导演 / 制作 / 编剧专业学士', ar: 'إجازة مهنية في الإخراج والإنتاج والسيناريو' },
  'Chargé de marketing digital': { zh: '数字营销专员', ar: 'مسؤول التسويق الرقمي' }, 'Chef de projet digital': { zh: '数字项目经理', ar: 'مدير مشروع رقمي' }, 'Commercial TIC / conseiller en transformation numérique': { zh: '信息通信技术销售 / 数字化转型顾问', ar: 'تجاري تقنيات المعلومات / مستشار التحول الرقمي' }, 'Gestionnaire de e-commerce et CRM': { zh: '电子商务和客户关系管理专员', ar: 'مسؤول التجارة الإلكترونية وإدارة علاقات العملاء' }, 'Analyste business / gestion de projets IT': { zh: '业务分析师 / IT项目经理', ar: 'محلل أعمال / مدير مشاريع تقنية المعلومات' },
  'Chef de projet transformation numérique': { zh: '数字化转型项目经理', ar: 'مدير مشروع التحول الرقمي' }, 'Commercial TIC / gestionnaire de comptes': { zh: '信息通信技术销售 / 客户经理', ar: 'تجاري تقنيات المعلومات / مسؤول حسابات' }, 'Responsable e-commerce et CRM': { zh: '电子商务和客户关系负责人', ar: 'مسؤول التجارة الإلكترونية وعلاقات العملاء' }, 'Consultant en innovation digitale': { zh: '数字创新顾问', ar: 'مستشار الابتكار الرقمي' },
  'Administrateur système et réseaux': { zh: '系统和网络管理员', ar: 'مسؤول الأنظمة والشبكات' }, 'Administrateur système et réseau': { zh: '系统和网络管理员', ar: 'مسؤول الأنظمة والشبكات' }, 'Spécialiste support infrastructure': { zh: '基础设施支持专家', ar: 'أخصائي دعم البنية التحتية' }, 'Analyste sécurité informatique': { zh: '信息安全分析师', ar: 'محلل أمن المعلومات' }, 'Administrateur de bases de données': { zh: '数据库管理员', ar: 'مسؤول قواعد البيانات' }, 'Développeur applications réparties': { zh: '分布式应用开发人员', ar: 'مطور التطبيقات الموزعة' },
  'Monteur vidéo': { zh: '视频剪辑师', ar: 'مركب فيديو' }, 'Cadreur / chef opérateur': { zh: '摄影师 / 摄影指导', ar: 'مصور / مدير تصوير' }, 'Assistant réalisateur': { zh: '助理导演', ar: 'مساعد مخرج' }, 'Technicien du son': { zh: '音响技术员', ar: 'تقني الصوت' }, 'Producteur audiovisuel et gestionnaire de contenu': { zh: '视听制作人和内容管理员', ar: 'منتج سمعي بصري ومسؤول محتوى' },
  'Technicien IoT': { zh: '物联网技术员', ar: 'تقني إنترنت الأشياء' }, 'Intégrateur systèmes connectés': { zh: '联网系统集成师', ar: 'مختص دمج الأنظمة المتصلة' }, 'Gestionnaire de réseaux de capteurs': { zh: '传感器网络管理员', ar: 'مسؤول شبكات المستشعرات' }, 'Technicien maintenance domotique et industriel': { zh: '楼宇与工业自动化维护技术员', ar: 'تقني صيانة الأنظمة المنزلية والصناعية' },
  'Analyste cybersécurité': { zh: '网络安全分析师', ar: 'محلل الأمن السيبراني' }, 'Administrateur sécurité réseau': { zh: '网络安全管理员', ar: 'مسؤول أمن الشبكات' }, 'Expert protection des infrastructures': { zh: '基础设施保护专家', ar: 'خبير حماية البنى التحتية' }, 'Technicien sécurité des systèmes d’information': { zh: '信息系统安全技术员', ar: 'تقني أمن نظم المعلومات' },
  'Assistante de gestion numérique': { zh: '数字管理助理', ar: 'مساعدة الإدارة الرقمية' }, 'Gestionnaire de contenus numériques': { zh: '数字内容管理员', ar: 'مسؤول المحتوى الرقمي' }, 'Support utilisateur informatique': { zh: 'IT用户支持', ar: 'دعم مستخدمي المعلوماتية' }, 'Agent de digitalisation de services': { zh: '服务数字化专员', ar: 'موظف رقمنة الخدمات' },
  'Designer graphique': { zh: '平面设计师', ar: 'مصمم جرافيك' }, 'Motion designer': { zh: '动态设计师', ar: 'مصمم موشن' }, 'Créateur de contenus visuels': { zh: '视觉内容创作者', ar: 'منشئ محتوى بصري' }, 'Community manager': { zh: '社区运营经理', ar: 'مسؤول إدارة المجتمعات الرقمية' }, 'Gestionnaire de contenu digital': { zh: '数字内容管理员', ar: 'مسؤول المحتوى الرقمي' }, 'Consultant marketing numérique': { zh: '数字营销顾问', ar: 'مستشار التسويق الرقمي' },
  'Analyste en sécurité informatique': { zh: '信息安全分析师', ar: 'محلل أمن المعلومات' }, 'Hacker éthique / pentester junior': { zh: '道德黑客 / 初级渗透测试员', ar: 'هاكر أخلاقي / مختبر اختراق مبتدئ' }, 'Technicien sécurité des SI': { zh: '信息系统安全技术员', ar: 'تقني أمن نظم المعلومات' }, 'Responsable conformité sécurité': { zh: '安全合规负责人', ar: 'مسؤول الامتثال الأمني' }, 'Data analyst': { zh: '数据分析师', ar: 'محلل بيانات' }, 'Spécialiste IA / machine learning': { zh: '人工智能 / 机器学习专家', ar: 'أخصائي الذكاء الاصطناعي والتعلم الآلي' }, 'Analyste de données': { zh: '数据分析师', ar: 'محلل بيانات' }, 'Automatisation de processus intelligents': { zh: '智能流程自动化', ar: 'أتمتة العمليات الذكية' },
  'Développeur web frontend': { zh: '前端网页开发人员', ar: 'مطور واجهات الويب' }, 'Développeur backend': { zh: '后端开发人员', ar: 'مطور الواجهات الخلفية' }, 'Full stack junior': { zh: '初级全栈开发人员', ar: 'مطور شامل مبتدئ' }, 'Intégrateur web': { zh: '网页集成师', ar: 'مختص دمج الويب' }, 'Reporter photo / vidéaste': { zh: '摄影记者 / 摄像师', ar: 'مراسل صور / مصور فيديو' }, 'Journaliste d’image': { zh: '图像记者', ar: 'صحفي صورة' }, 'Rédacteur multimédia': { zh: '多媒体编辑', ar: 'محرر وسائط متعددة' }, 'Chargé de production documentaire': { zh: '纪录片制作专员', ar: 'مسؤول إنتاج وثائقي' },
  'Data scientist junior': { zh: '初级数据科学家', ar: 'عالم بيانات مبتدئ' }, 'Spécialiste IA': { zh: '人工智能专家', ar: 'أخصائي الذكاء الاصطناعي' }, 'Spécialiste automatisation intelligente': { zh: '智能自动化专家', ar: 'أخصائي الأتمتة الذكية' }, 'Data engineer junior': { zh: '初级数据工程师', ar: 'مهندس بيانات مبتدئ' }, 'Chargé d’analyse de données': { zh: '数据分析专员', ar: 'مسؤول تحليل البيانات' }, 'Gestionnaire de données d’entreprise': { zh: '企业数据管理员', ar: 'مسؤول بيانات المؤسسة' }, 'Spécialiste systèmes connectés': { zh: '联网系统专家', ar: 'أخصائي الأنظمة المتصلة' }, 'Responsable maintenance équipements connectés': { zh: '联网设备维护负责人', ar: 'مسؤول صيانة التجهيزات المتصلة' }, 'Intégrateur réseaux de capteurs': { zh: '传感器网络集成师', ar: 'مختص دمج شبكات المستشعرات' }, 'Administrateur cloud': { zh: '云管理员', ar: 'مسؤول الحوسبة السحابية' }, 'Technicien infrastructure cloud': { zh: '云基础设施技术员', ar: 'تقني البنية التحتية السحابية' }, 'Consultant migration cloud': { zh: '云迁移顾问', ar: 'مستشار الترحيل السحابي' }, 'Support infra-as-a-service': { zh: '基础设施即服务支持', ar: 'دعم البنية التحتية كخدمة' },
};

function localizedCatalogLabel(value: string, language: string) {
  if (language === 'en') return catalogLabels[value]?.en || value;
  if (language !== 'zh' && language !== 'ar') return value;
  const locale = language as 'zh' | 'ar';
  return catalogLabels[value]?.[locale] || value;
}

const modalSummaries: Record<string, { en: string; zh: string; ar: string }> = {
  'Management des TIC': { en: 'Profiles focused on management, marketing, commerce and digital transformation.', zh: '培养管理、营销、商业和数字化转型方向的人才。', ar: 'كفاءات متخصصة في الإدارة والتسويق والتجارة والتحول الرقمي.' },
  'Réseaux et Systèmes Numériques': { en: 'Technical skills in systems, data, networks and cybersecurity.', zh: '掌握系统、数据、网络和网络安全方面的技术能力。', ar: 'مهارات تقنية في الأنظمة والبيانات والشبكات والأمن السيبراني.' },
  Audiovisuel: { en: 'Careers in audiovisual creation, image, sound and production.', zh: '面向视听创作、图像、声音和制作领域的职业。', ar: 'مهن مرتبطة بالإبداع السمعي البصري والصورة والصوت والإنتاج.' },
  'Internet des Objets (IoT) et réseaux de capteurs': { en: 'Training focused on connected objects, data collection and smart networks.', zh: '专注于联网设备、数据采集和智能网络的培训。', ar: 'تكوين يركز على الأجهزة المتصلة وجمع البيانات والشبكات الذكية.' },
  'Cybersécurité et protection des infrastructures télécoms': { en: 'Skills for protecting networks, infrastructure and digital services.', zh: '培养保护网络、基础设施和数字服务的能力。', ar: 'مهارات لحماية الشبكات والبنى التحتية والخدمات الرقمية.' },
  'Formation à l’usage des TIC': { en: 'A specialization focused on mastering digital tools and using ICT effectively.', zh: '专注于掌握数字工具并有效使用信息通信技术的专业方向。', ar: 'تخصص يركز على إتقان الأدوات الرقمية والاستخدام الفعال لتقنيات المعلومات والاتصالات.' },
  'Infographie et montage vidéo': { en: 'Careers in design, visual creation and digital content production.', zh: '面向设计、视觉创作和数字内容制作的职业。', ar: 'مهن في التصميم والإبداع البصري وإنتاج المحتوى الرقمي.' },
  'Marketing numérique': { en: 'Skills in digital communication, social media, SEO and campaign management.', zh: '掌握数字传播、社交网络、搜索引擎优化和活动管理能力。', ar: 'مهارات في الاتصال الرقمي والشبكات الاجتماعية وتحسين محركات البحث وإدارة الحملات.' },
  Cybersécurité: { en: 'A specialization in protecting digital systems, networks and data.', zh: '专注于保护数字系统、网络和数据的专业方向。', ar: 'تخصص في حماية الأنظمة والشبكات والبيانات الرقمية.' },
  'Intelligence Artificielle': { en: 'Skills in AI, data analysis and intelligent task automation.', zh: '掌握人工智能、数据分析和智能任务自动化能力。', ar: 'مهارات في الذكاء الاصطناعي وتحليل البيانات وأتمتة المهام الذكية.' },
  'Développement Web': { en: 'A specialization for designing, deploying and maintaining modern web applications.', zh: '专注于设计、部署和维护现代网页应用的专业方向。', ar: 'تخصص لتصميم ونشر وصيانة تطبيقات الويب الحديثة.' },
  'Journaliste Reporter d’Images (JRI)': { en: 'Skills in directing, shooting and visual reporting.', zh: '培养导演、摄影和视觉报道方面的能力。', ar: 'مهارات في الإخراج والتصوير والتقرير المرئي.' },
  'Internet des Objets (AET/IoT)': { en: 'Certification in connected objects and intelligent network management.', zh: '联网设备和智能网络管理认证。', ar: 'شهادة في الأجهزة المتصلة والإدارة الذكية للشبكات.' },
  'Big Data': { en: 'Skills in collecting, analyzing and using massive amounts of data.', zh: '掌握海量数据的收集、分析和应用能力。', ar: 'مهارات في جمع وتحليل واستغلال كميات ضخمة من البيانات.' },
  'Cloud Computing': { en: 'Skills in migrating, administering and securing cloud services.', zh: '掌握云服务迁移、管理和安全保障能力。', ar: 'مهارات في ترحيل وإدارة وتأمين الخدمات السحابية.' },
};

function localizedModalContent(content: SelectedCard, language: string): SelectedCard {
  const locale = language === 'zh' || language === 'ar' || language === 'en' ? language : null;
  return {
    ...content,
    title: localizedCatalogLabel(content.title, language),
    summary: locale ? modalSummaries[content.title]?.[locale] || content.summary : content.summary,
    debouches: content.debouches.map((career) => localizedCatalogLabel(career, language)),
  };
}

function localizedGenericCareers(language: string) {
  if (language === 'zh') return ['专业课程', '职业融入', '技能提升'];
  if (language === 'ar') return ['تكوين متخصص', 'إدماج مهني', 'تطوير المهارات'];
  if (language === 'en') return ['Specialized training', 'Professional integration', 'Skills development'];
  return ['Formation spécialisée', 'Insertion professionnelle', 'Mise à niveau des compétences'];
}

type SelectedCard = {
  title: string;
  summary: string;
  debouches: string[];
  items?: string[];
};

const modalContent = {
  'Management des TIC': {
    title: 'Management des TIC',
    summary: 'Des profils orientés gestion, marketing, commerce et transformation digitale.',
    debouches: [
      'Chargé de marketing digital',
      'Chef de projet transformation numérique',
      'Commercial TIC / gestionnaire de comptes',
      'Responsable e-commerce et CRM',
      'Consultant en innovation digitale',
    ],
  },
  'Réseaux et Systèmes Numériques': {
    title: 'Réseaux et Systèmes Numériques',
    summary: 'Des compétences techniques dans les systèmes, les données, les réseaux et la cybersécurité.',
    debouches: [
      'Administrateur système et réseau',
      'Spécialiste support infrastructure',
      'Analyste sécurité informatique',
      'Administrateur de bases de données',
      'Développeur applications réparties',
    ],
  },
  'Audiovisuel': {
    title: 'Audiovisuel',
    summary: 'Des métiers liés à la création audiovisuelle, à l’image, au son et à la production.',
    debouches: [
      'Monteur vidéo',
      'Cadreur / chef opérateur',
      'Assistant réalisateur',
      'Technicien du son',
      'Producteur audiovisuel et gestionnaire de contenu',
    ],
  },
  'Internet des Objets (IoT) et réseaux de capteurs': {
    title: 'Internet des Objets (IoT)',
    summary: 'Formation orientée vers les objets connectés, la collecte de données et les réseaux intelligents.',
    debouches: [
      'Technicien IoT',
      'Intégrateur systèmes connectés',
      'Gestionnaire de réseaux de capteurs',
      'Technicien maintenance domotique et industriel',
    ],
  },
  'Cybersécurité et protection des infrastructures télécoms': {
    title: 'Cybersécurité et infrastructures télécoms',
    summary: 'Des compétences de protection des réseaux, infrastructures et services numériques.',
    debouches: [
      'Analyste cybersécurité',
      'Administrateur sécurité réseau',
      'Expert protection des infrastructures',
      'Technicien sécurité des systèmes d’information',
    ],
  },
  'Formation à l’usage des TIC': {
    title: 'Formation à l’usage des TIC',
    summary: 'Une spécialisation axée sur la maîtrise des outils numériques et l’usage efficace des TIC.',
    debouches: [
      'Assistante de gestion numérique',
      'Gestionnaire de contenus numériques',
      'Support utilisateur informatique',
      'Agent de digitalisation de services',
    ],
  },
  'Infographie et montage vidéo': {
    title: 'Infographie et montage vidéo',
    summary: 'Des métiers liés au design, à la création visuelle et à la production de contenus numériques.',
    debouches: [
      'Designer graphique',
      'Monteur vidéo',
      'Motion designer',
      'Créateur de contenus visuels',
    ],
  },
  'Marketing numérique': {
    title: 'Marketing numérique',
    summary: 'Des compétences en communication digitale, réseaux sociaux, SEO et gestion de campagnes.',
    debouches: [
      'Community manager',
      'Chargé de marketing digital',
      'Gestionnaire de contenu digital',
      'Consultant marketing numérique',
    ],
  },
  'Cybersécurité': {
    title: 'Cybersécurité',
    summary: 'Une spécialisation sur la protection des systèmes, réseaux et données numériques.',
    debouches: [
      'Analyste en sécurité informatique',
      'Hacker éthique / pentester junior',
      'Technicien sécurité des SI',
      'Responsable conformité sécurité',
    ],
  },
  'Intelligence Artificielle': {
    title: 'Intelligence Artificielle',
    summary: 'Des compétences en IA, analyse de données et automatisation des tâches intelligentes.',
    debouches: [
      'Data analyst',
      'Spécialiste IA / machine learning',
      'Analyste de données',
      'Automatisation de processus intelligents',
    ],
  },
  'Développement Web': {
    title: 'Développement Web',
    summary: 'Une spécialisation pour concevoir, déployer et maintenir des applications web modernes.',
    debouches: [
      'Développeur web frontend',
      'Développeur backend',
      'Full stack junior',
      'Intégrateur web',
    ],
  },
  'Journaliste Reporter d’Images (JRI)': {
    title: 'Journaliste Reporter d’Images (JRI)',
    summary: 'Des compétences en réalisation, prise de vue et reportage visuel.',
    debouches: [
      'Reporter photo / vidéaste',
      'Journaliste d’image',
      'Rédacteur multimédia',
      'Chargé de production documentaire',
    ],
  },
  'Intelligence Artificielle certif': {
    title: 'Intelligence Artificielle',
    summary: 'Certification orientée vers l’analyse de données, la modélisation et l’automatisation.',
    debouches: [
      'Data scientist junior',
      'Spécialiste IA',
      'Analyste de données',
      'Spécialiste automatisation intelligente',
    ],
  },
  'Internet des Objets (AET/IoT)': {
    title: 'Internet des Objets (AET/IoT)',
    summary: 'Certification sur les objets connectés et la gestion intelligente des réseaux.',
    debouches: [
      'Technicien IoT',
      'Spécialiste systèmes connectés',
      'Responsable maintenance équipements connectés',
      'Intégrateur réseaux de capteurs',
    ],
  },
  'Big Data': {
    title: 'Big Data',
    summary: 'Des compétences sur la collecte, l’analyse et l’exploitation des données massives.',
    debouches: [
      'Data analyst',
      'Data engineer junior',
      'Chargé d’analyse de données',
      'Gestionnaire de données d’entreprise',
    ],
  },
  'Cloud Computing': {
    title: 'Cloud Computing',
    summary: 'Des compétences en migration, administration et sécurisation des services cloud.',
    debouches: [
      'Administrateur cloud',
      'Technicien infrastructure cloud',
      'Consultant migration cloud',
      'Support infra-as-a-service',
    ],
  },
};

export default function Formations() {
  const [selected, setSelected] = useState<SelectedCard | null>(null);
  const { t, i18n } = useTranslation();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img src="/banniere/6.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
                    <img src="/logoinptic.png" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />

          <h1 className="text-4xl font-black md:text-6xl">{t('public.formationsTitle')}</h1>
          <p className="mt-5 max-w-3xl text-lg text-blue-50">
            {t('public.formationsIntro')}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {departmentCards.map((card) => (
            <article key={card.title} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900">{localizedCatalogLabel(card.title, i18n.language)}</h2>
              <ul className="mt-5 space-y-3 text-slate-700">
                {card.items.map((item) => (
                  <li key={item} className="rounded-xl bg-slate-50 p-3">{localizedCatalogLabel(item, i18n.language)}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setSelected({
                  title: card.title,
                  summary: modalContent[card.title as keyof typeof modalContent]?.summary ?? t('public.defaultTraining'),
                  debouches: modalContent[card.title as keyof typeof modalContent]?.debouches ?? card.debouches,
                  items: card.items,
                })}
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                {t('public.learnMore')}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <h2 className="text-3xl font-black text-slate-900">{t('public.qualifying')}</h2>
          <p className="mt-4 text-lg text-slate-600">{t('public.catalog')}</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {qualifyingCards.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700 shadow-sm">
                <div className="min-h-[72px]">{localizedCatalogLabel(item, i18n.language)}</div>
                <button
                  type="button"
                  onClick={() => setSelected(modalContent[item as keyof typeof modalContent] ?? { title: item, summary: t('public.defaultTraining'), debouches: localizedGenericCareers(i18n.language) })}
                  className="mt-4 inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:text-blue-800"
                >
                  {t('public.learnMore')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <h2 className="text-3xl font-black text-slate-900">{t('public.certifying')}</h2>
          <p className="mt-4 text-lg text-slate-600">
            {t('public.certifyingText')}
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {certifyingCards.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <div className="font-semibold text-slate-700">{localizedCatalogLabel(item, i18n.language)}</div>
                <button
                  type="button"
                  onClick={() => setSelected(modalContent[item === 'Intelligence Artificielle' ? 'Intelligence Artificielle certif' : item === 'Cloud Computing' ? 'Cloud Computing' : item === 'Internet des Objets (AET/IoT)' ? 'Internet des Objets (AET/IoT)' : item === 'Big Data' ? 'Big Data' : 'Cybersécurité'])}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:text-blue-800"
                >
                  {t('public.learnMore')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">{t('public.careers')}</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">{selected.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {t('public.close')}
              </button>
            </div>

            <p className="mt-4 text-slate-600">{localizedModalContent(selected, i18n.language).summary ?? t('public.defaultTraining')}</p>

            <ul className="mt-6 space-y-3">
              {localizedModalContent(selected, i18n.language).debouches?.map((item) => (
                <li key={item} className="rounded-xl bg-slate-50 p-3 text-slate-700">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
