
import React, { useRef } from 'react';

interface FileUploaderProps {
  onUpload: (text: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        onUpload(text);
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const buttonStyle: React.CSSProperties = {
    padding: '0.65rem 1.25rem',
    backgroundColor: 'var(--bg-accent)',
    color: 'var(--text-main)',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'background-color 0.2s ease'
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt,.md"
        style={{ display: 'none' }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        style={buttonStyle}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--border)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-accent)'}
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
        Upload File
      </button>
    </div>
  );
};

export default FileUploader;
