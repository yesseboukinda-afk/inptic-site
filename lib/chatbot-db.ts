import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

type ChatbotDatabase = InstanceType<typeof DatabaseSync>;
export type DocumentKind = 'text' | 'code' | 'sheet';

export type ChatRecord = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessageRecord = {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type DocumentRecord = {
  id: string;
  title: string;
  kind: DocumentKind;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const databasePath = process.env.INPTIC_CHATBOT_DB_PATH || path.join(process.cwd(), 'data', 'inptic-chatbot.sqlite');
let database: ChatbotDatabase | undefined;

function getDatabase() {
  if (database) return database;

  mkdirSync(path.dirname(databasePath), { recursive: true });
  database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('text', 'code', 'sheet')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages(chat_id, created_at);
    CREATE INDEX IF NOT EXISTS documents_updated_at_idx ON documents(updated_at);
  `);

  return database;
}

function now() {
  return new Date().toISOString();
}

export function createChat(title = 'Nouvelle conversation'): ChatRecord {
  const chat = {
    id: crypto.randomUUID(),
    title: title.trim().slice(0, 120) || 'Nouvelle conversation',
    createdAt: now(),
    updatedAt: now(),
  };
  getDatabase().prepare('INSERT INTO chats (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)').run(chat.id, chat.title, chat.createdAt, chat.updatedAt);
  return chat;
}

export function touchChat(chatId: string) {
  getDatabase().prepare('UPDATE chats SET updated_at = ? WHERE id = ?').run(now(), chatId);
}

export function chatExists(chatId: string) {
  return Boolean(getDatabase().prepare('SELECT id FROM chats WHERE id = ?').get(chatId));
}

export function saveChatMessage(chatId: string, role: ChatMessageRecord['role'], content: string) {
  const message = {
    id: crypto.randomUUID(),
    chatId,
    role,
    content,
    createdAt: now(),
  };
  getDatabase().prepare('INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)').run(message.id, message.chatId, message.role, message.content, message.createdAt);
  touchChat(chatId);
  return message;
}

export function getChatMessages(chatId: string): ChatMessageRecord[] {
  return getDatabase().prepare(`
    SELECT id, chat_id AS chatId, role, content, created_at AS createdAt
    FROM messages WHERE chat_id = ? ORDER BY created_at ASC
  `).all(chatId) as unknown as ChatMessageRecord[];
}

export function listChats(): ChatRecord[] {
  return getDatabase().prepare(`
    SELECT id, title, created_at AS createdAt, updated_at AS updatedAt
    FROM chats ORDER BY updated_at DESC
  `).all() as unknown as ChatRecord[];
}

export function saveDocument(input: { id?: string; title: string; kind: DocumentKind; content: string }): DocumentRecord {
  const existing = input.id ? getDocument(input.id) : null;
  const document = {
    id: existing?.id || input.id || crypto.randomUUID(),
    title: input.title.trim().slice(0, 160) || 'Document INPTIC',
    kind: input.kind,
    content: input.content,
    createdAt: existing?.createdAt || now(),
    updatedAt: now(),
  };

  getDatabase().prepare(`
    INSERT INTO documents (id, title, kind, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET title = excluded.title, kind = excluded.kind,
      content = excluded.content, updated_at = excluded.updated_at
  `).run(document.id, document.title, document.kind, document.content, document.createdAt, document.updatedAt);
  return document;
}

export function getDocument(documentId: string): DocumentRecord | null {
  return (getDatabase().prepare(`
    SELECT id, title, kind, content, created_at AS createdAt, updated_at AS updatedAt
    FROM documents WHERE id = ?
  `).get(documentId) as unknown as DocumentRecord | undefined) || null;
}

export function listDocuments(): DocumentRecord[] {
  return getDatabase().prepare(`
    SELECT id, title, kind, content, created_at AS createdAt, updated_at AS updatedAt
    FROM documents ORDER BY updated_at DESC
  `).all() as unknown as DocumentRecord[];
}
