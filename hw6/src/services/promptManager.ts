type PromptTemplate = {
  system: string;
  user: (payload: Record<string, unknown>) => string;
};

const templates = {
  classifyContent: {
    system:
      '你是 Booboo 小幽，幫助使用者整理生活日記與靈感的小精靈。請根據輸入判斷內容類型、情緒與可執行的下一步。',
    user: (payload: Record<string, unknown>) => {
      const text = typeof payload.text === 'string' ? payload.text : '';
      return `請分析下列內容並回傳 JSON 格式，不能有其他說明文字：
        <內容>
        ${text}
        </內容>
        輸出格式為：
        <JSON>
        {"category": "...", "summary": "...", "sentiment": "positive|neutral|negative", "suggestedActions": ["...","..."]}
        </JSON>
        `;
    },
  },
  dailyInsight: {
    system:
      '你是個生活教練，會彙整使用者近期的想法，提供洞察與建議，語氣溫暖、有行動力。',
    user: (payload: Record<string, unknown>) => {
      const entries = typeof payload.entries === 'string' ? payload.entries : '';
      return `這是使用者最近的重點紀錄：\n${entries}\n請輸出一段 150 字以內的 summary，\n再列出 2-3 個 actionable steps。`;
    },
  },
};

export class PromptManager {
  static getTemplate(name: keyof typeof templates): PromptTemplate {
    const template = templates[name];
    if (!template) {
      throw new Error(`Prompt template ${name as string} not found`);
    }
    return template;
  }
}

export type PromptName = keyof typeof templates;



