import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { getPostgresPool } from '@/lib/postgres';

export const AI_PROVIDERS = [
  'qwen',
  'groq',
  'claude',
  'gemini',
  'deepseek',
  'openai',
  'openrouter',
  'ollama',
] as const;

export type AIProvider = (typeof AI_PROVIDERS)[number];

export const AI_PROVIDER_DEFAULTS: Record<AIProvider, { label: string; model: string; keyRequired: boolean }> = {
  qwen: { label: 'Alibaba Qwen / DashScope', model: 'qwen-plus', keyRequired: true },
  groq: { label: 'Groq Cloud', model: 'llama-3.3-70b-versatile', keyRequired: true },
  claude: { label: 'Anthropic Claude', model: 'claude-3-5-sonnet-20241022', keyRequired: true },
  gemini: { label: 'Google Gemini', model: 'gemini-3.1-pro-preview', keyRequired: true },
  deepseek: { label: 'DeepSeek', model: 'deepseek-chat', keyRequired: true },
  openai: { label: 'OpenAI', model: 'gpt-4o-mini', keyRequired: true },
  openrouter: { label: 'OpenRouter', model: 'openai/gpt-4o-mini', keyRequired: true },
  ollama: { label: 'Ollama local', model: 'mistral', keyRequired: false },
};

export type AIProviderSettings = {
  provider: AIProvider;
  model: string;
  apiKey: string;
  thinkingEnabled: boolean;
};

export type AIChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ProviderSettingRow = {
  provider: AIProvider;
  model: string;
  api_key_encrypted: string | null;
  thinking_enabled: boolean;
  is_active: boolean;
};

const ENVIRONMENT_KEYS: Record<AIProvider, string | null> = {
  qwen: 'DASHSCOPE_API_KEY',
  groq: 'GROQ_API_KEY',
  claude: 'ANTHROPIC_API_KEY',
  gemini: process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'GOOGLE_GENERATIVE_AI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  openai: 'OPENAI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  ollama: null,
};

function readEncryptionKey() {
  const value = process.env.AI_SETTINGS_ENCRYPTION_KEY || '';
  if (!/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error('AI_SETTINGS_ENCRYPTION_KEY doit contenir 64 caractères hexadécimaux.');
  }
  return Buffer.from(value, 'hex');
}

function encryptApiKey(apiKey: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', readEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
}

function decryptApiKey(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split('.');
  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error('La clé API enregistrée est illisible.');
  }
  const decipher = createDecipheriv('aes-256-gcm', readEncryptionKey(), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function isAIProvider(value: unknown): value is AIProvider {
  return typeof value === 'string' && AI_PROVIDERS.includes(value as AIProvider);
}

export function getEnvironmentApiKey(provider: AIProvider) {
  const keyName = ENVIRONMENT_KEYS[provider];
  return keyName ? process.env[keyName] || '' : '';
}

function postgresErrorCode(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return '';
}

export async function listAIProviderSettings() {
  try {
    const { rows } = await getPostgresPool().query<ProviderSettingRow>(
      `SELECT provider, model, api_key_encrypted, thinking_enabled, is_active
       FROM public.ai_provider_settings`,
    );
    return rows;
  } catch (error) {
    if (postgresErrorCode(error) === '42P01') return null;
    throw error;
  }
}

export async function getActiveAIProviderSettings(): Promise<AIProviderSettings | null> {
  const rows = await listAIProviderSettings();
  if (!rows) return null;
  const row = rows.find((setting) => setting.is_active);
  if (!row) return null;

  const apiKey = row.api_key_encrypted
    ? decryptApiKey(row.api_key_encrypted)
    : getEnvironmentApiKey(row.provider);
  return {
    provider: row.provider,
    model: row.model,
    apiKey,
    thinkingEnabled: row.thinking_enabled,
  };
}

export function getPublicAIProviderSettings(rows: ProviderSettingRow[] | null) {
  return AI_PROVIDERS.map((provider) => {
    const saved = rows?.find((row) => row.provider === provider);
    return {
      provider,
      label: AI_PROVIDER_DEFAULTS[provider].label,
      model: saved?.model || AI_PROVIDER_DEFAULTS[provider].model,
      hasApiKey: Boolean(saved?.api_key_encrypted || getEnvironmentApiKey(provider)),
      thinkingEnabled: saved?.thinking_enabled ?? false,
      isActive: Boolean(saved?.is_active),
    };
  });
}

export function encodeApiKey(apiKey: string) {
  return apiKey ? encryptApiKey(apiKey) : null;
}

export function decodeApiKey(apiKey: string | null) {
  return apiKey ? decryptApiKey(apiKey) : '';
}

function ollamaUrl() {
  const value = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const url = new URL(value);
  const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!['https:', 'http:'].includes(url.protocol) || (url.protocol === 'http:' && !isLoopback)) {
    throw new Error('OLLAMA_BASE_URL doit être HTTPS ou une adresse HTTP locale.');
  }
  return url.href.replace(/\/+$/, '');
}

