
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ReaderSettings, ReaderStatus, WordMetadata, FileEntry } from './types';
import SpeedReader from './components/SpeedReader';
import TextDisplay from './components/TextDisplay';
import Controls from './components/Controls';
import Sidebar from './components/Sidebar';
import HighlighterReader from './components/HighlighterReader';

const STORAGE_KEY = 'focusread_library_v5';

const App: React.FC = () => {
  const [library, setLibrary] = useState<FileEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.map((f: any) => ({ ...f, notes: f.notes || {} }));
  });
  const [activeFileId, setActiveFileId] = useState<string | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_activeId`);
    return saved || null;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'speed' | 'highlighter'>('speed');
  const [status, setStatus] = useState<ReaderStatus>(ReaderStatus.IDLE);
  const [isNarrating, setIsNarrating] = useState(false);
  
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    return saved ? JSON.parse(saved) : {
      wpm: 350,
      fontSize: 84,
      showFocusPoint: true,
      theme: 'dark'
    };
  });

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  }, [library]);

  useEffect(() => {
    if (activeFileId) localStorage.setItem(`${STORAGE_KEY}_activeId`, activeFileId);
  }, [activeFileId]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings]);

  const activeFile = useMemo(() => 
    library.find(f => f.id === activeFileId) || null
  , [library, activeFileId]);

  const words = useMemo<WordMetadata[]>(() => {
    if (!activeFile) return [];
    const raw = activeFile.content.replace(/\s+/g, ' ').trim();
    return raw.split(' ').map((word, idx) => ({
      text: word,
      index: idx,
      isPunctuation: /[.!?]$/.test(word),
      isHighlighted: activeFile.highlights.includes(idx),
      note: activeFile.notes?.[idx]
    }));
  }, [activeFile]);

  const updateActiveFile = (updates: Partial<FileEntry>) => {
    if (!activeFileId) return;
    setLibrary(prev => prev.map(f => f.id === activeFileId ? { ...f, ...updates } : f));
  };

  const togglePlay = useCallback(() => {
    if (isNarrating) {
      window.speechSynthesis.cancel();
      setIsNarrating(false);
    }
    setStatus(prev => prev === ReaderStatus.PLAYING ? ReaderStatus.PAUSED : ReaderStatus.PLAYING);
  }, [isNarrating]);

  const narrateCurrentSegment = () => {
    if (!activeFile || words.length === 0) return;
    
    // Stop RSVP if running
    setStatus(ReaderStatus.PAUSED);

    // Stop existing narration
    window.speechSynthesis.cancel();

    const startIndex = activeFile.currentIndex;
    // Speak a chunk of 50 words or until end
    const segment = words.slice(startIndex, startIndex + 50).map(w => w.text).join(' ');
    
    const utterance = new SpeechSynthesisUtterance(segment);
    
    // Attempt to map WPM to Speech Rate (normal rate is 1.0, approx 150-180 wpm)
    const baseWpm = 175;
    utterance.rate = Math.min(Math.max(settings.wpm / baseWpm, 0.5), 3.0);
    
    utterance.onstart = () => setIsNarrating(true);
    utterance.onend = () => setIsNarrating(false);
    utterance.onerror = () => setIsNarrating(false);
    
    // Sync words visually as they are spoken (if supported by browser)
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        const wordsInSegment = segment.slice(0, charIndex).split(' ').length - 1;
        const globalIdx = startIndex + wordsInSegment;
        if (globalIdx < words.length) {
          updateActiveFile({ currentIndex: globalIdx });
        }
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (status === ReaderStatus.PLAYING && words.length > 0 && activeFile) {
      const delay = 60000 / settings.wpm;
      const currentWord = words[activeFile.currentIndex];
      const actualDelay = currentWord?.isPunctuation ? delay * 2.2 : delay;

      timerRef.current = window.setTimeout(() => {
        if (activeFile.currentIndex < words.length - 1) {
          updateActiveFile({ currentIndex: activeFile.currentIndex + 1 });
        } else {
          setStatus(ReaderStatus.FINISHED);
        }
      }, actualDelay);
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [status, activeFile?.currentIndex, words, settings.wpm, activeFileId]);

  const styles: Record<string, React.CSSProperties> = {
    appWrapper: { display: 'flex', height: '100svh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', overflow: 'hidden', position: 'relative' },
    mainContent: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' },
    header: { flexShrink: 0, padding: 'max(0.75rem, var(--safe-top)) 1.25rem 0.5rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    tabBar: { display: 'flex', justifyContent: 'center', padding: '0.5rem 0', gap: '0.5rem' },
    tabButton: { padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s ease', border: '1px solid var(--border)' },
    contentArea: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0 1rem 1rem 1rem', overflow: 'hidden' },
    readerCard: { flexShrink: 0, height: '35%', minHeight: '200px', position: 'relative', backgroundColor: 'var(--bg-card)', borderRadius: '1.5rem', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', boxShadow: 'var(--shadow)' },
    progressBarContainer: { position: 'absolute', bottom: '1rem', left: '10%', right: '10%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', pointerEvents: 'none' },
    progressBar: { height: '4px', width: '100%', backgroundColor: 'var(--bg-accent)', borderRadius: '2px', position: 'relative' },
    progressFill: { height: '100%', backgroundColor: 'var(--primary)', borderRadius: '2px', transition: 'width 0.1s linear' },
    progressText: { fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  };

  return (
    <div style={styles.appWrapper}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        library={library}
        activeId={activeFileId}
        onSelect={(id) => { setActiveFileId(id); setSidebarOpen(false); setStatus(ReaderStatus.PAUSED); window.speechSynthesis.cancel(); setIsNarrating(false); }}
        setLibrary={setLibrary}
      />

      <div style={{...styles.mainContent, transform: sidebarOpen ? 'translateX(280px)' : 'none'}}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--text-main)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>FocusRead</span>
          </div>
          
          <div style={styles.tabBar}>
            <button 
              style={{...styles.tabButton, backgroundColor: activeTab === 'speed' ? 'var(--primary)' : 'var(--bg-card)', color: activeTab === 'speed' ? 'white' : 'var(--text-main)'}}
              onClick={() => setActiveTab('speed')}
            >Speed</button>
            <button 
              style={{...styles.tabButton, backgroundColor: activeTab === 'highlighter' ? 'var(--primary)' : 'var(--bg-card)', color: activeTab === 'highlighter' ? 'white' : 'var(--text-main)'}}
              onClick={() => setActiveTab('highlighter')}
            >Highlighter</button>
          </div>
        </header>

        <div style={styles.contentArea}>
          {!activeFile ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: 0.5 }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No File Selected</h2>
                <p style={{ fontSize: '0.9rem' }}>Open the library to begin</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'speed' ? (
                <>
                  <section style={styles.readerCard} onClick={togglePlay}>
                    <SpeedReader 
                      word={words[activeFile.currentIndex]?.text || ""} 
                      settings={settings}
                      status={status}
                    />
                    <div style={styles.progressBarContainer}>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${((activeFile.currentIndex + 1) / words.length) * 100}%` }} />
                      </div>
                      <div style={styles.progressText}>{activeFile.currentIndex + 1} / {words.length}</div>
                    </div>
                  </section>
                  <Controls 
                    status={status} 
                    settings={settings} 
                    onTogglePlay={togglePlay}
                    onReset={() => { updateActiveFile({ currentIndex: 0 }); window.speechSynthesis.cancel(); setIsNarrating(false); }}
                    onSettingsChange={setSettings}
                    onNarrate={narrateCurrentSegment}
                    isNarrating={isNarrating}
                    totalWords={words.length}
                    currentIndex={activeFile.currentIndex}
                  />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <TextDisplay 
                      words={words} 
                      currentIndex={activeFile.currentIndex} 
                      onWordClick={(idx) => { updateActiveFile({ currentIndex: idx }); window.speechSynthesis.cancel(); setIsNarrating(false); }} 
                      theme={settings.theme} 
                    />
                  </div>
                </>
              ) : (
                <HighlighterReader 
                  words={words}
                  onToggleHighlight={(idx) => {
                    const newHighlights = activeFile.highlights.includes(idx) ? activeFile.highlights.filter(h => h !== idx) : [...activeFile.highlights, idx];
                    const newNotes = { ...activeFile.notes };
                    if (activeFile.highlights.includes(idx)) delete newNotes[idx];
                    updateActiveFile({ highlights: newHighlights, notes: newNotes });
                  }}
                  onSaveNote={(idx, text) => updateActiveFile({ notes: { ...activeFile.notes, [idx]: text } })}
                  theme={settings.theme}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
