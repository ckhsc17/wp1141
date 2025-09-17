interface Note {
  id: string;
  time: number; // 相對時間 (秒)
  duration: number;
  hit?: boolean;
  missed?: boolean;
}

interface RhythmPattern {
  abc: string;
  noteList: Note[];
}

// 基本節奏模式
const RHYTHM_PATTERNS = [
  // 簡單的四分音符模式
  {
    notes: ['C', 'D', 'E', 'F'],
    durations: [1, 1, 1, 1], // 四分音符
    pattern: 'simple_quarter'
  },
  // 混合節奏
  {
    notes: ['C', 'C', 'D', 'E', 'E', 'F'],
    durations: [0.5, 0.5, 1, 0.5, 0.5, 1], // 八分音符和四分音符混合
    pattern: 'mixed_rhythm'
  },
  // 快速節奏
  {
    notes: ['C', 'D', 'C', 'E', 'D', 'F', 'E', 'G'],
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], // 全八分音符
    pattern: 'eighth_notes'
  },
  // 附點節奏
  {
    notes: ['C', 'D', 'E', 'F', 'G'],
    durations: [1.5, 0.5, 1, 1, 1], // 附點四分音符模式
    pattern: 'dotted_rhythm'
  },
  // 三連音模式
  {
    notes: ['C', 'D', 'E', 'C', 'D', 'E'],
    durations: [0.67, 0.67, 0.66, 0.67, 0.67, 0.66], // 三連音
    pattern: 'triplets'
  }
];

// 音符到 ABC 記譜法的映射
const NOTE_TO_ABC: { [key: string]: string } = {
  'C': 'C',
  'D': 'D', 
  'E': 'E',
  'F': 'F',
  'G': 'G',
  'A': 'A',
  'B': 'B',
};

// 時長到 ABC 記譜法的映射
const DURATION_TO_ABC: { [key: number]: string } = {
  0.25: '/4',  // 十六分音符
  0.5: '/2',   // 八分音符
  0.66: '/3',  // 三連音
  0.67: '/3',  // 三連音
  1: '',       // 四分音符 (默認)
  1.5: '3/2',  // 附點四分音符
  2: '2',      // 二分音符
  4: '4',      // 全音符
};

// 生成隨機節奏
export function generateRandomRhythm(measures: number = 1, bpm: number = 100): RhythmPattern {
  // 限制小節數在 1-8 之間
  const numMeasures = Math.max(1, Math.min(8, measures));
  
  // 隨機選擇一個節奏模式
  const basePattern = RHYTHM_PATTERNS[Math.floor(Math.random() * RHYTHM_PATTERNS.length)];
  
  // 根據小節數重複或擴展模式
  let notes: string[] = [];
  let durations: number[] = [];
  
  for (let measure = 0; measure < numMeasures; measure++) {
    // 每個小節可能使用不同的模式或相同模式的變化
    const shouldVaryPattern = Math.random() > 0.3;
    const currentPattern = shouldVaryPattern ? 
      RHYTHM_PATTERNS[Math.floor(Math.random() * RHYTHM_PATTERNS.length)] : 
      basePattern;
    
    notes = notes.concat(currentPattern.notes);
    durations = durations.concat(currentPattern.durations);
  }
  
  // 隨機調整音符
  const availableNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const shouldRandomizeNotes = Math.random() > 0.5;
  
  if (shouldRandomizeNotes) {
    notes = notes.map(() => 
      availableNotes[Math.floor(Math.random() * availableNotes.length)]
    );
  }

  // 生成 ABC 記譜法字符串
  let abc = 'X:1\n';
  abc += 'M:4/4\n';
  abc += 'L:1/4\n';
  abc += 'K:C\n';

  // 構建音符序列，每4拍一個小節
  const abcNotes: string[] = [];
  let currentMeasureDuration = 0;
  
  durations.forEach((duration, index) => {
    const note = notes[index];
    const durationSuffix = DURATION_TO_ABC[duration] || '';
    abcNotes.push(NOTE_TO_ABC[note] + durationSuffix);
    
    currentMeasureDuration += duration;
    // 每當累積到約4拍時，添加小節線
    if (currentMeasureDuration >= 4) {
      abcNotes.push('|');
      currentMeasureDuration = 0;
    }
  });
  
  // 結束符號
  if (abcNotes[abcNotes.length - 1] !== '|') {
    abcNotes.push('||');
  } else {
    abcNotes[abcNotes.length - 1] = '||';
  }

  abc += abcNotes.join(' ') + '\n';

  // 生成音符列表（用於遊戲邏輯）
  const noteList: Note[] = [];
  const beatDuration = 60 / bpm; // 根據 BPM 計算每拍時間
  // 音符時間從 0 開始，預備拍在遊戲時間中處理
  let currentTime = 0; // 音符從時間 0 開始
  
  durations.forEach((duration, index) => {
    noteList.push({
      id: `note-${index}`,
      time: currentTime,
      duration: duration,
    });
    currentTime += duration * beatDuration;
  });

  return {
    abc,
    noteList
  };
}

