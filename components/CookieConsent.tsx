'use client';

import { useCallback, useEffect, useState } from 'react';
import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';
import { useTranslation } from 'react-i18next';
import {
  COOKIE_PREFERENCES_EVENT,
  getBrowserCookieConsent,
  saveBrowserCookieConsent,
  type CookieConsent as CookieConsentValue,
} from '@/lib/cookie-consent';
import { cookieConsentCopy, type CookieConsentLanguage } from '@/lib/cookie-consent-copy';

export default function CookieConsent() {
  const { i18n } = useTranslation();
  const [consent, setConsent] = useState<CookieConsentValue | null>(null);
  const [analyticsWasEnabled, setAnalyticsWasEnabled] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [saveError, setSaveError] = useState('');

  const language = (i18n.resolvedLanguage?.split('-')[0] || 'fr') as CookieConsentLanguage;
  const copy = cookieConsentCopy[language] ?? cookieConsentCopy.fr;

  useEffect(() => {
    const storedConsent = getBrowserCookieConsent();
    setConsent(storedConsent);
    setAnalyticsEnabled(storedConsent?.analytics ?? false);

    const openPreferences = () => {
      setAnalyticsEnabled(getBrowserCookieConsent()?.analytics ?? false);
      setSaveError('');
      setIsCustomizing(true);
    };
    window.addEventListener(COOKIE_PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, openPreferences);
  }, []);

  useEffect(() => {
    if (consent?.analytics) setAnalyticsWasEnabled(true);
  }, [consent?.analytics]);

  const saveConsent = (nextConsent: CookieConsentValue) => {
    setSaveError('');
    if (!saveBrowserCookieConsent(nextConsent)) {
      setSaveError(copy.saveError);
      return;
    }

    setConsent(nextConsent);
    setAnalyticsEnabled(nextConsent.analytics);
    setIsCustomizing(false);
  };

  const filterAnalyticsEvent = useCallback((event: BeforeSendEvent) => {
    return getBrowserCookieConsent()?.analytics ? event : null;
  }, []);

  const showPrompt = consent === null || isCustomizing;

  return (
    <>
      {(consent?.analytics || analyticsWasEnabled) && (
        <Analytics beforeSend={filterAnalyticsEvent} />
      )}

      {showPrompt && (
        <aside
          className="cookie-consent-panel"
          aria-label={copy.title}
          aria-live="polite"
        >
          <div className="cookie-consent-content">
            <div>
              <div className="cookie-consent-heading">
                <img src="/logoinptic.ico" alt="INPTIC" width={40} height={40} className="h-10 w-10 object-contain" />
                <div>
                  <h2>{copy.title}</h2>
                  <p>{copy.description}</p>
                </div>
              </div>
              <a href="/confidentialite">{copy.privacy}</a>
            </div>

            {isCustomizing && (
              <div className="cookie-consent-options">
                <label>
                  <input type="checkbox" checked disabled />
                  <span>
                    <strong>{copy.necessaryTitle}</strong>
                    <small>{copy.necessaryDescription}</small>
                  </span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={analyticsEnabled}
                    onChange={(event) => setAnalyticsEnabled(event.target.checked)}
                  />
                  <span>
                    <strong>{copy.analyticsTitle}</strong>
                    <small>{copy.analyticsDescription}</small>
                  </span>
                </label>
              </div>
            )}

            {saveError && <p className="cookie-consent-error" role="alert">{saveError}</p>}

            <div className="cookie-consent-actions">
              {isCustomizing ? (
                <button
                  type="button"
                  onClick={() => saveConsent({ version: 1, analytics: analyticsEnabled })}
                >
                  {copy.saveChoices}
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => setIsCustomizing(true)}>
                    {copy.customize}
                  </button>
                  <button type="button" onClick={() => saveConsent({ version: 1, analytics: false })}>
                    {copy.rejectOptional}
                  </button>
                  <button type="button" onClick={() => saveConsent({ version: 1, analytics: true })}>
                    {copy.acceptAll}
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
