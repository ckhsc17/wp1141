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
1. todo - 待辦事項
   - create: 新增待辦（例如：「我要吃飯、取貨、寫作業」「待辦：買菜」「我明天要開會」「提醒我買菜」「提醒我明天要開會」「今晚11:00看影片」「幫我新增待辦事項」「新增：晚上看影片」）
   - update: 更新待辦狀態（例如：「我寫完作業了！」「作業完成了」「取消吃飯」）
   - query: 查詢待辦（例如：「我上禮拜做了哪些事？」「吃了什麼？」「查看待辦」「明天要幹嘛」）
2. link - 資訊連結（分享連結）
3. insight - 靈感（文學上、生活上的頓悟和啟發）
   - 範例：「今天突然理解了一個人生道理」「這本書給我的啟發是...」「突然想到...」
4. knowledge - 知識（資訊技術、學術、常識等）
   - 範例：「React Hooks 的用法」「量子力學的基本概念」「學到一個新技巧...」
5. memory - 記憶（個人經驗、日記、與某人的對話等，不屬於靈感或知識）
   - 範例：「今天跟朋友聊到...」「記得上次去...」「今天發生了一件有趣的事...」
6. music - 音樂（儲存最近覺得好聽，想拿來練彈唱 / solo 的歌）
   - 範例：「在 solo」「陶喆 蝴蝶」「1. 館青 青少年觀察日記」「2. 方大同 love song」
   - 注意：這是「儲存」音樂內容，不是「詢問」推薦
7. life - 展覽、電影、想從事的活動（儲存想從事的活動）
   - 範例：「小巨蛋溜冰！」「左撇子女孩金馬獎」「人也太好了吧展」
   - 注意：這是「儲存」活動內容，不是「詢問」推薦
8. feedback - 回饋請求（要求生活建議或回饋）
   - 問句範例：「這禮拜的社交狀況如何」「我的時間管理如何」「我最近的生活如何」「我的狀態怎麼樣」
   - 非問句範例：「給我一些生活建議」「幫我分析時間管理」「我需要一些回饋」「分析我的生活狀況」「評估我的狀態」「給我一些回饋」
   - 關鍵字：回饋、建議、分析、評估、狀況、如何、怎樣、幫我、給我
   - 注意：這是「請求」回饋或建議，不是「儲存」內容。如果訊息詢問生活狀況、需要建議或分析，應分類為 feedback
9. recommendation - 推薦請求（要求推薦內容）
   - 問句範例：「今天可以聽什麼歌」「有什麼好聽的音樂？」「推薦一些技術文章」「有什麼展覽？」「可以推薦一些...」
   - 非問句範例：「推薦一些音樂」「推薦一些展覽」「給我一些推薦」「推薦一些技術文章」
   - 關鍵字：推薦、可以、有什麼、給我、建議（當與內容相關時）
   - 注意：這是「詢問」推薦，不是「儲存」內容。如果訊息包含「可以」「推薦」「有什麼」「建議」等詢問詞，應分類為 recommendation
10. chat_history - 對話紀錄請求（查詢過往對話）
   - 問句範例：「我有沒有跟 XXX 聊到過 XXX？」「我上禮拜說了什麼？」「之前提到的作業是什麼？」「我記得之前聊過...」「之前有沒有說過...」
   - 非問句範例：「查詢過往對話」「查看對話紀錄」「搜尋之前的對話」「找之前的紀錄」
   - 關鍵字：對話、聊過、說過、之前、過往、紀錄、記得、有沒有、查詢、搜尋
   - 注意：這是「查詢」過往對話或紀錄，不是「儲存」內容。如果訊息詢問過往對話、紀錄或之前提到的內容，應分類為 chat_history
11. other - 其他聊天

