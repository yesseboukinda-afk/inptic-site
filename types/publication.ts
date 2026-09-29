export type ResearchPublication = {
  id: string;
  title: string;
  slug: string;
  authors: string[];
  publicationDate: string;
  year: number;
  domain: string;
  abstract: string;
  keywords: string[];
  journalOrConference?: string | null;
  doiOrUrl?: string | null;
  pdfUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};
