
import React, { useRef, useMemo, useState } from 'react';
import { FileEntry } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  library: FileEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
  setLibrary: React.Dispatch<React.SetStateAction<FileEntry[]>>;
}

interface TreeNode {
  name: string;
  id?: string;
  fullPath: string;
  children: Record<string, TreeNode>;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, library, activeId, onSelect, setLibrary }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  
  const [draggedPath, setDraggedPath] = useState<string | null>(null);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set([''])); // Root is always open

  // Tree Logic
  const tree = useMemo(() => {
    const root: TreeNode = { name: 'Root', fullPath: '', children: {} };
    const sorted = [...library].sort((a, b) => a.path.localeCompare(b.path));
    
    sorted.forEach(file => {
      const parts = file.path.split('/');
      let current = root;
      let pathAccumulator = '';
      
      parts.forEach((part, i) => {
        pathAccumulator = pathAccumulator ? `${pathAccumulator}/${part}` : part;
        if (i === parts.length - 1) {
          current.children[part] = { name: part, id: file.id, fullPath: pathAccumulator, children: {} };
        } else {
          if (!current.children[part]) {
            current.children[part] = { name: part, fullPath: pathAccumulator, children: {} };
          }
          current = current.children[part];
        }
      });
    });
    return root;
  }, [library]);

  const toggleFolder = (path: string) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isFolder = false) => {
    const files = Array.from(e.target.files || []);
    
    files.filter(f => f.name.endsWith('.txt') || f.name.endsWith('.md')).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const entry: FileEntry = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          path: isFolder ? (file as any).webkitRelativePath : file.name,
          content,
          highlights: [],
          notes: {},
          currentIndex: 0
        };
        setLibrary(prev => [...prev, entry]);
      };
      reader.readAsText(file);
    });
  };

  const deleteItem = (e: React.MouseEvent, node: TreeNode) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${node.name}"?`)) return;

    if (node.id) {
      setLibrary(prev => prev.filter(f => f.id !== node.id));
    } else {
      const folderPathPrefix = node.fullPath + '/';
      setLibrary(prev => prev.filter(f => f.path !== node.fullPath && !f.path.startsWith(folderPathPrefix)));
    }
  };

  const moveItem = (sourcePath: string, destFolderPath: string) => {
    if (sourcePath === destFolderPath) return;
    if (destFolderPath.startsWith(sourcePath + '/')) return;

    const sourceParts = sourcePath.split('/');
    const itemName = sourceParts[sourceParts.length - 1];
    const isFile = library.some(f => f.path === sourcePath);

    setLibrary(prev => prev.map(file => {
      if (isFile) {
        if (file.path === sourcePath) {
          return { ...file, path: destFolderPath ? `${destFolderPath}/${itemName}` : itemName };
        }
      } else {
        const prefix = sourcePath + '/';
        if (file.path === sourcePath || file.path.startsWith(prefix)) {
          const relativePart = file.path.slice(sourcePath.length);
          const newBase = destFolderPath ? `${destFolderPath}/${itemName}` : itemName;
          return { ...file, path: newBase + relativePart };
        }
      }
      return file;
    }));
  };

  const handleDragStart = (e: React.DragEvent, path: string) => {
    setDraggedPath(path);
    e.dataTransfer.setData('text/plain', path);
  };

  const handleDragOver = (e: React.DragEvent, path: string) => {
    e.preventDefault();
    if (draggedPath && draggedPath !== path && !path.startsWith(draggedPath + '/')) {
      setDragOverPath(path);
    }
  };

  const handleDrop = (e: React.DragEvent, destPath: string) => {
    e.preventDefault();
    const source = e.dataTransfer.getData('text/plain');
    moveItem(source, destPath);
    setDraggedPath(null);
    setDragOverPath(null);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(library, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusread_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) setLibrary(data);
      } catch (err) { alert('Invalid JSON format'); }
    };
    reader.readAsText(file);
  };

  const renderTree = (node: TreeNode, depth = 0) => {
    const children = Object.keys(node.children).sort();
    return children.map(key => {
      const child = node.children[key];
      const isFile = !!child.id;
      const isActive = child.id === activeId;
      const isDragOver = dragOverPath === child.fullPath;
      const isFolderOpen = openFolders.has(child.fullPath);

      return (
        <div 
          key={key} 
          style={{ paddingLeft: `${depth * 12}px` }}
          onDragOver={(e) => !isFile && handleDragOver(e, child.fullPath)}
          onDragLeave={() => setDragOverPath(null)}
          onDrop={(e) => !isFile && handleDrop(e, child.fullPath)}
        >
          <div 
            draggable 
            onDragStart={(e) => handleDragStart(e, child.fullPath)}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              borderRadius: '6px',
              backgroundColor: isActive ? 'var(--primary-light)' : (isDragOver ? 'var(--bg-accent)' : 'transparent'),
              outline: isDragOver ? '2px dashed var(--primary)' : 'none',
              marginBottom: '2px',
              position: 'relative',
              cursor: 'grab'
            }} 
            className="sidebar-node"
          >
            <button
              onClick={() => isFile ? onSelect(child.id!) : toggleFolder(child.fullPath)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                flex: 1,
                padding: '0.4rem 0.6rem',
                fontSize: '0.85rem',
                color: isActive ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: isActive ? 700 : 400,
                textAlign: 'left',
                overflow: 'hidden',
                pointerEvents: 'auto'
              }}
            >
              {!isFile && (
                <svg 
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" 
                  style={{ flexShrink: 0, transform: isFolderOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
              {isFile ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--text-muted)' }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              )}
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{child.name}</span>
            </button>
            
            <button 
              onClick={(e) => deleteItem(e, child)}
              className="delete-btn"
              style={{
                padding: '0.4rem',
                color: 'var(--text-muted)',
                opacity: 0,
                transition: 'opacity 0.2s, color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Delete"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
          {!isFile && isFolderOpen && renderTree(child, depth + 1)}
        </div>
      );
    });
  };

  const sidebarStyles: React.CSSProperties = {
    position: 'fixed',
    left: isOpen ? 0 : '-280px',
    top: 0,
    bottom: 0,
    width: '280px',
    backgroundColor: 'var(--bg-card)',
    borderRight: '1px solid var(--border)',
    zIndex: 100,
    transition: 'left 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: isOpen ? '20px 0 50px rgba(0,0,0,0.1)' : 'none'
  };

  return (
    <div style={sidebarStyles}>
      <style>{`
        .sidebar-node:hover .delete-btn { opacity: 1 !important; }
        .delete-btn:hover { color: #ef4444 !important; }
        .sidebar-node:active { cursor: grabbing; }
      `}</style>
      
      <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Library</h2>
        <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div style={{ padding: '0 1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button onClick={() => fileInputRef.current?.click()} style={btnStyle}>+ File</button>
        <button onClick={() => folderInputRef.current?.click()} style={btnStyle}>+ Folder</button>
        <button onClick={() => jsonInputRef.current?.click()} style={btnStyle}>Import JSON</button>
        <button onClick={exportJSON} style={btnStyle}>Export JSON</button>
      </div>

      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '0 1rem 1.5rem 1rem',
          outline: dragOverPath === '' ? '2px dashed var(--primary)' : 'none'
        }}
        onDragOver={(e) => handleDragOver(e, '')}
        onDragLeave={() => setDragOverPath(null)}
        onDrop={(e) => handleDrop(e, '')}
      >
        {renderTree(tree)}
        {library.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5, fontSize: '0.8rem' }}>
            No files in library
          </div>
        )}
      </div>

      <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e)} accept=".txt,.md" style={{ display: 'none' }} />
      <input type="file" ref={folderInputRef} onChange={(e) => handleFileUpload(e, true)} {...({ webkitdirectory: "" } as any)} style={{ display: 'none' }} />
      <input type="file" ref={jsonInputRef} onChange={importJSON} accept=".json" style={{ display: 'none' }} />
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  padding: '0.5rem',
  backgroundColor: 'var(--bg-accent)',
  borderRadius: '8px',
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'var(--text-main)',
  textAlign: 'center',
  border: '1px solid var(--border)'
};

export default Sidebar;
