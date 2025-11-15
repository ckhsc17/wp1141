import type { SectionId } from '@/lib/replyScripts';
import { supportedLocales, type SupportedLocale } from '@/lib/locale';
import { getCarousel, getMainMenu, getQuickReplies, getSectionContent } from '@/lib/replyScripts';

import type LineContext from 'bottender/dist/line/LineContext';

type QuickReplyItem = {
  type: 'action';
  action: {
    type: 'message';
    label: string;
    text: string;
  };
};

function buildQuickReply(locale: SupportedLocale): QuickReplyItem[] | undefined {
  const options = getQuickReplies(locale);

  if (options.length === 0) {
    return undefined;
  }

  return options.map((option) => ({
    type: 'action',
    action: {
      type: 'message',
      label: option.label,
      text: option.label,
    },
  }));
}

export async function sendSectionTextMessage(
  context: LineContext,
  section: SectionId,
  locale: SupportedLocale,
): Promise<void> {
  const content = getSectionContent(locale, section);
  const messageLines = [content.title, ...content.body];
  const quickReply = buildQuickReply(locale);

  await context.reply([
    {
      type: 'text',
      text: messageLines.join('\n\n'),
      ...(quickReply ? { quickReply: { items: quickReply } } : {}),
    },
  ]);
}

export async function sendMainMenuTemplate(
  context: LineContext,
  locale: SupportedLocale,
): Promise<void> {
  const template = getMainMenu(locale);
  const altText = locale === 'zh-TW' ? '課程主選單' : 'Course main menu';

  await context.replyTemplate(altText, {
    type: 'buttons',
    title: template.title,
    text: template.text,
    actions: template.actions.map((action) => ({
      type: 'message',
      label: action.label,
      text: action.label,
    })),
  });
}

export async function sendCarouselTemplate(
  context: LineContext,
  locale: SupportedLocale,
): Promise<void> {
  const columns = getCarousel(locale);
  const altText = locale === 'zh-TW' ? '課程進階資訊' : 'Course deep dive';

  await context.replyTemplate(altText, {
    type: 'carousel',
    columns: columns.map((column) => ({
      title: column.title,
      text: column.text,
      actions: column.actions.map((action) => ({
        type: 'message',
        label: action.label,
        text: action.label,
      })),
    })),
  });
}

export async function sendLocaleSelectionMessage(
  context: LineContext,
  currentLocale: SupportedLocale,
): Promise<void> {
  const text =
    currentLocale === 'zh-TW'
      ? '請選擇想使用的語言：'
      : 'Please choose your preferred language:';

  const quickReplyItems = (Object.entries(supportedLocales) as [SupportedLocale, string][]).map(
    ([locale, label]) => ({
      type: 'action' as const,
      action: {
        type: 'message' as const,
        label: locale === currentLocale ? `${label} ✅` : label,
        text: label,
      },
    }),
  );

  await context.reply([
    {
      type: 'text',
      text,
      quickReply: {
        items: quickReplyItems,
      },
    },
  ]);
}

export async function sendLocaleUpdatedMessage(
  context: LineContext,
  locale: SupportedLocale,
): Promise<void> {
  const message =
    locale === 'zh-TW' ? '已切換為繁體中文，以下為最新資訊。' : 'Language switched to English. Here is the updated info.';

  await context.reply([
    {
      type: 'text',
      text: message,
    },
  ]);
  await sendSectionTextMessage(context, 'welcome', locale);
}

