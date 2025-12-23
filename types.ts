
export interface ReaderSettings {
  wpm: number;
  fontSize: number;
  showFocusPoint: boolean;
  theme: 'light' | 'dark' | 'sepia';
}

export enum ReaderStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED'
}

export interface WordMetadata {
  text: string;
  index: number;
  isPunctuation: boolean;
}
