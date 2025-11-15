import type LineContext from 'bottender/dist/line/LineContext';

import {
  sendCarouselTemplate,
  sendLocaleSelectionMessage,
  sendLocaleUpdatedMessage,
  sendMainMenuTemplate,
  sendSectionTextMessage,
} from '@/bot/messages';
import type { SectionId } from '@/lib/replyScripts';
import { getUserLocale, setUserLocale } from '@/lib/locale';
import {
  detectLocaleCommand,
  isCarouselCommand,
  isLanguagePrompt,
  isMenuCommand,
} from '@/lib/commands';
import { matchSectionFromText } from '@/lib/sectionMatcher';

function resolveSectionFromText(text: string | undefined): SectionId {
  const matched = matchSectionFromText(text);
  return matched ?? 'welcome';
}

export async function handleLineEvent(context: LineContext): Promise<void> {
  const userId = context.event.source?.userId;
  const locale = getUserLocale(userId);
  const text = context.event.isText ? context.event.text : undefined;

  if (context.event.isFollow || context.event.isJoin) {
    await sendSectionTextMessage(context, 'welcome', locale);
    return;
  }

  const localeCommand = detectLocaleCommand(text);

  if (localeCommand) {
    setUserLocale(userId, localeCommand);
    await sendLocaleUpdatedMessage(context, localeCommand);
    return;
  }

  if (isLanguagePrompt(text)) {
    await sendLocaleSelectionMessage(context, locale);
    return;
  }

  if (isMenuCommand(text)) {
    await sendMainMenuTemplate(context, locale);
    return;
  }

  if (isCarouselCommand(text)) {
    await sendSectionTextMessage(context, 'schedule', locale);
    await sendCarouselTemplate(context, locale);
    return;
  }

  if (context.event.isText) {
    const section = resolveSectionFromText(text);

    await sendSectionTextMessage(context, section, locale);

    if (section === 'schedule') {
      await sendCarouselTemplate(context, locale);
    }

    return;
  }

  await sendSectionTextMessage(context, 'welcome', locale);
}

