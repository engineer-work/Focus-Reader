
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

export interface Highlight {
  wordIndex: number;
}

export interface FileEntry {
  id: string;
  name: string;
  path: string; // e.g. "Folder/Sub/file.txt"
  content: string;
  highlights: number[]; // Array of word indices
  notes: Record<number, string>; // Maps word index to a note/meaning
  currentIndex: number;
}

export interface WordMetadata {
  text: string;
  index: number;
  isPunctuation: boolean;
  isHighlighted?: boolean;
  note?: string;
}
