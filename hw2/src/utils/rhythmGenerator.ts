interface Note {
  id: string;
  time: number; // 相對時間 (秒)
  duration: number;
  isRest?: boolean; // 新增：標記是否為休止符
  hit?: boolean;
  missed?: boolean;
  wrong?: boolean;
}

interface RhythmPattern {
  abc: string;
  noteList: Note[];
}

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface RhythmElement {
  durations: number[];
  name: string;
  hasRests?: boolean;
}

// 基本節奏元素（確保每個元素都是完整的拍數組合）
const RHYTHM_ELEMENTS: Record<Difficulty, RhythmElement[]> = {
  // 簡單難度：只有四分音符和八分音符
  Easy: [
    { durations: [1, 1, 1, 1], name: 'quarter_notes' }, // 四個四分音符 = 4拍
    { durations: [0.5, 0.5, 1, 1, 1], name: 'mixed_easy_1' }, // 八分+四分 = 4拍
    { durations: [1, 0.5, 0.5, 1, 1], name: 'mixed_easy_2' }, // 四分+八分+四分 = 4拍
    { durations: [0.5, 0.5, 0.5, 0.5, 1, 1], name: 'eighth_and_quarter' }, // 八分音符+四分音符 = 4拍
    { durations: [1, 1, 0.5, 0.5, 1], name: 'quarter_eighth_quarter' }, // 4拍
  ],
  
  // 中等難度：加入十六分音符和休止符
  Medium: [
    { durations: [1, 1, 1, 1], name: 'quarter_notes' },
    { durations: [0.5, 0.5, 1, 1, 1], name: 'mixed_medium_1' },
    { durations: [0.25, 0.25, 0.25, 0.25, 1, 1, 1], name: 'sixteenth_notes' }, // 十六分音符 = 4拍
    { durations: [1, 0.25, 0.25, 0.25, 0.25, 1, 1], name: 'quarter_sixteenth_mix' }, // 4拍
    { durations: [0.5, 0.5, 0.25, 0.25, 0.5, 1, 1], name: 'eighth_sixteenth_mix' }, // 4拍
    { durations: [1, 1, 1, 1], name: 'with_rests', hasRests: true }, // 包含休止符的四分音符
  ],
  
  // 困難難度：包含附點音符、十六分音符、休止符
  Hard: [
    // 附點八分音符 + 十六分音符組合
    { durations: [0.75, 0.25, 0.75, 0.25, 1, 1], name: 'dotted_eighth_sixteenth', hasRests: true },
    
    // 附點四分音符 + 八分音符 + 十六分音符
    { durations: [1.5, 0.25, 0.25, 1, 1], name: 'dotted_quarter_sixteenth', hasRests: true },
    
    // 十六分音符快速組合 + 附點
    { durations: [0.25, 0.25, 0.25, 0.25, 1.5, 0.5, 1], name: 'sixteenth_burst_dotted', hasRests: true },
    
    // 附點 + 十六分休止符 + 十六分音符
    { durations: [1.5, 0.25, 0.25, 0.5, 0.5, 1], name: 'dotted_rest_sixteenth', hasRests: true },
    
    // 複雜附點節奏 + 十六分音符
    { durations: [0.75, 0.25, 1, 0.25, 0.25, 0.25, 0.25, 1], name: 'complex_dotted_sixteenth', hasRests: true },
    
    // 附點二分音符 + 十六分音符組合
    { durations: [3, 0.25, 0.25, 0.25, 0.25], name: 'dotted_half_sixteenth', hasRests: true },
  ]
};

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
  0.25: '/4',        // 十六分音符
  0.5: '/2',         // 八分音符
  0.75: '3/4',       // 附點八分音符
  1: '',             // 四分音符 (默認)
  1.5: '3/2',        // 附點四分音符
  2: '2',            // 二分音符
  3: '3',            // 附點二分音符
  4: '4',            // 全音符
};

