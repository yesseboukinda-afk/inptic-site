import './globals.css';
import { ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatBot from '@/components/ChatBot';
import BackToTop from '@/components/BackToTop';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
  title: 'INPTIC - Institut National Polytechnique des Technologies de l\'Information et de la Communication',
  description: 'Portail numérique de l\'INPTIC'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        {children}
        <Footer />
        <BackToTop />
        <ChatBot />
        <ScrollReveal />
      </body>
    </html>
  );
}
