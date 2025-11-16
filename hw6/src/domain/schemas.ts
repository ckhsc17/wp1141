import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.string(),
  displayName: z.string().optional(),
  locale: z.enum(['zh-TW', 'en-US']).default('zh-TW'),
  timeZone: z.string().default('Asia/Taipei'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const SavedItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sourceType: z.enum(['link', 'note', 'chat']),
  title: z.string().optional(),
  content: z.string(),
  url: z.string().url().optional(),
  category: z.enum(['inspiration', 'knowledge', 'project', 'tool', 'entertainment']),
  tags: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
});

export type SavedItem = z.infer<typeof SavedItemSchema>;

export const ReminderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  triggerAt: z.date(),
  status: z.enum(['pending', 'sent']).default('pending'),
  createdAt: z.date().default(() => new Date()),
});

export type Reminder = z.infer<typeof ReminderSchema>;

export const InsightSchema = z.object({
  id: z.string(),
  userId: z.string(),
  summary: z.string(),
  actionItems: z.array(z.string()).default([]),
  sentiment: z.enum(['positive', 'neutral', 'negative']).default('neutral'),
  createdAt: z.date().default(() => new Date()),
});

export type Insight = z.infer<typeof InsightSchema>;

export const SharedContentSchema = z.object({
  text: z.string().optional(),
  url: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SharedContent = z.infer<typeof SharedContentSchema>;


