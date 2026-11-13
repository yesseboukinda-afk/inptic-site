import 'server-only';

const SECRET_PATTERNS: RegExp[] = [
  // Anthropic / Claude
  /sk-ant-[a-zA-Z0-9_\-]{20,}/g,
  // Groq
  /gsk_[a-zA-Z0-9_\-]{20,}/g,
  // OpenRouter
  /sk-or-v1-[a-zA-Z0-9_\-]{20,}/g,
  // OpenAI / DeepSeek
  /sk-[a-zA-Z0-9_\-]{20,}/g,
  // Google Gemini API keys
  /AQ\.[a-zA-Z0-9_\-]{20,}/g,
  /AIza[0-9A-Za-z-_]{35}/g,
  // Database connection strings with passwords
  /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/gi,
  // Bearer tokens
  /Bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi,
];

/**
 * Redacts any detected secret tokens or credentials from a string.
 */
export function sanitizeSecrets(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let sanitized = input;

  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) => {
      if (match.toLowerCase().startsWith('bearer')) {
        return 'Bearer [REDACTED]';
      }
      if (match.toLowerCase().startsWith('postgres')) {
        return 'postgres://***:***@';
      }
      return `${match.slice(0, 4)}***[REDACTED]`;
    });
  }

  return sanitized;
}

const TECHNICAL_ERROR_KEYWORDS = [
  'database_url',
  'ai_settings_encryption_key',
  'api_key',
  'apikey',
  'singpay_client',
  'smtp_password',
  'password',
  'secret',
  'bearer',
  'token',
  'connect econnrefused',
  'enotfound',
  'etimedout',
  'pg_',
  'postgresql',
  'sql',
  'syntax error',
  'relation "',
  'column "',
  'stack trace',
  'at async',
  'node_modules',
];

/**
 * Returns a safe, user-friendly error message that is guaranteed
 * never to leak API keys, system paths, or database internals.
 */
export function safeClientErrorMessage(error: unknown, fallbackMessage: string): string {
  if (!error) return fallbackMessage;

  const rawMessage = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : '';

  if (!rawMessage || typeof rawMessage !== 'string') {
    return fallbackMessage;
  }

  const lower = rawMessage.toLowerCase();
  for (const keyword of TECHNICAL_ERROR_KEYWORDS) {
    if (lower.includes(keyword)) {
      return fallbackMessage;
    }
  }

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(rawMessage)) {
      return fallbackMessage;
    }
  }

  // If the message is short, clean and has no technical jargon, return sanitized version
  if (rawMessage.length < 200 && !rawMessage.includes('{') && !rawMessage.includes('HTTP')) {
    return sanitizeSecrets(rawMessage);
  }

  return fallbackMessage;
}