判斷規則：
- create: 訊息包含待辦事項的列舉或描述（例如：「1. 吃飯 2. 取貨」「我要買菜」「我明天要開會」「提醒我買菜」「提醒我明天要開會」「今晚11:00看影片」「幫我新增待辦事項」「新增：晚上看影片」）
- 注意：如果訊息包含「新增」「提醒我」「提醒」「幫我新增」等關鍵字，應分類為 create，即使訊息中也包含「看」字（例如：「今晚看影片」是 create，不是 query）
- update: 訊息表示完成或取消某個待辦（例如：「寫完了」「完成了」「不做了」）
- query: 訊息詢問待辦事項或已完成事項（例如：「做了什麼」「吃了什麼」「上禮拜做了哪些事」）
- insight: 訊息表達頓悟、啟發、人生道理等（例如：「突然理解」「啟發」「領悟」），注意：如果是問句（例如：「這禮拜的社交狀況如何」），不應分類為 insight
- knowledge: 訊息表達學習到的技術、學術、常識等（例如：「學到」「技術」「概念」），注意：如果是問句，不應分類為 knowledge
- memory: 訊息表達個人經驗、對話、回憶等（例如：「今天跟朋友聊到...」「記得上次去...」「今天發生了一件有趣的事...」），注意：如果是問句（例如：「這禮拜的社交狀況如何」），不應分類為 memory
- music: 訊息「儲存」歌曲、音樂、solo、彈唱等（例如：「在 solo」「陶喆 蝴蝶」），注意：如果是「詢問」推薦（例如：「可以聽什麼歌」），應分類為 recommendation
- life: 訊息「儲存」展覽、電影、活動等（例如：「小巨蛋溜冰！」），注意：如果是「詢問」推薦（例如：「有什麼展覽？」），應分類為 recommendation
- recommendation: 訊息「詢問」推薦內容（例如：「可以聽什麼歌」「推薦一些音樂」「有什麼好聽的？」「推薦一些技術文章」）
- feedback: 訊息「詢問」生活建議或回饋（例如：「給我一些建議」「幫我分析」「這禮拜的社交狀況如何」）
- chat_history: 訊息「查詢」過往對話或紀錄（例如：「我有沒有跟 XXX 聊到過 XXX？」「查詢過往對話」「之前提到的作業是什麼？」）

重要：問句識別規則
- 如果訊息包含問句關鍵字（如何、什麼、哪些、怎樣、狀況如何、怎麼樣、有沒有、是否）且詢問生活狀況、建議、回饋，應分類為 feedback
- 如果訊息包含問句關鍵字且詢問過往對話、紀錄，應分類為 chat_history
- memory、insight、knowledge、music、life 都是「儲存」意圖，不應包含問句。如果訊息是問句，不應分類為這些 intent

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "intent": "todo|link|insight|knowledge|memory|music|life|feedback|recommendation|chat_history|other",
  "subIntent": "create|update|query" (僅 todo 時需要),
  "confidence": 0.0-1.0,
  "extractedData": {
    "action": "完成|取消" (僅 update 時需要),
    "timeRange": "上禮拜|昨天|這週|這個月" (僅 query 時需要),
    "keywords": ["作業", "吃飯"] (僅 query 時需要)
  }
}
</JSON>`;
    },
  },
  analyzeLink: {
    system:
      '你是連結內容分析助手。分析連結的類型、摘要、地點等資訊，必須嚴格按照 JSON 格式輸出。請使用 Google Search 來獲取連結的實際內容和最新資訊，並參考用戶的歷史記錄來提供更準確的分析。',
    user: (payload: Record<string, unknown>) => {
      const url = typeof payload.url === 'string' ? payload.url : '';
      const content = typeof payload.content === 'string' ? payload.content : '';
      const ragContext = typeof payload.ragContext === 'string' ? payload.ragContext : undefined;
      return `請使用 Google Search 搜尋並分析以下連結的實際內容：
<連結>
${url}
</連結>
${content ? `<用戶提供的內容>\n${content}\n</用戶提供的內容>` : ''}
${ragContext ? `<用戶歷史相關記錄>\n${ragContext}\n</用戶歷史相關記錄>\n\n這些是用戶之前儲存的類似連結或內容，可以作為參考來理解用戶的偏好和分類習慣。` : ''}

重要指示：
1. 請使用 Google Search 來搜尋這個連結的實際內容、網站資訊和相關資訊
2. 參考用戶的歷史記錄（如果有的話）來理解用戶的分類習慣和偏好
3. 根據搜尋結果和歷史記錄來判斷連結的類型、內容摘要和相關標籤
4. 如果搜尋結果顯示這是餐廳、咖啡廳等美食相關，請提取地點資訊
5. 如果搜尋結果顯示這是活動、展覽等娛樂相關，請提取地點資訊
6. 根據實際內容和用戶歷史來決定最適合的分類和標籤
7. 如果用戶歷史中有類似類型的連結，可以參考其分類方式

