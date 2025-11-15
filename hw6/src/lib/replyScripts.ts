import type { SupportedLocale } from './locale';

export type SectionId =
  | 'welcome'
  | 'courseContent'
  | 'assignments'
  | 'finalProject'
  | 'grading'
  | 'requirements'
  | 'schedule'
  | 'classInfo'
  | 'instructor';

export type LocalizedSection = {
  title: string;
  body: string[];
};

type SectionTexts = Record<SectionId, Record<SupportedLocale, LocalizedSection>>;

// 課程各段文字內容，以陣列儲存方便後續組合訊息。
export const sectionTexts: SectionTexts = {
  welcome: {
    'zh-TW': {
      title: '嗨！我是 Web Programming 課程諮詢助教',
      body: [
        '想了解課程內容、作業、評分或期末專題嗎？直接點選下方快速回覆或輸入關鍵字。也可以輸入「語言」在繁中與英文間切換。',
      ],
    },
    'en-US': {
      title: 'Hi! I am your Web Programming course assistant',
      body: [
        'Ask me about the syllabus, homework, grading, or the final project. Use the quick replies below or type keywords. Send “language” to switch between Traditional Chinese and English.',
      ],
    },
  },
  courseContent: {
    'zh-TW': {
      title: '課程內容架構',
      body: [
        '0️⃣ 基礎概念：網路服務原理、開發流程、常用語言與框架概覽。',
        '1️⃣ 前端開發：React + TypeScript、SPA、UI 框架、部署流程，包含多個實作練習。',
        '2️⃣ 全端開發：Serverless、API、資料庫、驗證、Next.js、即時溝通與聊天機器人。',
        '3️⃣ 從專案到產品：專案管理、使用者行為追蹤、資料視覺化、爬蟲與 agentic flow。',
        '課程強調結合 AI coding 工具，以 top-down 方式在實作中學習。',
      ],
    },
    'en-US': {
      title: 'Course Modules Overview',
      body: [
        '0️⃣ Foundations: Internet fundamentals, development lifecycle, languages, and framework landscape.',
        '1️⃣ Front-End: React + TypeScript, SPA concepts, UI frameworks, deployment, and multiple hands-on practices.',
        '2️⃣ Full Stack: Serverless, APIs, databases, authentication, Next.js, real-time chat, and chatbot design.',
        '3️⃣ From Project to Product: Project management, analytics, dashboards, web crawling, and agentic flows.',
        'You will learn with a top-down mindset, heavily leveraging AI coding assistants.',
      ],
    },
  },
  assignments: {
    'zh-TW': {
      title: '作業制度',
      body: [
        '共有 7 次個人作業，每兩週繳交一次；題目從個人首頁、遊戲、課程排課工具到 AI chatbot 與儀表板。',
        '作業需 push 到 GitHub（wp1141/hw*），並進行 3 人互評；評分等級為 0/1/3/5/6，系統會取較高的兩份。',
        '缺交或逾期視同 0 分，不提供補交。旁聽同學不參與互評流程。',
      ],
    },
    'en-US': {
      title: 'Homework Policy',
      body: [
        'Seven individual assignments are due every two weeks, covering topics from personal homepage, mini games, course planner, AI chatbot, to analytics dashboard.',
        'Submit to GitHub (wp1141/hw*) and review 3 peers. Scores use the 0/1/3/5/6 scale; the lowest peer score is dropped.',
        'Late submissions are not accepted. Auditors do not participate in the review process.',
      ],
    },
  },
  finalProject: {
    'zh-TW': {
      title: '期末專題重點',
      body: [
        '2~3 人組隊，可與外部夥伴合作但需標註貢獻。需確保真實使用者與公開部署。',
        '時程：10/12 提出點子、10/28 分組完成、11/18 上線原型、12/02 期中互評、12/23 最終繳交。',
        '繳交內容包含 README、部署服務、6 分鐘簡報影片與社團貼文。逾期不予受理。',
      ],
    },
    'en-US': {
      title: 'Final Project Highlights',
      body: [
        'Form teams of 2-3 enrolled students. External collaborators are allowed but their contributions must be documented.',
        'Deliverables must target real users and be deployed to a public service.',
        'Timeline: 10/12 idea proposal, 10/28 team-up, 11/18 prototype online, 12/02 midterm review, 12/23 final submission.',
        'Final submission includes README, live service, 6-minute demo video, and a Facebook post. Late submissions are not accepted.',
      ],
    },
  },
  grading: {
    'zh-TW': {
      title: '評分方式（暫訂）',
      body: [
        '作業 50%：互評成績 40% + 審閱表現 10%。缺交互評會扣分。',
        '期末專題 50%：提案 2%、原型 3%、期中互評 5%，期末成果 40% 由師長與助教評分。',
        '可能依全班表現進行線性調整，最新資訊以課程公告為準。',
      ],
    },
    'en-US': {
      title: 'Grading (Tentative)',
      body: [
        'Homework 50%: 40% from peer-reviewed scores + 10% from your reviewing performance. Missing reviews will be penalized.',
        'Final Project 50%: Idea proposal 2%, prototype check 3%, midterm review 5%, final evaluation 40% by instructor/TAs.',
        'Grades may be linearly adjusted based on overall class performance. Follow official announcements for updates.',
      ],
    },
  },
  requirements: {
    'zh-TW': {
      title: '修課建議與要求',
      body: [
        '課程進度快，建議具備程式基礎並熟悉自學。需要大量運用 AI coding 工具與 top-down 的學習方式。',
        '每兩週一次作業，需投入充足時間。停修期限為 10/26，逾期不受理。',
        '請盡快完成 HW#0：建立 GitHub、安裝類 Unix 系統、熟悉 Git、確認 Cursor Pro 資訊並完成指定表單。',
      ],
    },
    'en-US': {
      title: 'Course Expectations',
      body: [
        'Fast-paced with significant self-learning. Prior programming experience is recommended. AI coding tools are essential for a top-down learning approach.',
        'Homework arrives every two weeks—plan your schedule carefully. Withdrawal deadline is 10/26 with no exceptions afterward.',
        'Complete HW#0 ASAP: GitHub setup, Unix-like OS, Git basics, Cursor Pro info, and the required Google Form.',
      ],
    },
  },
  schedule: {
    'zh-TW': {
      title: '學期時程概覽',
      body: [
        '09 月：課程導論、React/TypeScript、前端 SPA 實作。',
        '10 月：Serverless、第三方服務、Node.js、REST API、資料庫與 Next.js。',
        '11 月：即時溝通、聊天機器人、微服務與部署、期末專題原型。',
        '12 月：分析視覺化、爬蟲、Agentic flow、創業實務，並進行專題期中與期末檢核。',
      ],
    },
    'en-US': {
      title: 'Weekly Roadmap',
      body: [
        'September: Course intro, React/TypeScript foundations, SPA development.',
        'October: Serverless cron jobs, third-party APIs, Node.js backend, REST APIs, databases, and Next.js.',
        'November: Real-time messaging, chatbot design, microservices, deployment, and project prototyping.',
        'December: Analytics dashboards, web/data crawling, agentic flows, startup insights, plus project reviews.',
      ],
    },
  },
  classInfo: {
    'zh-TW': {
      title: '上課資訊與聯絡方式',
      body: [
        '授課教師：黃鐘揚教授（NTUEE/GIEE），無固定 office hour，有問題請以 email 聯繫 eewebprogramming@googlegroups.com。',
        '聯絡守則：使用明確標題，開頭附上姓名/年級/系所，檔案超過 1MB 請改附雲端連結。未依指示可能不回覆。',
        '上課形式：因選課人數多，採實體 (BL113) + 直播 (BL112) 並行，課後預計提供錄影回放（視技術情況而定）。',
      ],
    },
    'en-US': {
      title: 'Class Logistics & Contact',
      body: [
        'Instructor: Prof. Chung-Yang (Ric) Huang, NTUEE/GIEE. No fixed office hours—email eewebprogramming@googlegroups.com for inquiries.',
        'Email etiquette: clear subject, start with your full name/grade/department, include all relevant materials (use cloud links for files >1MB).',
        'Format: On-site class in BL113 with live streaming to BL112; recordings will be provided when technical conditions allow.',
      ],
    },
  },
  instructor: {
    'zh-TW': {
      title: '關於授課教師',
      body: [
        '黃鐘揚教授：台大電機系/電子所教授、優拓資訊創辦人、台灣數據智慧發展協會理事，曾任晶睿通訊與迪樂科技獨立董事。',
        '過去曾擔任台大創創中心與創創學程副主任，亦為 Verplex/Cadence 的前資深研發主管，長期投入創新服務與軟體技術推廣。',
        '若欲聯繫，請於社群媒體留下自我介紹後再發訊息，否則可能不會回覆。',
      ],
    },
    'en-US': {
      title: 'About Prof. Ric Huang',
      body: [
        'Prof. Huang is a faculty member at NTUEE/GIEE, founder of YOCTOL, director of the Taiwan Data Intelligence Association, and former independent director at Vivotek and D’Fine Tech.',
        'He previously served as Associate Director at NTU Garage and the Innovation Program, and was a Senior RD Manager at Verplex/Cadence.',
        'For social media contact, please send a self-introduction before requesting to connect.',
      ],
    },
  },
};

