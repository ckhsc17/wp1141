import { useState, useRef, useEffect } from 'react';
import { 
  GameState, 
  GameSettings, 
  AudioSettings, 
  UIState, 
  Note, 
  IRhythmGameViewModel,
  DEFAULT_GAME_STATE,
  DEFAULT_GAME_SETTINGS,
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_UI_STATE
} from '@/types';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';

export class RhythmGameViewModel implements IRhythmGameViewModel {
  // Private state
  private _gameState: GameState = DEFAULT_GAME_STATE;
  private _gameSettings: GameSettings = DEFAULT_GAME_SETTINGS;
  private _audioSettings: AudioSettings = DEFAULT_AUDIO_SETTINGS;
  private _uiState: UIState = DEFAULT_UI_STATE;
  private _notes: Note[] = [];
  private _abcNotation: string = '';
  
  // Private refs
  private gameRef: React.MutableRefObject<NodeJS.Timeout | null>;
  private startTimeRef: React.MutableRefObject<number>;
  private audioUtils: React.MutableRefObject<AudioUtils>;
  private practiceTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  
  // State setters (from React hooks)
  private setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  private setGameSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  private setAudioSettings: React.Dispatch<React.SetStateAction<AudioSettings>>;
  private setUIState: React.Dispatch<React.SetStateAction<UIState>>;
  private setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  private setAbcNotation: React.Dispatch<React.SetStateAction<string>>;

  constructor(
    gameRef: React.MutableRefObject<NodeJS.Timeout | null>,
    startTimeRef: React.MutableRefObject<number>,
    audioUtils: React.MutableRefObject<AudioUtils>,
    practiceTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    setGameSettings: React.Dispatch<React.SetStateAction<GameSettings>>,
    setAudioSettings: React.Dispatch<React.SetStateAction<AudioSettings>>,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>,
    setAbcNotation: React.Dispatch<React.SetStateAction<string>>
  ) {
    this.gameRef = gameRef;
    this.startTimeRef = startTimeRef;
    this.audioUtils = audioUtils;
    this.practiceTimeoutRef = practiceTimeoutRef;
    this.setGameState = setGameState;
    this.setGameSettings = setGameSettings;
    this.setAudioSettings = setAudioSettings;
    this.setUIState = setUIState;
    this.setNotes = setNotes;
    this.setAbcNotation = setAbcNotation;
  }

  // ==================== Public Getters ====================
  
  get gameState(): GameState {
    return this._gameState;
  }

  get gameSettings(): GameSettings {
    return this._gameSettings;
  }

  get audioSettings(): AudioSettings {
    return this._audioSettings;
  }

  get uiState(): UIState {
    return this._uiState;
  }

  get notes(): Note[] {
    return this._notes;
  }

  get abcNotation(): string {
    return this._abcNotation;
  }

  // ==================== Computed Properties ====================

  get progress(): number {
    // 遊戲結束時進度歸零
    if (this._gameState.gameEnded) {
      return 0;
    }
    
    const totalDuration = this.totalDuration;
    const firstNoteTime = this._notes.length > 0 ? this._notes[0]?.time || 0 : 0;
    const musicDuration = totalDuration - firstNoteTime;
    
    return musicDuration > 0 && this._gameState.currentTime >= firstNoteTime
      ? Math.min(((this._gameState.currentTime - firstNoteTime) / musicDuration) * 100, 100)
      : 0;
  }

  get totalDuration(): number {
    return this._notes.length > 0 ? this._notes[this._notes.length - 1]?.time || 0 : 0;
  }

  get isGameActive(): boolean {
    return this._gameState.isPlaying && this._gameState.gameStarted;
  }

  // ==================== Public Methods ====================

  updateInternalState(
    gameState: GameState,
    gameSettings: GameSettings,
    audioSettings: AudioSettings,
    uiState: UIState,
    notes: Note[],
    abcNotation: string
  ): void {
    this._gameState = gameState;
    this._gameSettings = gameSettings;
    this._audioSettings = audioSettings;
    this._uiState = uiState;
    this._notes = notes;
    this._abcNotation = abcNotation;
  }

