
import React from 'react';
import { ReaderSettings, ReaderStatus } from '../types';

interface SpeedReaderProps {
  word: string;
  settings: ReaderSettings;
  status: ReaderStatus;
}

const SpeedReader: React.FC<SpeedReaderProps> = ({ word, settings, status }) => {
  // Standard RSVP Optical Recognition Point (ORP)
  const getORPIndex = (w: string) => {
    const length = w.length;
    if (length <= 1) return 0;
    if (length <= 5) return 1;
    if (length <= 9) return 2;
    if (length <= 13) return 3;
    return 4;
  };

  const orpIndex = getORPIndex(word);
  const before = word.slice(0, orpIndex);
  const focal = word.slice(orpIndex, orpIndex + 1);
  const after = word.slice(orpIndex + 1);

  // Dynamic font size adjustment for long words
  // For words longer than 8 chars, we scale down the font to fit the container
  const getDynamicFontSize = () => {
    const baseSize = settings.fontSize;
    const len = word.length;
    if (len <= 7) return baseSize;
    // Simple linear scale down: 10% reduction for every char over 7
    const scale = Math.max(0.5, 1 - (len - 7) * 0.08);
    return baseSize * scale;
  };

  if (status === ReaderStatus.FINISHED) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>DONE</h2>
        <p style={{ opacity: 0.5 }}>Session finished.</p>
      </div>
    );
  }

  const dynamicSize = getDynamicFontSize();

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      // We use 9vw as a safety limit to ensure a 10-char word (like algorithms) 
      // stays within 90% of the viewport width even at max settings.
      fontSize: `clamp(24px, ${dynamicSize}px, 9vw)`,
      position: 'relative',
      userSelect: 'none',
      backgroundColor: 'transparent',
      padding: '0 5%' // Safe horizontal padding
    },
    guideMarker: {
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '2px',
      height: '15%',
      backgroundColor: 'var(--primary)',
      opacity: 0.6,
      zIndex: 2,
      borderRadius: '1px'
    },
    grid: {
      display: 'grid',
      // Using minmax(0, 1fr) prevents pillars from pushing the focal point off center
      gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
      width: '100%',
      alignItems: 'center',
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      whiteSpace: 'pre', 
      letterSpacing: '-0.04em', // Slightly tighter for RSVP speed
      fontVariantNumeric: 'tabular-nums'
    },
    leftPart: {
      textAlign: 'right',
      opacity: 0.2,
      color: 'var(--text-main)',
      overflow: 'hidden',
      textOverflow: 'clip'
    },
    centerPart: {
      color: 'var(--primary)',
      textAlign: 'center',
      minWidth: '1ch',
      textShadow: '0 0 20px var(--primary-light)',
      padding: '0 2px'
    },
    rightPart: {
      textAlign: 'left',
      opacity: 0.2,
      color: 'var(--text-main)',
      overflow: 'hidden',
      textOverflow: 'clip'
    }
  };

  return (
    <div style={styles.container}>
      {settings.showFocusPoint && (
        <>
          <div style={{ ...styles.guideMarker, top: '22%' }} />
          <div style={{ ...styles.guideMarker, bottom: '22%' }} />
        </>
      )}
      
      <div style={styles.grid}>
        <div style={styles.leftPart}>{before}</div>
        <div style={styles.centerPart}>{focal}</div>
        <div style={styles.rightPart}>{after}</div>
      </div>
    </div>
  );
};

export default SpeedReader;
