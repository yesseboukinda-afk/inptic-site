const audioCache = new Map<string, string>();

function cleanTextForSpeech(text: string) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/[*_`]/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);
}

async function getSpeechAudio(text: string, signal: AbortSignal) {
  const cachedUrl = audioCache.get(text);
  if (cachedUrl) return cachedUrl;

  const response = await fetch('/api/chat/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || 'La génération de la voix a échoué.');
  }

  const audioBlob = await response.blob();
  if (!audioBlob.size) throw new Error('Gemini n’a renvoyé aucun fichier audio.');

  const url = URL.createObjectURL(audioBlob);
  audioCache.set(text, url);

  if (audioCache.size > 8) {
    const oldestEntry = audioCache.entries().next().value as [string, string] | undefined;
    if (oldestEntry) {
      URL.revokeObjectURL(oldestEntry[1]);
      audioCache.delete(oldestEntry[0]);
    }
  }

  return url;
}

function selectFrenchVoice() {
  const feminineVoicePattern =
    /\b(female|woman|feminine|amelie|audrey|celine|claire|julie|lea|louise|manon|marie|alice|camille|chloe|sylvie|virginie|hortense|denise|helene|francine|margaux)\b/i;

  return window.speechSynthesis.getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith('fr'))
    .sort((first, second) => {
      const score = (voice: SpeechSynthesisVoice) =>
        (voice.lang.toLowerCase() === 'fr-fr' ? 4 : 0) +
        (feminineVoicePattern.test(voice.name) ? 8 : 0) +
        (/\b(natural|neural|premium|online)\b/i.test(voice.name) ? 3 : 0) +
        (!voice.localService ? 1 : 0);
      return score(second) - score(first);
    })[0];
}

function speakWithBrowserVoice(
  text: string,
  voice: SpeechSynthesisVoice | undefined,
  onEnd: () => void,
  onError: (message: string) => void,
) {
  const synthesis = window.speechSynthesis;
  const chunks = text.match(/[^.!?…]+[.!?…]+["»”)]*|[^.!?…]+$/g) || [text];
  let index = 0;
  let cancelled = false;

  const speakNext = () => {
    if (cancelled) return;
    const chunk = chunks[index++]?.trim();
    if (!chunk) {
      onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = voice?.lang || 'fr-FR';
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    if (voice) utterance.voice = voice;
    utterance.onend = speakNext;
    utterance.onerror = (event) => {
      if (!cancelled && event.error !== 'canceled' && event.error !== 'interrupted') {
        onError('La voix locale de secours n’a pas pu être lue.');
      }
    };
    synthesis.speak(utterance);
  };

  speakNext();
  return () => {
    cancelled = true;
    synthesis.cancel();
  };
}

export function speakFrenchText(
  text: string,
  onEnd: () => void,
  onError: (message: string) => void,
  onFallback: (message: string) => void,
) {
  const cleanText = cleanTextForSpeech(text);
  const controller = new AbortController();
  let audio: HTMLAudioElement | undefined;
  let cancelled = false;
  let finished = false;
  let objectUrl: string | undefined;
  let cancelBrowserSpeech: (() => void) | undefined;

  const finish = () => {
    if (cancelled || finished) return;
    finished = true;
    onEnd();
  };

  void getSpeechAudio(cleanText, controller.signal)
    .then((url) => {
      if (cancelled) return;
      objectUrl = url;
      audio = new Audio(url);
      audio.onended = finish;
      audio.onerror = () => {
        if (!cancelled && !finished) {
          finished = true;
          onError('Le navigateur n’a pas pu lire la réponse audio.');
        }
      };
      return audio.play().catch(() => {
        if (!cancelled && !finished) {
          finished = true;
          onError('La lecture automatique est bloquée. Cliquez de nouveau sur « Écouter ».');
        }
      });
    })
    .catch((error: unknown) => {
      if (cancelled || finished) return;
      if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
        finished = true;
        onError(error instanceof Error ? error.message : 'La génération de la voix a échoué.');
        return;
      }

      const voice = selectFrenchVoice();
      const voiceName = voice?.name ? ` (« ${voice.name} »)` : '';
      onFallback(
        `Gemini TTS est indisponible ; lecture avec la voix française locale${voiceName}. Une voix française féminine installée est utilisée si disponible.`,
      );
      cancelBrowserSpeech = speakWithBrowserVoice(cleanText, voice, finish, onError);
    });

  return () => {
    cancelled = true;
    controller.abort();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.onended = null;
      audio.onerror = null;
    }
    cancelBrowserSpeech?.();
    if (objectUrl && !audioCacheHasUrl(objectUrl)) URL.revokeObjectURL(objectUrl);
  };
}

function audioCacheHasUrl(url: string) {
  return Array.from(audioCache.values()).includes(url);
}
