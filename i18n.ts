import { getRequestConfig } from 'next-intl/server'

export const locales = ['ko', 'en', 'zh', 'vi', 'ja', 'th', 'id'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ko'

type Messages = { [key: string]: string | Messages }

function isPlainObject(value: unknown): value is Messages {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** base 위에 override를 깊은 병합. override에 없는 키는 base 값으로 채운다. (원본 객체는 변경하지 않음) */
function deepMerge(base: Messages, override: Messages): Messages {
  const result: Messages = { ...base }
  for (const key of Object.keys(override)) {
    const b = base[key]
    const o = override[key]
    result[key] = isPlainObject(b) && isPlainObject(o) ? deepMerge(b, o) : o
  }
  return result
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale
  }

  // 번역 키 누락 시 ko로 폴백: ko 메시지 위에 현재 언어 메시지를 깊은 병합
  const fallback: Messages = (await import('./messages/ko.json')).default
  const messages: Messages =
    locale === defaultLocale
      ? fallback
      : deepMerge(fallback, (await import(`./messages/${locale}.json`)).default)

  return { locale, messages }
})