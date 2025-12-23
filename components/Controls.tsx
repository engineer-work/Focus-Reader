
import React from 'react';
import { ReaderStatus, ReaderSettings } from '../types';

interface ControlsProps {
  status: ReaderStatus;
  settings: ReaderSettings;
  onTogglePlay: () => void;
  onReset: () => void;
  onSettingsChange: (newSettings: ReaderSettings) => void;
  onNarrate: () => void;
  isNarrating: boolean;
  totalWords: number;
  currentIndex: number;
}

const Controls: React.FC<ControlsProps> = ({ 
  status, 
  settings, 
  onTogglePlay, 
  onReset, 
  onSettingsChange,
  onNarrate,
  isNarrating,
  totalWords,
  currentIndex
}) => {
  const getETA = () => {
    if (totalWords === 0) return '0s';
    const remaining = Math.max(0, totalWords - currentIndex);
    const totalSeconds = (remaining / settings.wpm) * 60;
    if (totalSeconds < 1) return '< 1s';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      backgroundColor: 'var(--bg-card)',
      padding: '1rem',
      borderRadius: '1.25rem',
      border: '1px solid var(--border)',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      alignItems: 'center',
      gap: '1.25rem',
      boxShadow: 'var(--shadow)'
    },
    btnGroup: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
    playBtn: {
      width: '48px', height: '48px', borderRadius: '50%',
      backgroundColor: 'var(--primary)', color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 12px var(--primary-light)'
    },
    actionBtn: {
      width: '36px', height: '36px', borderRadius: '10px',
      backgroundColor: 'var(--bg-accent)', color: 'var(--text-muted)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s ease'
    },
    narrateBtn: {
      backgroundColor: isNarrating ? 'var(--primary-light)' : 'var(--bg-accent)',
      color: isNarrating ? 'var(--primary)' : 'var(--text-muted)',
      animation: isNarrating ? 'pulse 1.5s infinite' : 'none'
    },
    sliderWrap: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
    label: { fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' },
    value: { fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' },
    themeWrap: { display: 'flex', gap: '0.4rem' },
    dot: { width: '20px', height: '20px', borderRadius: '50%', border: '2px solid transparent' }
  };

  return (
    <div style={styles.container} className="controls-layout">
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        @media (max-width: 600px) {
          .controls-layout { grid-template-columns: 1fr; gap: 1rem; }
          .controls-layout > div { justify-content: center; }
        }
      `}</style>

      <div style={styles.btnGroup}>
        <button onClick={onTogglePlay} style={styles.playBtn}>
          {status === ReaderStatus.PLAYING ? 
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : 
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{marginLeft:'2px'}}><path d="M8 5v14l11-7z"/></svg>}
        </button>
        <button onClick={onReset} style={styles.actionBtn} title="Reset">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
        <button onClick={onNarrate} style={{...styles.actionBtn, ...styles.narrateBtn}} title="Read Aloud (System Speech)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
        </button>
      </div>

      <div style={styles.sliderWrap}>
        <div style={styles.labelRow}>
          <span style={styles.label}>SPEED <span style={styles.value}>{settings.wpm}</span></span>
          <span style={styles.label}>ETA <span style={{...styles.value, color: 'var(--text-main)'}}>{getETA()}</span></span>
        </div>
        <input 
          type="range" min="100" max="1200" step="25" 
          value={settings.wpm}
          onChange={(e) => onSettingsChange({...settings, wpm: parseInt(e.target.value)})}
        />
      </div>

      <div style={styles.themeWrap}>
        {(['light', 'sepia', 'dark'] as const).map(t => (
          <button 
            key={t}
            onClick={() => onSettingsChange({...settings, theme: t})}
            style={{
              ...styles.dot,
              backgroundColor: t === 'light' ? '#fff' : t === 'sepia' ? '#f4ecd8' : '#0f172a',
              borderColor: settings.theme === t ? 'var(--primary)' : 'var(--border)',
              transform: settings.theme === t ? 'scale(1.1)' : 'scale(1)'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Controls;