規則：
- tags: 統一使用英文小寫（例如：food, entertainment, knowledge, life, news, tool）
- location: 僅美食/娛樂類型需要，如果無法確定可設為 null
- summary: 基於搜尋結果提供 150 字內的準確摘要

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "type": "美食|娛樂|知識|生活|新聞|工具|其他",
  "summary": "150字內的摘要（基於搜尋結果）",
  "location": "地點" (僅美食/娛樂類型需要，可為 null),
  "tags": ["food", "restaurant"] (統一使用英文小寫)
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
  extractMultipleTodos: {
    system:
      '你是待辦事項提取助手。從用戶訊息中提取所有待辦事項，支援多個待辦（例如：1. 吃飯 2. 取貨 3. 寫作業），必須嚴格按照 JSON 格式輸出。',
    user: (payload: Record<string, unknown>) => {
      const text = typeof payload.text === 'string' ? payload.text : '';
      return `請從以下訊息中提取所有待辦事項：
<訊息>
${text}
</訊息>

注意：
- 如果訊息包含多個待辦（例如：「1. 吃飯 2. 取貨 3. 寫作業」），請全部提取
- 如果只有一個待辦，也請用陣列格式輸出
- 每個待辦事項應該有明確的標題

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "todos": [
    { "title": "吃飯", "description": "" },
    { "title": "取貨", "description": "" },
    { "title": "寫作業", "description": "" }
  ]
}
</JSON>`;
    },
  },
  extractTodoDateTime: {
    system:
      '你是日期時間提取助手。從用戶訊息中提取待辦事項的日期和時間，必須嚴格按照 JSON 格式輸出，不能有其他文字。',
    user: (payload: Record<string, unknown>) => {
      const text = typeof payload.text === 'string' ? payload.text : '';
      const currentDate = typeof payload.currentDate === 'string' ? payload.currentDate : new Date().toISOString();
      const now = new Date(currentDate);
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      return `當前時間：${currentDate} (${year}-${month}-${day})

請從以下訊息中提取日期和時間：
<訊息>
${text}
</訊息>

規則：
1. **date（行程時間）**：如果訊息提到「在某個時間執行/做某事」（例如：「明天早上 8 點吃飯」「下禮拜三開會」「12/25 開會」），提取為 date
   - 如果只提到日期沒有時間，使用格式：YYYY-MM-DD（例如：2024-12-25），系統會自動設為 08:00
   - 如果提到日期和時間，使用格式：YYYY-MM-DDTHH:mm:ss（例如：2024-12-25T08:00:00）
   - 如果完全沒有提到日期時間，設為 null（系統會自動設為今天 21:00）

2. **due（截止時間）**：只有明確提到「截止」「前完成」「期限」「deadline」等關鍵字時才提取（例如：「12/25 前完成」「下週五截止」）
   - 如果只提到日期沒有時間，使用格式：YYYY-MM-DD（例如：2024-12-25），系統會自動設為 23:59:59
   - 如果提到日期和時間，使用格式：YYYY-MM-DDTHH:mm:ss（例如：2024-12-25T23:59:59）
   - 如果沒有提到截止時間，設為 null

3. 日期格式說明：
   - 純日期：YYYY-MM-DD（例如：2024-12-25）
   - 日期+時間：YYYY-MM-DDTHH:mm:ss（例如：2024-12-25T08:00:00）
   - 不要使用時區資訊（不要加 Z 或 +08:00）
   - null 值直接寫 null，不要加引號

4. 範例：
   - 「明天早上 8 點吃飯」→ {"date": "2024-12-26T08:00:00", "due": null}
   - 「下禮拜三開會」→ {"date": "2024-12-25", "due": null}（假設下禮拜三是 12/25）
   - 「12/25 前完成作業」→ {"date": null, "due": "2024-12-25"}
   - 「吃飯」→ {"date": null, "due": null}

輸出 JSON 格式（不能有其他文字，直接輸出 JSON）：
{
  "date": "2024-12-25T08:00:00" | "2024-12-25" | null,
  "due": "2024-12-25T23:59:59" | "2024-12-25" | null
}`;
    },
  },
  matchTodoForUpdate: {
    system:
      '你是待辦事項匹配助手。根據用戶的自然語言描述，匹配到最相關的待辦事項，並推斷要執行的動作（完成或取消），必須嚴格按照 JSON 格式輸出。',
    user: (payload: Record<string, unknown>) => {
      const text = typeof payload.text === 'string' ? payload.text : '';
      const todos = typeof payload.todos === 'string' ? payload.todos : '';
      return `用戶訊息：${text}

現有待辦事項：
${todos}

請：
1. 從現有待辦事項中找出最匹配的項目（使用關鍵字匹配、相似度判斷）
2. 推斷用戶要執行的動作：
   - "完成"：訊息包含「寫完」「做完」「完成了」「完成了」「完成」等
   - "取消"：訊息包含「不做了」「取消」「不做」等

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "matchedTodoId": "todo-id" (如果找到匹配的待辦),
  "action": "完成|取消",
  "confidence": 0.0-1.0 (匹配信心度)
}
</JSON>

如果找不到匹配的待辦，matchedTodoId 設為 null。`;
    },
  },
  parseTodoQuery: {
    system:
      '你是待辦事項查詢解析助手。解析用戶的自然語言查詢，提取時間範圍、特定日期、關鍵字、狀態等過濾條件，必須嚴格按照 JSON 格式輸出。',
    user: (payload: Record<string, unknown>) => {
      const text = typeof payload.text === 'string' ? payload.text : '';
      const currentDate = typeof payload.currentDate === 'string' ? payload.currentDate : new Date().toISOString();
      const now = new Date(currentDate);
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      return `當前時間：${currentDate} (${year}-${month}-${day})

用戶查詢：${text}

請解析：
1. **特定日期**：如果查詢提到特定日期（例如：「12/25 的待辦」「2024-12-25 要做什麼」「聖誕節的待辦」），提取為 specificDate
   - 格式：YYYY-MM-DD（例如：2024-12-25）
   - 如果沒有特定日期，設為 null
   - 注意：「明天要幹嘛」「明天要做什麼」這類查詢應該提取 timeRange 為 "明天"，而不是 specificDate

2. **時間範圍**（如果沒有特定日期才使用）：
   - 過去：上禮拜、昨天、這週、這個月、上個月
   - 未來：下禮拜、明天、下週、下個月
   - 現在：今天、本週、本月
   - 重要：如果查詢包含「明天」「下禮拜」「下週」「下個月」等未來時間詞，必須提取為 timeRange

3. **關鍵字**：從查詢中提取的關鍵字（例如：「要幹嘛」「要做什麼」「吃了什麼」「做了哪些事」「作業」等）
   - 如果查詢是「明天要幹嘛」「明天要做什麼」，關鍵字可以是空陣列或包含「要幹嘛」「要做什麼」

4. **狀態**：完成的、待辦的、已取消的（如果沒有明確指定，設為 null）
   - 注意：如果查詢未來時間（下禮拜、明天等），預設狀態應為 "pending"（待辦的）
   - 如果查詢過去時間（上禮拜、昨天等），狀態可以是 "done"（已完成的）或 null（所有狀態）

範例：
- 「明天要幹嘛」→ {"specificDate": null, "timeRange": "明天", "keywords": [], "status": "pending"}
- 「明天要做什麼」→ {"specificDate": null, "timeRange": "明天", "keywords": [], "status": "pending"}
- 「我上禮拜做了哪些事？」→ {"specificDate": null, "timeRange": "上禮拜", "keywords": ["做了哪些事"], "status": null}
- 「12/25 的待辦」→ {"specificDate": "2024-12-25", "timeRange": null, "keywords": [], "status": "pending"}

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "specificDate": "2024-12-25" | null (特定日期，格式：YYYY-MM-DD),
  "timeRange": "上禮拜|昨天|這週|這個月|上個月|下禮拜|明天|下週|下個月|今天|本週|本月|null" (如果 specificDate 為 null 才使用),
  "keywords": ["作業", "吃飯"] (從查詢中提取的關鍵字，可以是空陣列),
  "status": "done|pending|cancelled|null" (如果查詢明確提到狀態，或未來時間預設為 pending)
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

請提供一段溫暖的生活回饋和建議（500-800字），包含：
1. 對用戶生活的觀察
2. 具體的建議或行動方向
3. 鼓勵的話語

請詳細說明，不要過於簡短。`;
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

請根據以上資訊提供 2-3 個相關推薦，每個推薦包含標題和詳細說明（100-200字）。請詳細說明推薦的理由和內容。`;
    },
  },
  analyzeInsight: {
    system:
      '你是靈感內容分析助手。分析用戶分享的靈感內容，提取摘要和標籤，必須嚴格按照 JSON 格式輸出，不能有其他文字。',
    user: (payload: Record<string, unknown>) => {
      const text = typeof payload.text === 'string' ? payload.text : '';
      return `請分析以下靈感內容：
<內容>
${text}
</內容>

規則：
- summary: 150 字內的摘要，捕捉靈感的核心
- tags: 必須包含 "insight"，可選 "literature", "life", "philosophy", "inspiration" 等（統一使用英文小寫）

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "summary": "摘要（150字內）",
  "tags": ["insight", "literature", "life"]
}
</JSON>`;
    },
  },
  analyzeKnowledge: {
    system:
      '你是知識內容分析助手。分析用戶分享的知識內容，提取摘要和標籤，必須嚴格按照 JSON 格式輸出，不能有其他文字。',
    user: (payload: Record<string, unknown>) => {
      const text = typeof payload.text === 'string' ? payload.text : '';
      return `請分析以下知識內容：
<內容>
${text}
</內容>

規則：
- summary: 150 字內的摘要，捕捉知識的核心
- tags: 必須包含 "knowledge"，可選 "technology", "academic", "common-sense", "info" 等（統一使用英文小寫）

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "summary": "摘要（150字內）",
  "tags": ["knowledge", "technology", "react"]
}
</JSON>`;
    },
  },
  analyzeMemory: {
    system:
      '你是記憶內容分析助手。分析用戶分享的記憶內容，提取摘要和標籤，必須嚴格按照 JSON 格式輸出，不能有其他文字。',
    user: (payload: Record<string, unknown>) => {
      const text = typeof payload.text === 'string' ? payload.text : '';
      return `請分析以下記憶內容：
