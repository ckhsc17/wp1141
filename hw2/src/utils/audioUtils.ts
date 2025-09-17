// 音效工具類
class AudioUtils {
  private static instance: AudioUtils;
  private audioContext: AudioContext | null = null;

  private constructor() {
    // 確保在瀏覽器環境中初始化
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }

  public static getInstance(): AudioUtils {
    if (!AudioUtils.instance) {
      AudioUtils.instance = new AudioUtils();
    }
    return AudioUtils.instance;
  }

  // 創建節拍器聲音
  public createMetronomeClick(frequency: number = 800, duration: number = 0.1): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 創建按鍵音效
  public createKeyPressSound(isCorrect: boolean): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 正確時播放高音，錯誤時播放低音
    const frequency = isCorrect ? 1000 : 300;
    const duration = 0.15;

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = isCorrect ? 'sine' : 'sawtooth';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 創建音符播放聲音 (用於練習模式)
  public createNoteSound(noteFrequency: number, duration: number = 0.5): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(noteFrequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 恢復音頻上下文 (用戶交互後)
  public resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// 音符到頻率的映射
export const NOTE_FREQUENCIES: { [key: string]: number } = {
  'C': 261.63,
  'D': 293.66,
  'E': 329.63,
  'F': 349.23,
  'G': 392.00,
  'A': 440.00,
  'B': 493.88,
};

export default AudioUtils;