  generateNewRhythm = (): void => {
    // 使用當前的 React 狀態，而不是內部狀態
    const { abc, noteList } = generateRandomRhythm(this._gameSettings.measures, this._gameSettings.bpm);
    
    this.setAbcNotation(abc);
    this.setNotes(noteList);
    this.setGameState(prev => ({
      ...prev,
      totalNotes: noteList.length,
      score: 0,
      hitNotes: 0,
      missedNotes: 0,
      currentTime: 0,
      gameStarted: false,
      gameEnded: false,
      isPlaying: false,
      isFirstRound: prev.isPracticeMode,
    }));
    
    this.setUIState(prev => ({ 
      ...prev, 
      showResults: false, 
      metronomeActive: false 
    }));
  };

  startGame = (): void => {
    if (!this._abcNotation || this._notes.length === 0) return;

    // 恢復音頻上下文
    this.audioUtils.current.resumeAudioContext();

    // 計算預備拍時間 - 所有模式都有4拍預備拍
    const beatDuration = 60 / this._gameSettings.bpm;
    const countInDuration = 4 * beatDuration; // 4拍預備拍時間
    
    // 設置開始時間，讓預備拍有時間播放
    this.startTimeRef.current = Date.now() + (countInDuration * 1000);
    
    this.setGameState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      gameStarted: true,
      currentTime: -countInDuration // 從負數開始，0時對應第一個音符
    }));

    this.setUIState(prev => ({ ...prev, metronomeActive: true }));

    // 如果是練習模式的第一輪，播放示範
    if (this._gameState.isPracticeMode && this._gameState.isFirstRound) {
      this.playPracticeDemo();
      this.startDemoTimer();
      return;
    }

    // 測驗模式或練習模式第二輪
    this.startGameLoop();
  };

  pauseGame = (): void => {
    // 清理所有定時器
    if (this.gameRef.current) {
      clearInterval(this.gameRef.current);
      this.gameRef.current = null;
    }
    if (this.practiceTimeoutRef.current) {
      clearTimeout(this.practiceTimeoutRef.current);
      this.practiceTimeoutRef.current = null;
    }
    
    // 停止節拍器和遊戲
    this.setUIState(prev => ({ ...prev, metronomeActive: false }));
    this.setGameState(prev => ({ ...prev, isPlaying: false }));
  };

  handleKeyPress = (event: KeyboardEvent): void => {
    if (event.code === 'Space' && this._gameState.isPlaying) {
      event.preventDefault();
      
      // 如果是練習模式的第一輪（示範），不處理按鍵
      if (this._gameState.isPracticeMode && this._gameState.isFirstRound) {
        return;
      }
      
      this.processKeyPressWithCurrentState();
    }
  };

  updateGameSettings = (settings: Partial<GameSettings>): void => {
    this.setGameSettings(prev => ({ ...prev, ...settings }));
  };

  updateGameState = (state: Partial<GameState>): void => {
    this.setGameState(prev => ({ ...prev, ...state }));
  };

  updateAudioSettings = (settings: Partial<AudioSettings>): void => {
    this.setAudioSettings(prev => ({ ...prev, ...settings }));
  };

  updateUIState = (state: Partial<UIState>): void => {
    this.setUIState(prev => ({ ...prev, ...state }));
  };

  // ==================== Private Methods ====================

  private playPracticeDemo(): void {
    if (!this._notes.length) return;

    this._notes.forEach((note, index) => {
      this.practiceTimeoutRef.current = setTimeout(() => {
        const noteFrequency = NOTE_FREQUENCIES['C'];
        this.audioUtils.current.createNoteSound(noteFrequency, 0.3);
        
        if (index === this._notes.length - 1) {
          setTimeout(() => {
            this.setGameState(prev => ({
              ...prev,
              isPlaying: false,
              isFirstRound: false,
            }));
          }, 500);
        }
      }, note.time * 1000);
    });
  }

  private startDemoTimer(): void {
    this.gameRef.current = setInterval(() => {
      const elapsed = (Date.now() - this.startTimeRef.current) / 1000;
      this.setGameState(prev => ({ ...prev, currentTime: elapsed }));
    }, 50);
  }

  private startGameLoop(): void {
    this.gameRef.current = setInterval(() => {
      const elapsed = (Date.now() - this.startTimeRef.current) / 1000;
      
      this.updateGameStateWithTime(elapsed);
    }, 50);
  }

  private updateGameStateWithTime(currentGameTime: number): void {
    this.setGameState(prev => {
      const newState = { ...prev, currentTime: currentGameTime };
      
      // 檢查錯過的音符
      let latestNotes = this._notes;
      
      this.setNotes(currentNotes => {
        const updatedNotes = currentNotes.map(note => {
          if (!note.hit && !note.missed && currentGameTime > note.time + this._gameSettings.tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        latestNotes = updatedNotes;
        return updatedNotes;
      });
      
      // 計算統計數據
      const { missedCount, hitCount, totalNotes } = this.calculateStats(latestNotes);
      const totalProcessed = hitCount + missedCount;
      const totalDuration = this.calculateTotalDuration(latestNotes);
      const gameFinished = this.isGameFinished(totalProcessed, totalNotes, currentGameTime, totalDuration);
      
      if (gameFinished) {
        this.endGame(newState, missedCount, hitCount, totalNotes);
        // 返回結束狀態
        return {
          ...newState,
          currentTime: 0,
          isPlaying: false,
          gameEnded: true,
          missedNotes: missedCount,
          hitNotes: hitCount,
          score: Math.round((hitCount / totalNotes) * 100)
        };
      }
      
      return {
        ...newState,
        missedNotes: missedCount,
        hitNotes: hitCount,
        score: Math.round((hitCount / Math.max(totalProcessed, 1)) * 100)
      };
    });
  }

  private processKeyPressWithCurrentState(): void {
    // 使用函數式更新來獲取最新的狀態
    this.setNotes(currentNotes => {
      const currentTime = this._gameState.currentTime;
      const availableNotes = currentNotes.filter(note => !note.hit && !note.missed);
      
      if (availableNotes.length === 0) {
        this.audioUtils.current.createKeyPressSound(false);
        return currentNotes; // 返回原狀態
      }
      
      const validNotes = availableNotes.filter(note => {
        const timeDiff = Math.abs(note.time - currentTime);
        return timeDiff <= this._gameSettings.tolerance;
      });
      
      if (validNotes.length > 0) {
        const closestNote = this.findClosestNote(validNotes, currentTime);
        this.audioUtils.current.createKeyPressSound(true);
        
        // 更新音符狀態
        return currentNotes.map(note => 
          note.id === closestNote.id ? { ...note, hit: true, missed: false } : note
        );
      } else {
        this.audioUtils.current.createKeyPressSound(false);
        return currentNotes; // 返回原狀態
      }
    });
  }


  private findClosestNote(notes: Note[], currentTime: number): Note {
    return notes.reduce((closest, note) => {
      const timeDiff = Math.abs(note.time - currentTime);
      const closestDiff = Math.abs(closest.time - currentTime);
      return timeDiff < closestDiff ? note : closest;
    }, notes[0]);
  }

  private calculateStats(notes: Note[]) {
    const missedCount = notes.filter(n => n.missed).length;
    const hitCount = notes.filter(n => n.hit).length;
    const totalNotes = notes.length;
    return { missedCount, hitCount, totalNotes };
  }

  private calculateTotalDuration(notes: Note[]): number {
    return notes.length > 0 ? notes[notes.length - 1]?.time || 0 : 0;
  }

  private isGameFinished(totalProcessed: number, totalNotes: number, currentGameTime: number, totalDuration: number): boolean {
    const allNotesProcessed = totalProcessed >= totalNotes;
    const timeExceeded = currentGameTime > totalDuration + this._gameSettings.tolerance + 1;
    const finished = allNotesProcessed || timeExceeded;
    
    if (finished) {
      console.log('🏁 Game should finish:', { 
        totalProcessed, 
        totalNotes, 
        currentGameTime, 
        totalDuration, 
        tolerance: this._gameSettings.tolerance,
        allNotesProcessed,
        timeExceeded
      });
    }
    
    return finished;
  }

  private endGame(newState: GameState, missedCount: number, hitCount: number, totalNotes: number): void {
    console.log('🎮 Game ending:', { missedCount, hitCount, totalNotes, score: Math.round((hitCount / totalNotes) * 100) });
    
    // 清理所有定時器
    if (this.gameRef.current) {
      clearInterval(this.gameRef.current);
      this.gameRef.current = null;
    }
    if (this.practiceTimeoutRef.current) {
      clearTimeout(this.practiceTimeoutRef.current);
      this.practiceTimeoutRef.current = null;
    }
    
    // 更新 UI 狀態：停止節拍器並直接顯示結果對話框
    this.setUIState(prev => ({ 
      ...prev, 
      metronomeActive: false,
      showResults: true // 直接在這裡顯示結果對話框
    }));
    
    console.log('📊 Results dialog should now be visible');
    
    // 更新遊戲狀態：結束遊戲，重置時間
    this.setGameState(prev => ({
      ...prev,
      currentTime: 0, // 重置時間，讓進度條歸零
      isPlaying: false,
      gameEnded: true,
      missedNotes: missedCount,
      hitNotes: hitCount,
      score: Math.round((hitCount / totalNotes) * 100)
    }));
  }
}

// ==================== Custom Hook ====================

export const useRhythmGameViewModel = (): IRhythmGameViewModel => {
  // React state hooks
  const [gameState, setGameState] = useState<GameState>(DEFAULT_GAME_STATE);
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);
  const [uiState, setUIState] = useState<UIState>(DEFAULT_UI_STATE);
  const [notes, setNotes] = useState<Note[]>([]);
  const [abcNotation, setAbcNotation] = useState<string>('');
  
  // React refs
  const gameRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioUtils = useRef<AudioUtils>(AudioUtils.getInstance());
  const practiceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ViewModel instance
  const viewModelRef = useRef<RhythmGameViewModel | null>(null);
  
  if (!viewModelRef.current) {
    viewModelRef.current = new RhythmGameViewModel(
      gameRef,
      startTimeRef,
      audioUtils,
      practiceTimeoutRef,
      setGameState,
      setGameSettings,
      setAudioSettings,
      setUIState,
      setNotes,
      setAbcNotation
    );
  }
  
  // Update ViewModel's internal state when React state changes
  useEffect(() => {
    if (viewModelRef.current) {
      viewModelRef.current.updateInternalState(
        gameState,
        gameSettings,
        audioSettings,
        uiState,
        notes,
        abcNotation
      );
    }
  }, [gameState, gameSettings, audioSettings, uiState, notes, abcNotation]);
  
  // Initialize rhythm on mount and when settings change
  useEffect(() => {
    if (viewModelRef.current) {
      viewModelRef.current.generateNewRhythm();
    }
  }, [gameSettings.measures, gameSettings.bpm]);
  
  // Keyboard event listener
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (viewModelRef.current) {
        viewModelRef.current.handleKeyPress(event);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.isPlaying, gameState.currentTime, gameState.isPracticeMode, gameState.isFirstRound, notes, gameSettings.tolerance]);
  
  // 移除了原本的 Game end effect，現在直接在 endGame 方法中顯示結果對話框
  
  return viewModelRef.current;
};
