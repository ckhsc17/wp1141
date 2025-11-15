export type SupportedLocale = 'zh-TW' | 'en-US';

const DEFAULT_LOCALE: SupportedLocale = 'zh-TW';

const localeMemory = new Map<string, SupportedLocale>();

export function getUserLocale(userId?: string): SupportedLocale {
  if (!userId) {
    return DEFAULT_LOCALE;
  }

  return localeMemory.get(userId) ?? DEFAULT_LOCALE;
}

export function setUserLocale(userId: string | undefined, locale: SupportedLocale): void {
  if (!userId) {
    return;
  }

  localeMemory.set(userId, locale);
}

export function toggleLocale(current: SupportedLocale): SupportedLocale {
  return current === 'zh-TW' ? 'en-US' : 'zh-TW';
}

export const supportedLocales: Record<SupportedLocale, string> = {
  'zh-TW': '繁體中文',
  'en-US': 'English',
};

