import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

// 翻譯文件類型
type TranslationKey = string;
type TranslationValue = string | { [key: string]: TranslationValue };
type Translations = { [key: string]: TranslationValue };

// 導入翻譯文件
import zhTWTranslations from '@/locales/zh-TW.json';
import enTranslations from '@/locales/en.json';

const translations: { [locale: string]: Translations } = {
  'zh-TW': zhTWTranslations,
  'en': enTranslations,
};

export const useTranslation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocale] = useState<string>('zh-TW');

  // 從 pathname 或 localStorage 獲取當前語言
  useEffect(() => {
    // 優先從 pathname 獲取語言（這是最可靠的來源）
    const pathLocale = pathname.startsWith('/en') ? 'en' : 'zh-TW';
    
    // 如果路徑語言與當前語言不同，則更新
    if (pathLocale !== locale) {
      setLocale(pathLocale);
      
      // 同步更新 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('locale', pathLocale);
        document.documentElement.lang = pathLocale;
      }
      
      console.log(`🔄 Language detected from path: ${pathLocale}`);
    }
  }, [pathname, locale]);

  const t = useCallback((key: TranslationKey): string => {
    const keys = key.split('.');
    let value: TranslationValue = translations[locale];

    for (const k of keys) {
      if (typeof value === 'object' && value !== null && k in value) {
        value = value[k];
      } else {
        // 如果找不到翻譯，嘗試使用默認語言
        let fallbackValue: TranslationValue = translations['zh-TW'];
        for (const fallbackK of keys) {
          if (typeof fallbackValue === 'object' && fallbackValue !== null && fallbackK in fallbackValue) {
            fallbackValue = fallbackValue[fallbackK];
          } else {
            return key; // 如果都找不到，返回 key 本身
          }
        }
        return typeof fallbackValue === 'string' ? fallbackValue : key;
      }
    }

    return typeof value === 'string' ? value : key;
  }, [locale]);

  const changeLanguage = useCallback((newLocale: string) => {
    setLocale(newLocale);
    
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
      document.documentElement.lang = newLocale;
    }

    // 使用 App Router 的導航方式
    let newPath: string;
    
    if (newLocale === 'en') {
      // 切換到英文：如果當前路徑不是以 /en 開頭，則添加 /en
      newPath = pathname.startsWith('/en') ? pathname : `/en${pathname === '/' ? '' : pathname}`;
    } else {
      // 切換到中文：移除 /en 前綴
      if (pathname.startsWith('/en')) {
        newPath = pathname.replace('/en', '') || '/';
      } else {
        newPath = pathname;
      }
    }
    
    console.log(`🌍 Language change: ${locale} -> ${newLocale}, Path: ${pathname} -> ${newPath}`);
    router.push(newPath);
  }, [router, pathname, locale]);

  return {
    t,
    locale,
    changeLanguage,
    isZhTW: locale === 'zh-TW',
    isEn: locale === 'en',
  };
};
