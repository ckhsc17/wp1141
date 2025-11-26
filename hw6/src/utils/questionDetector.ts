/**
 * Question detection utility
 * Detects if a message is a question (query) rather than a statement to be stored
 */

const QUESTION_KEYWORDS = [
  '如何',
  '什麼',
  '哪些',
  '怎樣',
  '狀況',
  '怎麼樣',
  '有沒有',
  '是否',
  '嗎',
  '呢',
  '吧',
  '幹嘛',
  '要幹嘛',
  '要做什麼',
];

const QUESTION_PATTERNS = [
  /如何$/,
  /什麼$/,
  /哪些$/,
  /怎樣$/,
  /怎麼樣$/,
  /有沒有$/,
  /是否$/,
  /狀況如何$/,
  /情況如何$/,
  /怎麼樣$/,
];

/**
 * Detects if a text message is a question
 * @param text - The text to check
 * @returns true if the text appears to be a question
 */
export function isQuestion(text: string): boolean {
  const trimmed = text.trim();
  
  // Check for question marks
  if (trimmed.endsWith('?') || trimmed.endsWith('？')) {
    return true;
  }
  
  const lowerText = trimmed.toLowerCase();
  
  // Check for question keywords
  if (QUESTION_KEYWORDS.some((keyword) => lowerText.includes(keyword))) {
    return true;
  }
  
  // Check for question patterns
  if (QUESTION_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return true;
  }
  
  return false;
}

/**
 * Determines if a question should be classified as feedback or chat_history
 * @param text - The question text
 * @returns 'feedback' | 'chat_history' | null
 */
export function classifyQuestionIntent(text: string): 'feedback' | 'chat_history' | null {
  if (!isQuestion(text)) {
    return null;
  }
  
  const lowerText = text.toLowerCase();
  
  // Check for chat_history keywords
  if (
    lowerText.includes('對話') ||
    lowerText.includes('聊過') ||
    lowerText.includes('說過') ||
    (lowerText.includes('之前') && (lowerText.includes('聊') || lowerText.includes('說') || lowerText.includes('提到'))) ||
    lowerText.includes('過往') ||
    (lowerText.includes('有沒有') && (lowerText.includes('聊') || lowerText.includes('說'))) ||
    lowerText.includes('記得') ||
    lowerText.includes('查詢') ||
    lowerText.includes('搜尋')
  ) {
    return 'chat_history';
  }
  
  // Default to feedback for questions about life, status, suggestions
  if (
    lowerText.includes('狀況') ||
    lowerText.includes('如何') ||
    lowerText.includes('怎樣') ||
    lowerText.includes('建議') ||
    lowerText.includes('回饋') ||
    lowerText.includes('分析') ||
    lowerText.includes('評估')
  ) {
    return 'feedback';
  }
  
  return 'feedback'; // Default fallback
}


