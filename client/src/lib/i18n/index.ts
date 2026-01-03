import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../../locales/en.json';
import hi from '../../locales/hi.json';
import ar from '../../locales/ar.json';
import th from '../../locales/th.json';
import ms from '../../locales/ms.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  ar: { translation: ar },
  th: { translation: th },
  ms: { translation: ms },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
