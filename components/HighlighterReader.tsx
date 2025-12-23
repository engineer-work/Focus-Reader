
import React, { useState, useEffect } from 'react';
import { WordMetadata } from '../types';

interface HighlighterReaderProps {
  words: WordMetadata[];
  onToggleHighlight: (index: number) => void;
  onSaveNote: (index: number, note: string) => void;
  theme: 'light' | 'dark' | 'sepia';
}

const HighlighterReader: React.FC<HighlighterReaderProps> = ({ words, onToggleHighlight, onSaveNote, theme }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempNote, setTempNote] = useState('');

  // Sync tempNote when the word being edited changes or its note is updated externally
  useEffect(() => {
    if (editingIndex !== null) {
      setTempNote(words[editingIndex]?.note || '');
    }
  }, [editingIndex, words]);

  const handleWordClick = (idx: number) => {
    const word = words[idx];
    
    if (!word.isHighlighted) {
      // If it's not highlighted, highlight it first
      onToggleHighlight(idx);
    }
    
    // Always open the editor for the clicked word
    setEditingIndex(idx);
  };

  const handleRemoveHighlight = () => {
    if (editingIndex !== null) {
      onToggleHighlight(editingIndex);
      setEditingIndex(null);
    }
  };

  const saveNote = () => {
    if (editingIndex !== null) {
      onSaveNote(editingIndex, tempNote);
      setEditingIndex(null);
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRadius: '1.5rem',
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border)',
      position: 'relative'
    },
    textPane: {
      flex: 1,
      overflowY: 'auto',
      padding: '2rem',
      lineHeight: 2.2,
      fontSize: '1.15rem',
      textAlign: 'justify' as const,
    },
    word: {
      display: 'inline-block',
      margin: '0 2px',
      padding: '2px 6px',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      userSelect: 'none',
      position: 'relative'
    },
    noteIndicator: {
      position: 'absolute',
      top: '-2px',
      right: '-2px',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#facc15', // Bright yellow for visibility
      border: '1px solid rgba(0,0,0,0.2)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
    },
    editor: {
      flexShrink: 0,
      padding: '1.25rem',
      backgroundColor: 'var(--bg-accent)',
      borderTop: '2px solid var(--primary)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      boxShadow: '0 -10px 25px rgba(0,0,0,0.1)',
      zIndex: 10
    },
    editorHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    label: {
      fontSize: '0.75rem',
      fontWeight: 800,
      color: 'var(--primary)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    textarea: {
      width: '100%',
      minHeight: '140px',
      padding: '1rem',
      borderRadius: '1rem',
      border: '1px solid var(--border)',
      backgroundColor: 'var(--bg-card)',
      color: 'var(--text-main)',
      fontSize: '1rem',
      outline: 'none',
      fontFamily: 'inherit',
      resize: 'none',
      lineHeight: '1.5',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
    },
    actions: {
      display: 'flex',
      gap: '0.75rem',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    mainActions: {
      display: 'flex',
      gap: '0.75rem'
    },
    saveBtn: {
      padding: '0.6rem 1.5rem',
      borderRadius: '2rem',
      backgroundColor: 'var(--primary)',
      color: 'white',
      fontWeight: 700,
      fontSize: '0.85rem',
      boxShadow: '0 4px 10px var(--primary-light)'
    },
    cancelBtn: {
      padding: '0.6rem 1.25rem',
      borderRadius: '2rem',
      backgroundColor: 'transparent',
      color: 'var(--text-muted)',
      fontWeight: 700,
      fontSize: '0.85rem',
      border: '1px solid var(--border)'
    },
    deleteBtn: {
      padding: '0.6rem 1rem',
      borderRadius: '2rem',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: '#ef4444',
      fontWeight: 700,
      fontSize: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.textPane}>
        <p>
          {words.map((word, idx) => (
            <span
              key={idx}
              onClick={() => handleWordClick(idx)}
              style={{
                ...styles.word,
                backgroundColor: word.isHighlighted ? 'var(--primary-light)' : 'transparent',
                color: word.isHighlighted ? 'var(--primary)' : 'inherit',
                fontWeight: word.isHighlighted ? 700 : 400,
                outline: editingIndex === idx ? '2px solid var(--primary)' : 'none',
                boxShadow: editingIndex === idx ? '0 0 0 4px var(--primary-light)' : 'none',
                textDecoration: word.isHighlighted ? 'underline' : 'none'
              }}
            >
              {word.text}
              {word.note && <div style={styles.noteIndicator} title="Has note" />}
            </span>
          ))}
        </p>
      </div>

      {editingIndex !== null && (
        <div style={styles.editor}>
          <div style={styles.editorHeader}>
            <div style={styles.label}>
              Word Meaning: <span style={{ color: 'var(--text-main)' }}>"{words[editingIndex].text}"</span>
            </div>
            <button style={styles.deleteBtn} onClick={handleRemoveHighlight}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Remove
            </button>
          </div>
          <textarea 
            autoFocus
            style={styles.textarea} 
            placeholder="Type word meaning or study notes here..."
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
          />
          <div style={styles.actions}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Changes are saved when you click "Save Note"
            </span>
            <div style={styles.mainActions}>
              <button style={styles.cancelBtn} onClick={() => setEditingIndex(null)}>Close</button>
              <button style={styles.saveBtn} onClick={saveNote}>Save Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HighlighterReader;
