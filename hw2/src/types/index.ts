// ==================== Core Game Types ====================

export interface Note {
  id: string;
  time: number; // 相對時間 (秒)
  duration: number;
  hit?: boolean;
  missed?: boolean;
  wrong?: boolean; // 錯誤敲擊標記
}

export interface GameState {
  isPlaying: boolean;
  currentTime: number;
  score: number;
  totalNotes: number;
  hitNotes: number;
  missedNotes: number;
  wrongNotes: number; // 錯誤敲擊計數
  gameStarted: boolean;
  gameEnded: boolean;
  isPracticeMode: boolean;
  isFirstRound: boolean; // 練習模式的第一輪（系統示範）
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface GameSettings {
  bpm: number;
  measures: number;
  tolerance: number; // 容錯時間 (秒)
  difficulty: Difficulty;
}

// ==================== Rhythm Generation ====================

export interface RhythmPattern {
  abc: string;
  noteList: Note[];
}

export interface RhythmGenerationOptions {
  measures: number;
  bpm: number;
}

// ==================== Audio Types ====================

export interface AudioSettings {
  metronomeEnabled: boolean;
  soundEnabled: boolean;
}

export interface MetronomeConfig {
  bpm: number;
  isRunning: boolean;
  soundEnabled: boolean;
  gameTime: number;
  countInBeats: number;
}

// ==================== UI State Types ====================

export interface UIState {
  showResults: boolean;
  metronomeActive: boolean;
  isLoading: boolean;
  error: string | null;
}

// ==================== Game Events ====================

export type GameEvent = 
  | { type: 'GAME_START'; payload: { countInBeats: number } }
  | { type: 'GAME_PAUSE' }
  | { type: 'GAME_END'; payload: { finalScore: number } }
  | { type: 'NOTE_HIT'; payload: { noteId: string; timeDiff: number } }
  | { type: 'NOTE_MISSED'; payload: { noteId: string } }
  | { type: 'KEY_PRESS'; payload: { timestamp: number } }
  | { type: 'TIME_UPDATE'; payload: { currentTime: number } };

// ==================== ViewModel Interfaces ====================

export interface IRhythmGameViewModel {
  // State
  gameState: GameState;
  gameSettings: GameSettings;
  audioSettings: AudioSettings;
  uiState: UIState;
  notes: Note[];
  abcNotation: string;
  
  // Actions
  generateNewRhythm(): void;
  startGame(): Promise<void>;
  pauseGame(): void;
  handleKeyPress(event: KeyboardEvent): void;
  handleTouchInput(): void;
  updateGameSettings(settings: Partial<GameSettings>): void;
  updateGameState(state: Partial<GameState>): void;
  updateAudioSettings(settings: Partial<AudioSettings>): void;
  updateUIState(state: Partial<UIState>): void;
  
  // Computed Properties
  progress: number;
  totalDuration: number;
  isGameActive: boolean;
}

// ==================== Component Props ====================

export interface AbcRendererProps {
  abcNotation: string;
  currentTime: number;
  notes: Note[];
}

export interface CustomMetronomeProps {
  bpm: number;
  isRunning: boolean;
  soundEnabled?: boolean;
  gameTime?: number;
  countInBeats?: number;
}

// ==================== Utility Types ====================

export type GameMode = 'practice' | 'quiz';
export type NoteState = 'pending' | 'hit' | 'missed' | 'current';
export type GamePhase = 'idle' | 'countdown' | 'playing' | 'paused' | 'finished';

// ==================== Constants ====================

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  bpm: 100,
  measures: 4,
  tolerance: 0.2,
  difficulty: 'Medium',
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  metronomeEnabled: true,
  soundEnabled: true,
};

export const DEFAULT_GAME_STATE: GameState = {
  isPlaying: false,
  currentTime: 0,
  score: 0,
  totalNotes: 0,
  hitNotes: 0,
  missedNotes: 0,
  wrongNotes: 0,
  gameStarted: false,
  gameEnded: false,
  isPracticeMode: true,
  isFirstRound: true,
};

export const DEFAULT_UI_STATE: UIState = {
  showResults: false,
  metronomeActive: false,
  isLoading: false,
  error: null,
};