<內容>
${text}
</內容>

規則：
- summary: 150 字內的摘要，捕捉記憶的核心
- tags: 必須包含 "memory"，可選 "diary", "conversation", "experience", "recollection" 等（統一使用英文小寫）

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "summary": "摘要（150字內）",
  "tags": ["memory", "conversation", "friend"]
}
</JSON>`;
    },
  },
  analyzeChat: {
    system:
      '你是對話內容分析助手。分析用戶的對話內容，提取摘要和標籤，必須嚴格按照 JSON 格式輸出，不能有其他文字。',
    user: (payload: Record<string, unknown>) => {
      const text = typeof payload.text === 'string' ? payload.text : '';
      return `請分析以下對話內容：
<內容>
${text}
</內容>

規則：
- summary: 150 字內的摘要，捕捉對話的核心
- tags: 必須包含 "chat"，可選 "conversation", "question", "general" 等（統一使用英文小寫）

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "summary": "摘要（150字內）",
  "tags": ["chat", "conversation"]
}
</JSON>`;
    },
  },
  analyzeMusic: {
    system:
      '你是音樂內容分析助手。分析用戶分享的音樂內容，提取歌曲資訊和標籤，必須嚴格按照 JSON 格式輸出，不能有其他文字。',
    user: (payload: Record<string, unknown>) => {
      const text = typeof payload.text === 'string' ? payload.text : '';
      return `請分析以下音樂內容：
