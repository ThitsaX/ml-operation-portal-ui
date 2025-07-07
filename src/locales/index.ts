import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import mm from './mm.json'

export type supportedLngs = 'en' | 'mm'

type ISupportedLanguageType = {
  [key in supportedLngs]: string;
}

export const SupportedLanguages: ISupportedLanguageType = {
  en: 'English',
  mm: 'မြန်မာ'
}

const resources = {
  en: {
    translations: en
  },
  mm: {
    translations: mm
  }
}

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translations'
    resources: typeof resources['en']
  }
}

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  fallbackLng: Object.keys(resources),
  lng: 'en',
  resources,
  defaultNS: 'translations',
  supportedLngs: ['en', 'mm']
})

export default i18n
