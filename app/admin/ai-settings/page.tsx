'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, RefreshCw, Save, ShieldCheck, Wifi } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { isSuperAdminRole } from '@/lib/roles';

type ProviderId = 'qwen' | 'groq' | 'claude' | 'gemini' | 'deepseek' | 'openai' | 'openrouter' | 'ollama';
type ProviderSetting = {
  provider: ProviderId;
  label: string;
  model: string;
  hasApiKey: boolean;
  thinkingEnabled: boolean;
  isActive: boolean;
};

const providerInfo: Record<ProviderId, { model: string; keyRequired: boolean; hint: string }> = {
  qwen: { model: 'qwen-plus', keyRequired: true, hint: 'Qwen / DashScope' },
  groq: { model: 'llama-3.3-70b-versatile', keyRequired: true, hint: 'Groq Cloud' },
  claude: { model: 'claude-3-5-sonnet-20241022', keyRequired: true, hint: 'Anthropic Claude' },
  gemini: { model: 'gemini-3.1-pro-preview', keyRequired: true, hint: 'Google Gemini' },
  deepseek: { model: 'deepseek-chat', keyRequired: true, hint: 'DeepSeek' },
  openai: { model: 'gpt-4o-mini', keyRequired: true, hint: 'OpenAI' },
  openrouter: { model: 'openai/gpt-4o-mini', keyRequired: true, hint: 'OpenRouter' },
  ollama: { model: 'llama3.2', keyRequired: false, hint: 'Ollama sur le serveur' },
};

const providerOptions: { id: ProviderId; label: string }[] = [
  { id: 'qwen', label: 'Alibaba Qwen / DashScope' },
  { id: 'groq', label: 'Groq Cloud' },
  { id: 'claude', label: 'Anthropic Claude' },
  { id: 'gemini', label: 'Google Gemini' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'openrouter', label: 'OpenRouter' },
  { id: 'ollama', label: 'Ollama sur le serveur' },
];