<內容>
${text}
</內容>

規則：
- summary: 150 字內的摘要，包含歌曲名稱、歌手等資訊
- tags: 必須包含 "music"，可選 "solo", "cover", "practice" 等（統一使用英文小寫）

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "summary": "摘要（150字內，包含歌曲名稱、歌手）",
  "tags": ["music", "solo", "artist-name"]
}
</JSON>`;
    },
  },
  analyzeLife: {
    system:
      '你是生活活動內容分析助手。分析用戶分享的展覽、電影、活動等內容，提取摘要和標籤，必須嚴格按照 JSON 格式輸出，不能有其他文字。',
    user: (payload: Record<string, unknown>) => {
      const text = typeof payload.text === 'string' ? payload.text : '';
      return `請分析以下生活活動內容：
<內容>
${text}
</內容>

規則：
- summary: 150 字內的摘要，包含活動名稱、類型等資訊
- tags: 必須包含 "life"，可選 "exhibition", "movie", "activity", "event" 等（統一使用英文小寫）

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "summary": "摘要（150字內，包含活動名稱、類型）",
  "tags": ["life", "exhibition", "art"]
}
</JSON>`;
    },
  },
  extractRecommendationTags: {
    system:
      '你是推薦標籤提取助手。從用戶的推薦查詢中提取相關標籤和關鍵字，必須嚴格按照 JSON 格式輸出，不能有其他文字。',
    user: (payload: Record<string, unknown>) => {
      const query = typeof payload.query === 'string' ? payload.query : '';
      return `請從以下推薦查詢中提取相關標籤和關鍵字：
<查詢>
${query}
</查詢>

