
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ReaderSettings, ReaderStatus, WordMetadata } from './types';
import SpeedReader from './components/SpeedReader';
import TextDisplay from './components/TextDisplay';
import Controls from './components/Controls';
import FileUploader from './components/FileUploader';

const STORAGE_KEY = 'focusread_state_v3';

const App: React.FC = () => {
  const [words, setWords] = useState<WordMetadata[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [status, setStatus] = useState<ReaderStatus>(ReaderStatus.IDLE);
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    return saved ? JSON.parse(saved) : {
      wpm: 350,
      fontSize: 84, // This is the user-preferred MAX font size
      showFocusPoint: true,
      theme: 'dark'
    };
  });

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedText = localStorage.getItem(`${STORAGE_KEY}_text`);
    const savedIndex = localStorage.getItem(`${STORAGE_KEY}_index`);
    if (savedText) {
      handleTextUpload(savedText, false);
      if (savedIndex) setCurrentIndex(parseInt(savedIndex));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
    localStorage.setItem(`${STORAGE_KEY}_index`, currentIndex.toString());
  }, [settings, currentIndex]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  const handleTextUpload = useCallback((rawText: string, shouldSave = true) => {
    const cleanedText = rawText.replace(/\s+/g, ' ').trim();
    const wordList = cleanedText.split(' ').map((word, idx) => ({
      text: word,
      index: idx,
      isPunctuation: /[.!?]$/.test(word)
    }));
    setWords(wordList);
    if (shouldSave) {
      setCurrentIndex(0);
      localStorage.setItem(`${STORAGE_KEY}_text`, rawText);
    }
    setStatus(ReaderStatus.PAUSED);
  }, []);

  const togglePlay = useCallback(() => {
    setStatus(prev => prev === ReaderStatus.PLAYING ? ReaderStatus.PAUSED : ReaderStatus.PLAYING);
  }, []);

  const resetReader = useCallback(() => {
    setStatus(ReaderStatus.PAUSED);
    setCurrentIndex(0);
  }, []);

  const handleWordSelect = useCallback((index: number) => {
    setCurrentIndex(index);
    if (status === ReaderStatus.FINISHED) setStatus(ReaderStatus.PAUSED);
  }, [status]);

  useEffect(() => {
    if (status === ReaderStatus.PLAYING && words.length > 0) {
      const delay = 60000 / settings.wpm;
      const currentWord = words[currentIndex];
      const actualDelay = currentWord?.isPunctuation ? delay * 2.2 : delay;

      timerRef.current = window.setTimeout(() => {
        if (currentIndex < words.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setStatus(ReaderStatus.FINISHED);
        }
      }, actualDelay);
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [status, currentIndex, words, settings.wpm]);

  const styles: Record<string, React.CSSProperties> = {
    appWrapper: {
      display: 'flex',
      flexDirection: 'column',
      height: '100svh',
      backgroundColor: 'var(--bg-page)',
      color: 'var(--text-main)',
      overflow: 'hidden'
    },
    header: {
      flexShrink: 0,
      padding: 'max(0.75rem, var(--safe-top)) 1.25rem 0.5rem 1.25rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    contentArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      padding: '0 1rem 1rem 1rem',
      overflow: 'hidden'
    },
    readerCard: {
      flexShrink: 0,
      height: '35%',
      minHeight: '200px',
      position: 'relative',
      backgroundColor: 'var(--bg-card)',
      borderRadius: '1.5rem',
      border: '1px solid var(--border)',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      boxShadow: '0 4px 20px -5px rgba(0,0,0,0.3)'
    },
    progressBarContainer: { 
      position: 'absolute', 
      bottom: '1rem', 
      left: '10%', 
      right: '10%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.4rem',
      pointerEvents: 'none'
    },
    progressBar: { 
      height: '4px', 
      width: '100%', 
      backgroundColor: 'var(--bg-accent)', 
      borderRadius: '2px',
      position: 'relative'
    },
    progressFill: { 
      height: '100%', 
      backgroundColor: 'var(--primary)', 
      borderRadius: '2px',
      transition: 'width 0.1s linear'
    },
    progressMarker: {
      position: 'absolute',
      left: '50%',
      top: '-4px',
      bottom: '-4px',
      width: '2px',
      backgroundColor: 'var(--primary)',
      opacity: 0.3
    },
    progressText: { 
      fontSize: '0.6rem', 
      fontWeight: 800, 
      color: 'var(--text-muted)', 
      textTransform: 'uppercase',
      letterSpacing: '0.08em'
    },
    controlsCard: {
      flexShrink: 0
    },
    textCard: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  };

  return (
    <div style={styles.appWrapper}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '28px', height: '28px', backgroundColor: 'var(--primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>F</div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>FocusRead</span>
        </div>
        <FileUploader onUpload={(t) => handleTextUpload(t)} />
      </header>

      <div style={styles.contentArea}>
        {words.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: 0.5 }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome to FocusRead</h2>
              <p style={{ fontSize: '0.9rem' }}>Upload a file to start your speed reading session</p>
            </div>
          </div>
        ) : (
          <>
            <section style={styles.readerCard} onClick={togglePlay}>
              <SpeedReader 
                word={words[currentIndex]?.text || ""} 
                settings={settings}
                status={status}
              />
              <div style={styles.progressBarContainer}>
                <div style={styles.progressBar}>
                  <div style={styles.progressMarker} />
                  <div style={{ ...styles.progressFill, width: `${((currentIndex + 1) / words.length) * 100}%` }} />
                </div>
                <div style={styles.progressText}>{currentIndex + 1} / {words.length} WORDS</div>
              </div>
            </section>

            <section style={styles.controlsCard}>
              <Controls 
                status={status} 
                settings={settings} 
                onTogglePlay={togglePlay}
                onReset={resetReader}
                onSettingsChange={setSettings}
                totalWords={words.length}
                currentIndex={currentIndex}
              />
            </section>

            <section style={styles.textCard}>
              <h3 style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.08em' }}>Full Text Context</h3>
              <TextDisplay words={words} currentIndex={currentIndex} onWordClick={handleWordSelect} theme={settings.theme} />
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
