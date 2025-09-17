declare module '@kevinorriss/react-metronome' {
  interface MetronomeProps {
    bpm?: number;
    isRunning?: boolean;
    soundEnabled?: boolean;
  }

  const Metronome: React.FC<MetronomeProps>;
  export default Metronome;
}