export type QuickReplyOption = {
  label: string;
  section: SectionId;
};

export const quickReplyOptions: Record<SupportedLocale, QuickReplyOption[]> = {
  'zh-TW': [
    { label: '課程導覽', section: 'welcome' },
    { label: '課程內容', section: 'courseContent' },
    { label: '作業說明', section: 'assignments' },
    { label: '期末專題', section: 'finalProject' },
    { label: '評分方式', section: 'grading' },
    { label: '修課要求', section: 'requirements' },
    { label: '更多資訊', section: 'schedule' },
    { label: '切換語言', section: 'welcome' },
  ],
  'en-US': [
    { label: 'Course Guide', section: 'welcome' },
    { label: 'Modules', section: 'courseContent' },
    { label: 'Homework', section: 'assignments' },
    { label: 'Final Project', section: 'finalProject' },
    { label: 'Grading', section: 'grading' },
    { label: 'Expectations', section: 'requirements' },
    { label: 'More info', section: 'schedule' },
    { label: 'Language', section: 'welcome' },
  ],
};

export type MenuActionId =
  | 'courseContent'
  | 'assignments'
  | 'finalProject'
  | 'grading'
  | 'requirements'
  | 'schedule'
  | 'classInfo'
  | 'instructor';

export type ButtonTemplate = {
  title: string;
  text: string;
  actions: {
    label: string;
    section: SectionId;
  }[];
};

