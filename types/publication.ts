export type PublicationAttachment = {
  name: string;
  url: string;
  size?: number;
  type?: string;
  path?: string;
};

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
  attachments: PublicationAttachment[];
  createdAt: string;
  updatedAt: string;
};