function providerEndpoint(provider: AIProvider) {
  switch (provider) {
    case 'qwen':
      return 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
    case 'groq':
      return 'https://api.groq.com/openai/v1/chat/completions';
    case 'deepseek':
      return 'https://api.deepseek.com/chat/completions';
    case 'openai':
      return 'https://api.openai.com/v1/chat/completions';
    case 'openrouter':
      return 'https://openrouter.ai/api/v1/chat/completions';
    case 'claude':
      return 'https://api.anthropic.com/v1/messages';
    case 'gemini':
      return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent('MODEL')}:generateContent`;
    case 'ollama':
      return `${ollamaUrl()}/api/chat`;
  }
}

function buildProviderRequest(settings: AIProviderSettings, systemPrompt: string, messages: AIChatMessage[]) {
  const endpoint = providerEndpoint(settings.provider).replace('MODEL', encodeURIComponent(settings.model));
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  let body: Record<string, unknown>;

  if (settings.provider === 'gemini') {
    if (!settings.apiKey) throw new Error('La clé Google Gemini n’est pas configurée.');
    headers['x-goog-api-key'] = settings.apiKey;
    body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })),
      tools: [{ google_search: {} }, { code_execution: {} }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 12288,
        thinkingConfig: { thinkingBudget: 8192 },
      },
    };
  } else if (settings.provider === 'claude') {
    if (!settings.apiKey) throw new Error('La clé Anthropic Claude n’est pas configurée.');
    headers['x-api-key'] = settings.apiKey;
    headers['anthropic-version'] = '2023-06-01';
    body = {
      model: settings.model,
      system: systemPrompt,
      messages: messages.map((message) => ({ role: message.role, content: message.content })),
      max_tokens: 4096,
      temperature: 0.4,
    };
  } else if (settings.provider === 'ollama') {
    body = {
      model: settings.model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: false,
      options: { temperature: 0.4 },
    };
  } else {
    if (!settings.apiKey) throw new Error(`La clé ${AI_PROVIDER_DEFAULTS[settings.provider].label} n’est pas configurée.`);
    headers.Authorization = `Bearer ${settings.apiKey}`;
    if (settings.provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://inptic-ga.org';
      headers['X-Title'] = 'INPTIC Assistant';
    }
    body = {
      model: settings.model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.4,
      max_tokens: 4096,
      ...(settings.provider === 'qwen' ? { enable_thinking: settings.thinkingEnabled } : {}),
    };
  }

  return { endpoint, headers, body };
}

async function callProvider(settings: AIProviderSettings, systemPrompt: string, messages: AIChatMessage[]) {
  const { endpoint, headers, body } = buildProviderRequest(settings, systemPrompt, messages);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    return await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Le fournisseur ${AI_PROVIDER_DEFAULTS[settings.provider].label} ne répond pas dans le délai imparti.`);
    }
    throw new Error(`Impossible de joindre le fournisseur ${AI_PROVIDER_DEFAULTS[settings.provider].label}.`);
  } finally {
    clearTimeout(timeout);
  }
}

export async function testAIProviderConnection(settings: AIProviderSettings) {
  const response = await callProvider(
    settings,
    'Réponds uniquement par le mot OK.',
    [{ role: 'user', content: 'Test de connexion.' }],
  );
  if (!response.ok) {
    return { online: false, message: `Le fournisseur a refusé le test (HTTP ${response.status}). Vérifie le modèle et les identifiants.` };
  }
  return { online: true, message: `Connexion réussie avec ${AI_PROVIDER_DEFAULTS[settings.provider].label}.` };
}

export async function generateAIProviderReply(
  settings: AIProviderSettings,
  systemPrompt: string,
  messages: AIChatMessage[],
) {
  const response = await callProvider(settings, systemPrompt, messages);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Le fournisseur ${AI_PROVIDER_DEFAULTS[settings.provider].label} a répondu avec le statut HTTP ${response.status}.`);
  }

  let reply = '';
  let sources: { uri: string; title?: string }[] = [];
  if (settings.provider === 'gemini') {
    const candidate = data?.candidates?.[0];
    reply = candidate?.content?.parts
      ?.map((part: { text?: unknown }) => typeof part.text === 'string' ? part.text : '')
      .join('')
      .trim() || '';
    const grounding = candidate?.groundingMetadata?.groundingChunks;
    if (Array.isArray(grounding)) {
      sources = grounding.flatMap((chunk: unknown) => {
        const value = chunk && typeof chunk === 'object' ? chunk as Record<string, unknown> : undefined;
        const web = value?.web && typeof value.web === 'object'
          ? value.web as Record<string, unknown>
          : undefined;
        if (typeof web?.uri !== 'string') return [];
        try {
          const uri = new URL(web.uri);
          if (uri.protocol !== 'https:') return [];
          return [{ uri: uri.href, ...(typeof web.title === 'string' ? { title: web.title } : {}) }];
        } catch {
          return [];
        }
      });
      sources = sources.filter((source, index) => sources.findIndex((item) => item.uri === source.uri) === index).slice(0, 5);
    }
  } else if (settings.provider === 'claude') {
    reply = data?.content?.filter((part: { type?: unknown }) => part.type === 'text')
      .map((part: { text?: unknown }) => typeof part.text === 'string' ? part.text : '')
      .join('')
      .trim() || '';
  } else if (settings.provider === 'ollama') {
    reply = typeof data?.message?.content === 'string' ? data.message.content.trim() : '';
  } else {
    reply = typeof data?.choices?.[0]?.message?.content === 'string'
      ? data.choices[0].message.content.trim()
      : '';
  }

  if (!reply) throw new Error(`${AI_PROVIDER_DEFAULTS[settings.provider].label} a renvoyé une réponse vide.`);
  return {
    reply,
    sources,
    usedModel: `${AI_PROVIDER_DEFAULTS[settings.provider].label} · ${settings.model}`,
  };
}
