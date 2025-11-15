import type { SectionId } from './replyScripts';

const normalizedKeywords: Record<SectionId, string[]> = {
  welcome: ['hi', 'hello', 'hey', 'help', '開始', '你好', '嗨', '助教'],
  courseContent: ['course', 'content', 'module', 'modules', 'syllabus', '課程', '內容', '單元'],
  assignments: ['assignment', 'assignments', 'homework', 'hw', '作業', '功課'],
  finalProject: ['final', 'project', '期末', '專題'],
  grading: ['grade', 'grading', 'score', '評分', '成績'],
  requirements: ['requirement', 'requirements', 'expectation', 'expectations', '修課', '要求', '準備'],
  schedule: ['schedule', 'timeline', '行程', '時程', '週次', '更多資訊', '更多內容', 'more info'],
  classInfo: ['class', 'info', 'contact', '聯絡', '上課', '資訊', 'email'],
  instructor: ['instructor', 'teacher', 'prof', 'ric', '老師', '教授'],
};

function normalizeText(text: string): string {
  return text.trim().toLowerCase();
}

export function matchSectionFromText(text: string | undefined): SectionId | undefined {
  if (!text) {
    return undefined;
  }

  const normalized = normalizeText(text);

  return (Object.keys(normalizedKeywords) as SectionId[]).find((section) =>
    normalizedKeywords[section].some((keyword) => normalized.includes(keyword)),
  );
}

