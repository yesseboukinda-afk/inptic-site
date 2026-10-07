export type ConcoursStatus = 'a_venir' | 'en_cours' | 'termine';

export type ConcoursAttachment = {
  name: string;
  url: string;
  size?: number;
  type?: string;
  path?: string;
};

export type ConcoursItem = {
  id: string;
  title: string;
  slug: string;
  department: string;
  sessionYear: number;
  status: ConcoursStatus;
  description: string;
  conditions: string[];
  calendar: {
    registrationStart?: string | null;
    registrationEnd?: string | null;
    examDate?: string | null;
    resultsDate?: string | null;
  };
  attachments: ConcoursAttachment[];
  results: {
    published: boolean;
    publishedAt?: string | null;
    admittedList: string[];
    waitingList: string[];
    pdfUrl?: string | null;
    notes?: string | null;
  };
  createdAt: string;
  updatedAt: string;
};