export const mainMenuTemplate: Record<SupportedLocale, ButtonTemplate> = {
  'zh-TW': {
    title: 'Web Programming 課程導覽',
    text: '快速了解課程重點',
    actions: [
      { label: '課程內容', section: 'courseContent' },
      { label: '作業制度', section: 'assignments' },
      { label: '評分方式', section: 'grading' },
    ],
  },
  'en-US': {
    title: 'Web Programming Guide',
    text: 'Catch the key highlights',
    actions: [
      { label: 'Modules', section: 'courseContent' },
      { label: 'Homework', section: 'assignments' },
      { label: 'Grading', section: 'grading' },
    ],
  },
};

export type CarouselColumn = {
  title: string;
  text: string;
  actions: {
    label: string;
    section: SectionId;
  }[];
};

export const deepDiveCarousel: Record<SupportedLocale, CarouselColumn[]> = {
  'zh-TW': [
    {
      title: '期末專題',
      text: '時間表與規定',
      actions: [
        { label: '查看重點', section: 'finalProject' },
        { label: '課程安排', section: 'schedule' },
      ],
    },
    {
      title: '修課與資源',
      text: '要求與支援',
      actions: [
        { label: '修課要求', section: 'requirements' },
        { label: '聯絡資訊', section: 'classInfo' },
      ],
    },
    {
      title: '認識老師',
      text: '黃鐘揚教授',
      actions: [
        { label: '授課介紹', section: 'instructor' },
        { label: '課程宗旨', section: 'welcome' },
      ],
    },
  ],
  'en-US': [
    {
      title: 'Final Project',
      text: 'Timeline & rules',
      actions: [
        { label: 'View details', section: 'finalProject' },
        { label: 'Weekly plan', section: 'schedule' },
      ],
    },
    {
      title: 'Stay on Track',
      text: 'Requirements & support',
      actions: [
        { label: 'Expectations', section: 'requirements' },
        { label: 'Contact info', section: 'classInfo' },
      ],
    },
    {
      title: 'Meet Prof. Ric',
      text: 'Background & vision',
      actions: [
        { label: 'Instructor bio', section: 'instructor' },
        { label: 'Course vision', section: 'welcome' },
      ],
    },
  ],
};

export function getSectionContent(locale: SupportedLocale, section: SectionId): LocalizedSection {
  return sectionTexts[section][locale];
}

export function getQuickReplies(locale: SupportedLocale): QuickReplyOption[] {
  return quickReplyOptions[locale];
}

export function getMainMenu(locale: SupportedLocale): ButtonTemplate {
  return mainMenuTemplate[locale];
}

export function getCarousel(locale: SupportedLocale): CarouselColumn[] {
  return deepDiveCarousel[locale];
}

