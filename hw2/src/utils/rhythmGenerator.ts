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
  
  // 困難難度：加入附點音符和三連音
  Hard: [
    { durations: [1, 1, 1, 1], name: 'quarter_notes' },
    { durations: [0.25, 0.25, 0.25, 0.25, 1, 1, 1], name: 'sixteenth_notes' },
    { durations: [1.5, 0.5, 1, 1], name: 'dotted_quarter' }, // 附點四分音符 = 4拍
    { durations: [1, 1.5, 0.5, 1], name: 'dotted_mix' }, // 4拍
    { durations: [0.67, 0.67, 0.66, 1, 1, 1], name: 'triplets_1' }, // 三連音 = 4拍
    { durations: [1, 0.67, 0.67, 0.66, 1, 1], name: 'triplets_2' }, // 4拍
    { durations: [1.5, 0.25, 0.25, 1, 1], name: 'dotted_sixteenth' }, // 附點+十六分音符 = 4拍
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
export function generateRandomRhythm(
  measures: number = 1, 
  bpm: number = 100, 
  difficulty: Difficulty = 'Medium'
): RhythmPattern {
  // 限制小節數在 1-8 之間
  const numMeasures = Math.max(1, Math.min(8, measures));
  
  // 根據難度選擇可用的節奏元素
  const availableElements = RHYTHM_ELEMENTS[difficulty];
  
  // 生成每個小節的節奏
  let allDurations: number[] = [];
  let hasRests = false;
  
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
    
    allDurations = allDurations.concat(measureDurations);
    if (element.hasRests) hasRests = true;
  }
  
  // 生成音符序列
  const availableNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const notes: string[] = [];
  
  allDurations.forEach((duration, index) => {
    // 如果該元素支持休止符，有20%概率生成休止符
    if (hasRests && Math.random() < 0.2) {
      notes.push('z'); // ABC 記譜法中的休止符
    } else {
      notes.push(availableNotes[Math.floor(Math.random() * availableNotes.length)]);
    }
  });

  // 生成 ABC 記譜法字符串
  let abc = 'X:1\n';
  abc += 'M:4/4\n';
  abc += 'L:1/4\n';
  abc += 'K:C\n';

  // 構建音符序列，嚴格按小節分組
  const abcNotes: string[] = [];
  let currentMeasureDuration = 0;
  let measureNotes: string[] = [];
  
  allDurations.forEach((duration, index) => {
    const note = notes[index];
    const durationSuffix = DURATION_TO_ABC[duration] || '';
    
    if (note === 'z') {
      measureNotes.push('z' + durationSuffix); // 休止符
    } else {
      measureNotes.push(NOTE_TO_ABC[note] + durationSuffix);
    }
    
    currentMeasureDuration += duration;
    
    // 每當累積到4拍時，完成一個小節
    if (Math.abs(currentMeasureDuration - 4) < 0.01) {
      abcNotes.push(...measureNotes, '|');
      measureNotes = [];
      currentMeasureDuration = 0;
    }
  });
  
  // 確保以結束符號結尾
  if (abcNotes[abcNotes.length - 1] !== '|') {
    abcNotes.push('||');
  } else {
    abcNotes[abcNotes.length - 1] = '||';
  }

  abc += abcNotes.join(' ') + '\n';

  // 生成音符列表（用於遊戲邏輯，跳過休止符）
  const noteList: Note[] = [];
  const beatDuration = 60 / bpm; // 根據 BPM 計算每拍時間
  let currentTime = 0; // 音符從時間 0 開始
  let noteIndex = 0;
  
  allDurations.forEach((duration, index) => {
    // 只為非休止符創建 Note 對象
    if (notes[index] !== 'z') {
      noteList.push({
        id: `note-${noteIndex}`,
        time: currentTime,
        duration: duration,
      });
      noteIndex++;
    }
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
