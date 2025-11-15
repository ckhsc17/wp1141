import type { SupportedLocale } from './locale';

const MENU_KEYWORDS = ['menu', '主選單', 'buttons', '選單', '課程導覽', 'course guide'];
const CAROUSEL_KEYWORDS = ['carousel', 'more info', '更多資訊', 'deep dive', '更多內容'];
const LANGUAGE_PROMPT_KEYWORDS = ['language', '語言', '切換語言', '選擇語言'];
const LOCALE_KEYWORDS: Record<SupportedLocale, string[]> = {
  'zh-TW': ['繁體中文', '中文', 'traditional chinese', 'zh', 'zh-tw'],
  'en-US': ['english', '英文', 'en', 'en-us'],
};

function normalize(text: string | undefined): string {
  return (text ?? '').trim().toLowerCase();
}

export function isMenuCommand(text: string | undefined): boolean {
  const normalized = normalize(text);
  return MENU_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function isCarouselCommand(text: string | undefined): boolean {
  const normalized = normalize(text);
  return CAROUSEL_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function isLanguagePrompt(text: string | undefined): boolean {
  const normalized = normalize(text);
  return LANGUAGE_PROMPT_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function detectLocaleCommand(text: string | undefined): SupportedLocale | undefined {
  const normalized = normalize(text);

  return (Object.keys(LOCALE_KEYWORDS) as SupportedLocale[]).find((locale) =>
    LOCALE_KEYWORDS[locale].some((keyword) => normalized.includes(keyword)),
  );
}