// 生成隨機節奏
export function generateRandomRhythm(
  measures: number = 1, 
  bpm: number = 100, 
  difficulty: Difficulty = 'Medium',
  isMobile: boolean = false
): RhythmPattern {
  // 限制小節數在 1-8 之間
  const numMeasures = Math.max(1, Math.min(8, measures));
  
  // 根據難度選擇可用的節奏元素
  const availableElements = RHYTHM_ELEMENTS[difficulty];
  
  // 生成每個小節的節奏
  const allMeasures: Array<{
    durations: number[];
    hasRests: boolean;
  }> = [];
  
  for (let measure = 0; measure < numMeasures; measure++) {
    // 隨機選擇一個節奏元素
    const element = availableElements[Math.floor(Math.random() * availableElements.length)];
    
    // 確保每個小節正好是4拍
    const measureDurations = [...element.durations];
    const totalDuration = measureDurations.reduce((sum, dur) => sum + dur, 0);
    
    // 如果不是正好4拍，調整到4拍
    if (Math.abs(totalDuration - 4) > 0.01) {
      // 按比例縮放到4拍
      const scale = 4 / totalDuration;
      measureDurations.forEach((dur, i) => {
        measureDurations[i] = dur * scale;
      });
    }
    
    allMeasures.push({
      durations: measureDurations,
      hasRests: element.hasRests || false,
    });
  }
  
  // 生成 ABC 記譜法字符串
  let abc = 'X:1\n';
  abc += 'M:4/4\n';
  abc += 'L:1/4\n';
  abc += 'K:C\n';

  // 構建音符序列，按小節處理
  const abcNotes: string[] = [];
  const allNotes: string[] = [];
  const allDurations: number[] = [];
  const availableNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  allMeasures.forEach((measure) => {
    const measureNotes: string[] = [];
    let i = 0;
    
    while (i < measure.durations.length) {
      const duration = measure.durations[i];
      
      // 普通音符或休止符
      let note: string;
      let isRest = false;
      
      // 困難模式：25%概率生成休止符（特別是十六分休止符）
      if (measure.hasRests && Math.random() < 0.25) {
        note = 'z';
        isRest = true;
      } else {
        note = availableNotes[Math.floor(Math.random() * availableNotes.length)];
      }
      
      const durationSuffix = DURATION_TO_ABC[duration] || '';
      
      if (isRest) {
        measureNotes.push('z' + durationSuffix);
      } else {
        measureNotes.push(NOTE_TO_ABC[note] + durationSuffix);
      }
      
      // 將所有音符（包括休止符）加入列表，用於時間計算
      allNotes.push(note);
      allDurations.push(duration);
      i++;
    }
    
    abcNotes.push(...measureNotes, '|');
  });
  
  // 確保以結束符號結尾
  if (abcNotes[abcNotes.length - 1] !== '||') {
    abcNotes[abcNotes.length - 1] = '||';
  }

  // 處理換行：根據設備類型決定換行策略
  const measuresPerLine = isMobile ? 2 : 4; // 手機版2小節換行，桌面版4小節換行
  let finalAbc = '';
  let currentLine: string[] = [];
  let measureCount = 0;
  
  for (let i = 0; i < abcNotes.length; i++) {
    const element = abcNotes[i];
    currentLine.push(element);
    
    if (element === '|' || element === '||') {
      measureCount++;
      
      // 根據設備類型決定換行頻率，或者到達結尾
      if (measureCount % measuresPerLine === 0 || element === '||') {
        finalAbc += currentLine.join(' ');
        if (element !== '||') {
          finalAbc += ' $\n'; // ABC 記譜法的換行符
        } else {
          finalAbc += '\n';
        }
        currentLine = [];
      }
    }
  }
  
  // 處理剩餘的音符
  if (currentLine.length > 0) {
    finalAbc += currentLine.join(' ') + '\n';
  }

  abc += finalAbc;

  // 生成音符列表（用於遊戲邏輯，包括休止符）
  const noteList: Note[] = [];
  const beatDuration = 60 / bpm; // 根據 BPM 計算每拍時間
  let currentTime = 0; // 音符從時間 0 開始
  let noteIndex = 0;
  
  allNotes.forEach((note, index) => {
    const duration = allDurations[index];
    const isRest = note === 'z'; // 檢查是否為休止符
    
    noteList.push({
      id: `note-${noteIndex}`,
      time: currentTime,
      duration: duration,
      isRest: isRest,
    });
    
    noteIndex++;
    currentTime += duration * beatDuration;
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
