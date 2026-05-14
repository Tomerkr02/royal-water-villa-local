import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { languageDirections, translations, type Language } from './translations';

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'he',
      setLanguage: (language) => set({ language })
    }),
    {
      name: 'royal-water-villa:language'
    }
  )
);

export function useI18n() {
  const language = useLanguageStore((state) => state.language);
  return {
    language,
    direction: languageDirections[language],
    t: translations[language]
  };
}