export default function AISettingsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<ProviderSetting[]>([]);
  const [provider, setProvider] = useState<ProviderId>('ollama');
  const [model, setModel] = useState(providerInfo.ollama.model);
  const [apiKey, setApiKey] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelLoadError, setModelLoadError] = useState('');
  const [thinkingEnabled, setThinkingEnabled] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const modelRequestId = useRef(0);

  const loadModels = useCallback(async (targetProvider: ProviderId, preferredModel: string, providedApiKey = '') => {
    const requestId = ++modelRequestId.current;
    setModelsLoading(true);
    setModelLoadError('');
    try {
      const response = await fetch('/api/admin/ai-settings/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: targetProvider, apiKey: providedApiKey || undefined }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Impossible de charger la liste des modèles.');
      if (requestId !== modelRequestId.current) return;

      const models: string[] = Array.isArray(result.models)
        ? result.models.filter((item: unknown): item is string => typeof item === 'string')
        : [];
      setAvailableModels(models);
      if (models.length) {
        setModel(
          models.find((item) => item === preferredModel)
          || models.find((item) => item === providerInfo[targetProvider].model)
          || models[0],
        );
      }
    } catch (loadError) {
      if (requestId !== modelRequestId.current) return;
      setModelLoadError(loadError instanceof Error ? loadError.message : 'Impossible de charger la liste des modèles.');
    } finally {
      if (requestId === modelRequestId.current) setModelsLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/ai-settings', { cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Impossible de charger la configuration IA.');
      const list = Array.isArray(result.providers) ? result.providers as ProviderSetting[] : [];
      setProviders(list);
      const active = list.find((item) => item.isActive);
      if (active) {
        setProvider(active.provider);
        setModel(active.model);
        setThinkingEnabled(active.thinkingEnabled);
        void loadModels(active.provider, active.model);
      } else {
        void loadModels('ollama', providerInfo.ollama.model);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger la configuration IA.');
    } finally {
      setLoading(false);
    }
  }, [loadModels]);

  useEffect(() => {
    let active = true;
    void authClient.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError('La session ne peut pas être vérifiée. Rechargez la page.');
        setLoading(false);
        return;
      }
      if (!data.session || !isSuperAdminRole(data.session.user.app_metadata?.role)) {
        router.replace('/candidat');
        return;
      }
      setAuthorized(true);
      void loadSettings();
    });
    return () => { active = false; };
  }, [loadSettings, router]);

  const changeProvider = (nextProvider: ProviderId) => {
    const saved = providers.find((item) => item.provider === nextProvider);
    setProvider(nextProvider);
    const preferredModel = saved?.model || providerInfo[nextProvider].model;
    setModel(preferredModel);
    setAvailableModels([]);
    void loadModels(nextProvider, preferredModel);
    setThinkingEnabled(saved?.thinkingEnabled || false);
    setApiKey('');
    setShowApiKey(false);
    setError('');
    setMessage('');
    setModelLoadError('');
  };

  const saveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, apiKey: apiKey.trim() || undefined, thinkingEnabled }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Impossible de tester et enregistrer le fournisseur.');
      setApiKey('');
      setMessage(result.message || 'Configuration testée et enregistrée.');
      await loadSettings();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Impossible de tester et enregistrer le fournisseur.');
    } finally {
      setBusy(false);
    }
  };

  const selected = providers.find((item) => item.provider === provider);
  const requiresKey = providerInfo[provider].keyRequired;

  if (!authorized) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-slate-50 px-4">
        <p className="text-sm font-medium text-slate-500" aria-live="polite">
          {loading ? 'Vérification de l’accès superadmin…' : error || 'Redirection…'}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
          <ArrowLeft size={16} aria-hidden="true" />
          Retour au tableau de bord
        </Link>

        <header className="mt-5 rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-10">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-violet-400/15 p-3 text-violet-200">
              <Bot size={26} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-200">Superadmin · INPTIC</p>
              <h1 className="mt-2 text-3xl font-black">Configuration du moteur IA</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Choisissez le fournisseur utilisé par le chatbot. La connexion est testée avant l’activation.
              </p>
            </div>
          </div>
        </header>

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={17} />{message}</p>}

        <form onSubmit={saveSettings} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            <ShieldCheck size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              Les clés API sont chiffrées avant stockage et ne sont jamais renvoyées au navigateur. Pour remplacer une clé, saisissez sa nouvelle valeur ; laissez le champ vide pour conserver celle déjà enregistrée.
            </p>
          </div>

          <label className="block text-sm font-semibold text-slate-800">
            Fournisseur IA actif
            <select
              value={provider}
              onChange={(event) => changeProvider(event.target.value as ProviderId)}
              disabled={busy || loading}
              className="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            >
              {providerOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}{providers.find((saved) => saved.provider === item.id)?.isActive ? ' · actif' : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="ai-model" className="block text-sm font-semibold text-slate-800">Modèle</label>
                <button
                  type="button"
                  onClick={() => void loadModels(provider, model, apiKey.trim())}
                  disabled={busy || loading || modelsLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={13} className={modelsLoading ? 'animate-spin' : ''} aria-hidden="true" />
                  {modelsLoading ? 'Chargement…' : 'Actualiser les modèles'}
                </button>
              </div>
              <input
                id="ai-model"
                list="ai-provider-models"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                maxLength={120}
                required
                autoComplete="off"
                className="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                placeholder={providerInfo[provider].model}
              />
              <datalist id="ai-provider-models">
                {availableModels.map((availableModel) => <option key={availableModel} value={availableModel} />)}
              </datalist>
              {modelLoadError && <p role="status" className="mt-2 text-xs text-amber-700">{modelLoadError}</p>}
              {!modelLoadError && availableModels.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">Modèles récupérés depuis {providerInfo[provider].hint}.</p>
              )}
            </div>

            <div>
              <label htmlFor="ai-api-key" className="block text-sm font-semibold text-slate-800">
                {requiresKey ? 'Clé API' : 'Clé API (non requise)'}
              </label>
              <div className="relative mt-2">
                <input
                  id="ai-api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  maxLength={512}
                  autoComplete="new-password"
                  disabled={!requiresKey || busy || loading}
                  placeholder={selected?.hasApiKey ? 'Clé configurée · saisissez pour la remplacer' : requiresKey ? 'Saisissez la clé du fournisseur' : 'Aucune clé nécessaire'}
                  className="block min-h-12 w-full rounded-xl border border-slate-300 bg-white py-2 pl-3 pr-12 font-mono text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((visible) => !visible)}
                  disabled={!apiKey}
                  aria-label={showApiKey ? 'Masquer la clé saisie' : 'Afficher la clé saisie'}
                  className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-40"
                >
                  {showApiKey ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <LockKeyhole size={13} aria-hidden="true" />
                {selected?.hasApiKey ? 'Une clé est déjà configurée et reste masquée.' : 'La clé est transmise uniquement au serveur.'}
              </p>
            </div>
          </div>

          {provider === 'qwen' && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4">
              <input
                type="checkbox"
                checked={thinkingEnabled}
                onChange={(event) => setThinkingEnabled(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-500"
              />
              <span>
                <span className="block text-sm font-bold text-violet-950">Mode réflexion (Deep Thinking)</span>
                <span className="mt-1 block text-xs leading-5 text-violet-800">Transmet l’option de raisonnement avancé à l’API compatible Qwen.</span>
              </span>
            </label>
          )}

          {provider === 'ollama' && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Ollama doit être installé sur le serveur avec le modèle <code>llama3.2</code> téléchargé. L’adresse est définie côté serveur avec <code>OLLAMA_BASE_URL</code> (par défaut <code>http://127.0.0.1:11434</code>) et n’est pas modifiable depuis le navigateur.
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {loading ? 'Chargement de la configuration…' : selected?.isActive ? `Fournisseur actuellement actif : ${selected.label}` : `Fournisseur sélectionné : ${providerInfo[provider].hint}`}
            </p>
            <button
              type="submit"
              disabled={busy || loading || !model.trim()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <><Wifi size={17} aria-hidden="true" /><Save size={16} aria-hidden="true" /></>}
              {busy ? 'Test de connexion puis enregistrement…' : 'Tester & enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
