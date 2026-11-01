import { connection } from 'next/server';
import HomePageClient from '@/components/HomePageClient';
import { DEFAULT_YOUTUBE_CHANNEL_ID } from '@/lib/youtube';

export default async function Home() {
  await connection();
  const youtubeChannelId = process.env.YOUTUBE_CHANNEL_ID || DEFAULT_YOUTUBE_CHANNEL_ID;
  return <HomePageClient youtubeChannelId={youtubeChannelId} />;
}
