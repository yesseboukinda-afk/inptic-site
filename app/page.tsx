import { connection } from 'next/server';
import HomePageClient from '@/components/HomePageClient';

export default async function Home() {
  await connection();
  return <HomePageClient />;
}