規則：
- 提取 3-5 個最相關的 tags（統一使用英文小寫）
- tags 應該是具體的主題或領域（例如：technology, music, life, knowledge）
- 如果查詢提到具體的歌曲、歌手、電影、展覽等名稱，提取為 tags（例如：如果查詢「盛夏光年」，提取 ["music", "mayday", "summer-light-year"]）
- 如果查詢不明確，返回通用 tags（例如：["recommendation"]）

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "tags": ["music", "mayday", "summer-light-year"]
}
</JSON>`;
    },
  },
  extractFeedbackTags: {
    system:
      '你是回饋標籤提取助手。從用戶的回饋查詢中提取相關標籤（生活、時間管理等），必須嚴格按照 JSON 格式輸出，不能有其他文字。',
    user: (payload: Record<string, unknown>) => {
      const query = typeof payload.query === 'string' ? payload.query : '';
      return `請從以下回饋查詢中提取相關標籤：
<查詢>
${query}
</查詢>

規則：
- 識別回饋的主題領域（life, time-management, work, study, health 等）
- 提取 2-4 個相關 tags（統一使用英文小寫）
- 如果查詢不明確，返回 ["life"] 作為預設

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "tags": ["life", "time-management", "work"]
}
</JSON>`;
    },
  },
  extractSearchKeywords: {
    system:
      '你是搜尋關鍵字提取助手。從用戶的對話紀錄查詢中產生 3 個模糊搜尋關鍵字，必須嚴格按照 JSON 格式輸出，不能有其他文字。',
    user: (payload: Record<string, unknown>) => {
      const query = typeof payload.query === 'string' ? payload.query : '';
      return `請從以下查詢中提取 3 個搜尋關鍵字：
<查詢>
${query}
</查詢>

規則：
- 提取 3 個最具代表性的關鍵字
- 關鍵字應該是名詞、動詞或重要概念
- 排除停用詞（的、了、是、在等）
- 關鍵字使用中文或英文（保持原樣）

輸出 JSON 格式（不能有其他文字）：
<JSON>
{
  "keywords": ["作業", "上禮拜", "完成"]
}
</JSON>`;
    },
  },
  generateRecommendationWithRAG: {
    system:
      '你是推薦生成助手。基於用戶的查詢和相關內容，生成具體、可執行的推薦，語氣溫暖、有行動力。',
    user: (payload: Record<string, unknown>) => {
      const query = typeof payload.query === 'string' ? payload.query : '';
      const items = typeof payload.items === 'string' ? payload.items : '';
      return `用戶查詢：${query}

相關內容：
${items || '（暫無相關內容）'}

請基於以上內容，提供具體、可執行的推薦。語氣溫暖、有行動力，直接回答用戶的問題。

請提供詳細的推薦（每個推薦 100-200字），包含推薦的理由、內容和如何執行。不要過於簡短。

重要：請不要使用任何 markdown 語法（例如 **粗體**、*斜體* 等），直接使用純文字回覆。`;
    },
  },
  generateFeedbackWithRAG: {
    system:
      '你是生活回饋生成助手。基於用戶的查詢和相關內容，分析用戶的生活模式，提供建設性建議，語氣溫暖、支持性。',
    user: (payload: Record<string, unknown>) => {
      const query = typeof payload.query === 'string' ? payload.query : '';
      const items = typeof payload.items === 'string' ? payload.items : '';
      return `用戶查詢：${query}

相關內容：
${items || '（暫無相關內容）'}

請基於以上內容，分析用戶的生活模式，提供建設性建議。語氣溫暖、支持性，直接回答用戶的問題。

請提供詳細的回饋（500-1000字），包含具體的觀察、建議和鼓勵。不要過於簡短。

重要：請不要使用任何 markdown 語法（例如 **粗體**、*斜體* 等），直接使用純文字回覆。`;
    },
  },
  answerChatHistoryWithRAG: {
    system:
      '你是對話紀錄回答助手。基於用戶的查詢和相關內容，直接回答用戶的問題，引用相關內容。',
    user: (payload: Record<string, unknown>) => {
      const query = typeof payload.query === 'string' ? payload.query : '';
      const items = typeof payload.items === 'string' ? payload.items : '';
      return `用戶查詢：${query}

相關內容：
${items || '（暫無相關內容）'}

請基於以上內容，直接回答用戶的問題。如果找到相關內容，請詳細引用並說明；如果找不到，請誠實告知。

請提供完整的回答，不要過於簡短。

重要：請不要使用任何 markdown 語法（例如 **粗體**、*斜體* 等），直接使用純文字回覆。`;
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

請用 Booboo 小幽的語氣回覆，保持溫暖、親切、自然。

重要：請不要使用任何 markdown 語法（例如 **粗體**、*斜體* 等），直接使用純文字回覆。`;
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