// 根據難度生成節奏
export function generateRhythmByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): RhythmPattern {
  let selectedPatterns: typeof RHYTHM_PATTERNS;
  
  switch (difficulty) {
    case 'easy':
      selectedPatterns = RHYTHM_PATTERNS.filter(p => 
        p.pattern === 'simple_quarter' || p.pattern === 'mixed_rhythm'
      );
      break;
    case 'medium':
      selectedPatterns = RHYTHM_PATTERNS.filter(p => 
        p.pattern === 'mixed_rhythm' || p.pattern === 'eighth_notes' || p.pattern === 'dotted_rhythm'
      );
      break;
    case 'hard':
      selectedPatterns = RHYTHM_PATTERNS.filter(p => 
        p.pattern === 'eighth_notes' || p.pattern === 'triplets' || p.pattern === 'dotted_rhythm'
      );
      break;
    default:
      selectedPatterns = RHYTHM_PATTERNS;
  }

  const pattern = selectedPatterns[Math.floor(Math.random() * selectedPatterns.length)];
  
  // 使用相同的邏輯生成 ABC 和音符列表
  const availableNotes = ['C', 'D', 'E', 'F', 'G'];
  const notes = pattern.notes.map(() => 
    availableNotes[Math.floor(Math.random() * availableNotes.length)]
  );

  let abc = 'X:1\n';
  abc += 'M:4/4\n';
  abc += 'L:1/4\n';
  abc += 'K:C\n';

  const abcNotes = notes.map((note, index) => {
    const duration = pattern.durations[index];
    const durationSuffix = DURATION_TO_ABC[duration] || '';
    return NOTE_TO_ABC[note] + durationSuffix;
  });

  abc += abcNotes.join(' ') + ' ||\n';

  const noteList: Note[] = [];
  // 音符從時間 0 開始
  let currentTime = 0;
  
  pattern.durations.forEach((duration, index) => {
    noteList.push({
      id: `note-${index}`,
      time: currentTime,
      duration: duration,
    });
    // 根據難度調整速度
    const speedMultiplier = difficulty === 'easy' ? 0.8 : difficulty === 'medium' ? 0.6 : 0.4;
    currentTime += duration * speedMultiplier;
  });

  return {
    abc,
    noteList
  };
}

// 驗證 ABC 記譜法
export function validateAbcNotation(abc: string): boolean {
  try {
    // 基本的 ABC 格式驗證
    const lines = abc.split('\n');
    let hasHeader = false;
    let hasNotes = false;

    for (const line of lines) {
      if (line.startsWith('X:') || line.startsWith('T:') || 
          line.startsWith('M:') || line.startsWith('L:') || 
          line.startsWith('K:')) {
        hasHeader = true;
      }
      if (line.match(/[A-G]/)) {
        hasNotes = true;
      }
    }

    return hasHeader && hasNotes;
  } catch {
    return false;
  }
}
