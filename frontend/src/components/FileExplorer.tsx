import { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, Search, FileText } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
}

interface FileExplorerProps {
  onFileSelect: (path: string) => void;
  selectedFile: string;
  files?: Record<string, string> | null;
}

interface SearchMatch {
  filePath: string;
  line: number;
  lineContent: string;
  matchIndex: number;
}

type TabType = 'files' | 'search';

// TODO: (3 files are missing package-lock.json, .env, .gitignore)
function FileExplorer({ onFileSelect, selectedFile, files }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set([])
  );
  const [activeTab, setActiveTab] = useState<TabType>('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number>(0);

  // Auto-expand folders when a file inside them is selected
  useEffect(() => {
    if (selectedFile && selectedFile.includes('/')) {
      const parts = selectedFile.split('/');
      const newExpanded = new Set(expandedFolders);
      let currentPath = '';
      
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        newExpanded.add(currentPath);
      }
      
      setExpandedFolders(newExpanded);
    }
  }, [selectedFile]);

  const sortNodes = (nodes: FileNode[]): FileNode[] => {
    return [...nodes].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  const fileStructure: FileNode[] = useMemo(() => {
    const map: Record<string, FileNode> = {};

    // Get paths from provided files
    const paths = Object.keys(files || {});

    for (const fullPath of paths) {
      const parts = fullPath.split('/');
      let currentPath = '';

      for (let i = 0; i < parts.length; i++) {
        const name = parts[i];
        currentPath = currentPath ? `${currentPath}/${name}` : name;

        if (!map[currentPath]) {
          map[currentPath] = {
            name,
            type: i === parts.length - 1 ? 'file' : 'folder',
            path: currentPath,
            children: i === parts.length - 1 ? undefined : [],
          };
        }

        if (i > 0) {
          const parentPath = parts.slice(0, i).join('/');
          const parent = map[parentPath];
          if (parent && parent.children) {
            const exists = parent.children.find((c) => c.path === currentPath);
            if (!exists) parent.children.push(map[currentPath]);
          }
        }
      }
    }

    // collect top-level nodes (no parent) and sort them
    const topLevel = Object.values(map).filter((n) => !n.path.includes('/'));
    const sorted = sortNodes(topLevel);

    // recursively sort all children
    const sortRecursive = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => ({
        ...node,
        children: node.children ? sortRecursive(sortNodes(node.children)) : node.children,
      }));
    };

    return sortRecursive(sorted);
  }, [files]);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  // Search across file contents
  useEffect(() => {
    if (activeTab === 'search' && searchQuery.trim()) {
      const matches: SearchMatch[] = [];
      const query = searchQuery.toLowerCase();
      let matchIndex = 0;

      Object.entries(files || {}).forEach(([filePath, content]) => {
        const lines = content.split('\n');
        lines.forEach((line, lineNumber) => {
          if (line.toLowerCase().includes(query)) {
            matches.push({
              filePath,
              line: lineNumber + 1,
              lineContent: line.trim(),
              matchIndex: matchIndex++,
            });
          }
        });
      });

      setSearchMatches(matches);
      setSelectedMatchIndex(0);
      
      // Auto-select first match
      if (matches.length > 0) {
        const firstMatch = matches[0];
        onFileSelect(firstMatch.filePath);
        
        // Wait for editor content to load before scrolling
        const handleContentLoaded = () => {
          window.dispatchEvent(new CustomEvent('scrollToLine', { detail: { line: firstMatch.line } }));
          window.removeEventListener('editorContentLoaded', handleContentLoaded);
        };
        
        window.addEventListener('editorContentLoaded', handleContentLoaded);
        
        // Fallback timeout in case event doesn't fire
        setTimeout(() => {
          window.removeEventListener('editorContentLoaded', handleContentLoaded);
          window.dispatchEvent(new CustomEvent('scrollToLine', { detail: { line: firstMatch.line } }));
        }, 150);
      }
    } else {
      setSearchMatches([]);
    }
  }, [searchQuery, files, activeTab]);

  // Keyboard navigation for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab === 'search' && searchMatches.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const newIndex = selectedMatchIndex < searchMatches.length - 1 ? selectedMatchIndex + 1 : 0;
          const match = searchMatches[newIndex];
          handleMatchSelect(match, newIndex);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const newIndex = selectedMatchIndex > 0 ? selectedMatchIndex - 1 : searchMatches.length - 1;
          const match = searchMatches[newIndex];
          handleMatchSelect(match, newIndex);
        } else if (e.key === 'Enter' && searchMatches[selectedMatchIndex]) {
          e.preventDefault();
          const match = searchMatches[selectedMatchIndex];
          handleMatchSelect(match, selectedMatchIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, searchMatches, selectedMatchIndex]);

  const handleMatchSelect = (match: SearchMatch, index: number) => {
    setSelectedMatchIndex(index);
    onFileSelect(match.filePath);
    
    // Wait for editor content to load before scrolling
    const handleContentLoaded = () => {
      window.dispatchEvent(new CustomEvent('scrollToLine', { detail: { line: match.line } }));
      window.removeEventListener('editorContentLoaded', handleContentLoaded);
    };
    
    window.addEventListener('editorContentLoaded', handleContentLoaded);
    
    // Fallback timeout in case event doesn't fire
    setTimeout(() => {
      window.removeEventListener('editorContentLoaded', handleContentLoaded);
      window.dispatchEvent(new CustomEvent('scrollToLine', { detail: { line: match.line } }));
    }, 150);
  };

  const groupMatchesByFile = useMemo(() => {
    const grouped: Record<string, SearchMatch[]> = {};
    searchMatches.forEach((match) => {
      if (!grouped[match.filePath]) {
        grouped[match.filePath] = [];
      }
      grouped[match.filePath].push(match);
    });
    return grouped;
  }, [searchMatches]);

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <div
            onClick={() => toggleFolder(node.path)}
            onMouseDown={(e) => e.preventDefault()}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#21262d] cursor-pointer rounded group select-none min-w-0"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-400 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span className="text-sm text-gray-300 truncate min-w-0">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        onClick={() => onFileSelect(node.path)}
        className={`flex items-center gap-2 px-2 py-1.5 hover:bg-[#21262d] cursor-pointer rounded transition-colors min-w-0 ${
          isSelected ? 'bg-blue-600/20 border-l-2 border-blue-500' : ''
        }`}
        style={{ paddingLeft: `${depth * 12 + 28}px` }}
      >
        <File className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
        <span className={`text-sm truncate min-w-0 ${isSelected ? 'text-blue-300 font-medium' : 'text-gray-300'}`}>
          {node.name}
        </span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      {/* Tabs */}
      <div className="flex border-b border-[#30363d]">
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'files'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-[#161b22]'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4 shrink-0" />
            Files
          </div>
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'search'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-[#161b22]'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Search className="w-4 h-4 shrink-0" />
            Search
          </div>
        </button>
      </div>

      {/* Search Input */}
      {activeTab === 'search' && (
        <div className="p-3 border-b border-[#30363d]">
          <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded px-3 py-1.5">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search in files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
          {searchMatches.length > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              {searchMatches.length} results in {Object.keys(groupMatchesByFile).length} files
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'files' ? (
          <>
            <div className="mb-2 px-2 py-1">
              <span className="text-xs font-semibold text-gray-500 uppercase">Files</span>
            </div>
            {fileStructure.map((node) => renderNode(node))}
          </>
        ) : (
          <>
            {searchQuery.trim() === '' ? (
              <div className="text-center text-gray-500 text-sm mt-8">
                Enter a search term to find in files
              </div>
            ) : searchMatches.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-8">
                No results found
              </div>
            ) : (
              <div className="space-y-1">
                {Object.entries(groupMatchesByFile).map(([filePath, matches]) => (
                  <div key={filePath} className="mb-3">
                    <div className="flex items-center gap-2 px-2 py-1 text-sm text-gray-300 font-medium min-w-0">
                      <File className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="truncate min-w-0">{filePath}</span>
                      <span className="text-xs text-gray-500">({matches.length})</span>
                    </div>
                    <div className="space-y-0.5">
                      {matches.map((match) => (
                        <div
                          key={`${match.filePath}-${match.line}`}
                          onClick={() => handleMatchSelect(match, match.matchIndex)}
                          className={`px-2 py-1.5 ml-6 cursor-pointer rounded text-xs hover:bg-[#21262d] transition-colors ${
                            selectedMatchIndex === match.matchIndex
                              ? 'bg-blue-600/20 border-l-2 border-blue-500'
                              : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-gray-300 truncate flex-1">
                              {match.lineContent}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default FileExplorer;
