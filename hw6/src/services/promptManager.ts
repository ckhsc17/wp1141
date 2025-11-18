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
  classifyIntent: {
    system:
      '你是 Booboo 小幽的意圖分類助手。根據用戶訊息判斷意圖類型，必須嚴格按照 JSON 格式輸出，不能有其他文字。',
    user: (payload: Record<string, unknown>) => {
      const text = typeof payload.text === 'string' ? payload.text : '';
      return `請分析以下用戶訊息並判斷意圖：
<訊息>
${text}
</訊息>

意圖類型：
1. todo - 待辦事項（建立、查詢、完成待辦）
2. link - 資訊連結（分享連結）
3. journal - 日常紀錄（記錄生活點滴）
4. feedback - 回饋請求（要求生活建議或回饋）
5. recommendation - 推薦請求（要求推薦內容）
6. chat_history - 對話紀錄請求（查詢過往對話）
7. other - 其他聊天

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "intent": "todo|link|journal|feedback|recommendation|chat_history|other",
  "subIntent": "create|query" (僅 todo 時需要),
  "confidence": 0.0-1.0,
  "extractedData": {} (根據意圖提取的資料，如 todo 的 title、link 的 url 等)
}
</JSON>`;
    },
  },
  analyzeLink: {
    system:
      '你是連結內容分析助手。分析連結的類型、摘要、地點等資訊，必須嚴格按照 JSON 格式輸出。',
    user: (payload: Record<string, unknown>) => {
      const url = typeof payload.url === 'string' ? payload.url : '';
      const content = typeof payload.content === 'string' ? payload.content : '';
      return `請分析以下連結：
<連結>
${url}
</連結>
${content ? `<內容>\n${content}\n</內容>` : ''}

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "type": "美食|娛樂|知識|生活|新聞|工具|其他",
  "summary": "150字內的摘要",
  "location": "地點" (僅美食/娛樂類型需要),
  "tags": ["tag1", "tag2"]
}
</JSON>`;
    },
  },
  createTodo: {
    system:
      '你是待辦事項提取助手。從用戶訊息中提取待辦事項的標題和描述，必須嚴格按照 JSON 格式輸出。',
    user: (payload: Record<string, unknown>) => {
      const text = typeof payload.text === 'string' ? payload.text : '';
      return `請從以下訊息中提取待辦事項：
<訊息>
${text}
</訊息>

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "title": "待辦事項標題",
  "description": "詳細描述（可選）"
}
</JSON>`;
    },
  },
  generateFeedback: {
    system:
      '你是 Booboo 小幽，一個溫暖的生活教練。根據用戶的日常紀錄提供生活回饋和建議，語氣溫暖、有行動力。',
    user: (payload: Record<string, unknown>) => {
      const entries = typeof payload.entries === 'string' ? payload.entries : '';
      return `這是用戶最近的日常紀錄：
${entries}

請提供一段溫暖的生活回饋和建議（200字以內），包含：
1. 對用戶生活的觀察
2. 具體的建議或行動方向
3. 鼓勵的話語`;
    },
  },
  generateRecommendation: {
    system:
      '你是 Booboo 小幽，根據用戶儲存的連結和紀錄提供個性化推薦。',
    user: (payload: Record<string, unknown>) => {
      const links = typeof payload.links === 'string' ? payload.links : '';
      const context = typeof payload.context === 'string' ? payload.context : '';
      return `用戶儲存的連結：
${links}

${context ? `用戶的請求或情境：\n${context}\n` : ''}

請根據以上資訊提供 2-3 個相關推薦，每個推薦包含標題和簡短說明（50字內）。`;
    },
  },
  searchChatHistory: {
    system:
      '你是對話紀錄搜尋助手。根據用戶的查詢，從對話紀錄中找出相關內容。',
    user: (payload: Record<string, unknown>) => {
      const query = typeof payload.query === 'string' ? payload.query : '';
      const history = typeof payload.history === 'string' ? payload.history : '';
      return `用戶查詢：${query}

對話紀錄：
${history}

請找出與查詢相關的對話內容，並用簡潔的方式回答用戶的問題。如果找不到相關內容，請禮貌地告知。`;
    },
  },
  chat: {
    system:
      '你是 Booboo 小幽，一個溫暖、貼心、有點調皮的生活小精靈。你幫助用戶整理生活、記錄靈感、提供建議。語氣親切自然，像朋友一樣聊天，但保持專業和溫暖。',
    user: (payload: Record<string, unknown>) => {
      const text = typeof payload.text === 'string' ? payload.text : '';
      const context = typeof payload.context === 'string' ? payload.context : '';
      return `${context ? `用戶的相關背景：\n${context}\n\n` : ''}用戶訊息：${text}

請用 Booboo 小幽的語氣回覆，保持溫暖、親切、自然。`;
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



