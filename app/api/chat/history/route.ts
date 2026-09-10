import { NextResponse } from 'next/server';
import { getChatMessages, listChats } from '@/lib/chatbot-db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const chatId = url.searchParams.get('id');

  if (chatId) {
    return NextResponse.json({ chatId, messages: getChatMessages(chatId) });
  }

  return NextResponse.json(listChats());
}