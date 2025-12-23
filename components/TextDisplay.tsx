
import React, { useRef, useEffect } from 'react';
import { WordMetadata } from '../types';

interface TextDisplayProps {
  words: WordMetadata[];
  currentIndex: number;
  onWordClick: (index: number) => void;
  theme: 'light' | 'dark' | 'sepia';
}

const TextDisplay: React.FC<TextDisplayProps> = ({ words, currentIndex, onWordClick, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (activeWordRef.current && containerRef.current) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentIndex]);

  const styles: Record<string, React.CSSProperties> = {
    container: {
      height: 'clamp(300px, 50vh, 600px)',
      overflowY: 'auto',
      padding: '1.5rem',
      borderRadius: '1.25rem',
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border)',
      lineHeight: 1.8,
      fontSize: '1.1rem',
      scrollBehavior: 'smooth',
      textAlign: 'justify' as const,
      wordBreak: 'break-word' as const
    },
    word: {
      display: 'inline-block',
      margin: '2px 4px',
      padding: '2px 6px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s, color 0.2s',
      userSelect: 'none'
    }
  };

  return (
    <div ref={containerRef} style={styles.container}>
      {words.map((word, idx) => {
        const isActive = idx === currentIndex;
        const isRead = idx < currentIndex;

        const activeStyle: React.CSSProperties = {
          backgroundColor: 'var(--primary)',
          color: '#fff',
          fontWeight: 700,
          boxShadow: '0 2px 10px var(--primary-light)',
          transform: 'scale(1.1)',
          zIndex: 1,
          position: 'relative'
        };

        const idleStyle: React.CSSProperties = {
          color: isRead ? 'var(--text-muted)' : 'var(--text-main)',
          opacity: isRead ? 0.4 : 1
        };

        return (
          <span
            key={idx}
            ref={isActive ? activeWordRef : null}
            onClick={() => onWordClick(idx)}
            style={{
              ...styles.word,
              ...(isActive ? activeStyle : idleStyle)
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
};

export default TextDisplay;
