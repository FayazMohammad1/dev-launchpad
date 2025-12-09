import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, Search } from 'lucide-react';

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

// TODO: at first i need folders and below that normal files in alphabetical way (3 files are missing package-lock.json, .env, .gitignore)
function FileExplorer({ onFileSelect, selectedFile, files }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set([])
  );
  const [searchQuery, setSearchQuery] = useState('');

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

    // collect top-level nodes (no parent)
    const topLevel = Object.values(map).filter((n) => !n.path.includes('/'));

    return topLevel;
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

  // TODO: need to implement search for files
  const matchesQuery = (name: string, q: string) =>
    name.toLowerCase().includes(q.trim().toLowerCase());

  const filterNodes = (nodes: FileNode[], q: string): FileNode[] => {
    if (!q.trim()) return nodes;
    const out: FileNode[] = [];
    for (const n of nodes) {
      if (n.type === 'file') {
        if (matchesQuery(n.name, q)) out.push(n);
      } else {
        const filteredChildren = n.children ? filterNodes(n.children, q) : [];
        if (matchesQuery(n.name, q) || filteredChildren.length > 0) {
          out.push({ ...n, children: filteredChildren });
        }
      }
    }
    return out;
  };

  // compute auto-expanded folders when searching so matches are visible
  const getExpandedFromMatches = (nodes: FileNode[], q: string, _parentPath = ''): Set<string> => {
    const s = new Set<string>();
    if (!q.trim()) return s;
    for (const n of nodes) {
      if (n.type === 'folder') {
        if (matchesQuery(n.name, q)) {
          s.add(n.path);
        }
        if (n.children) {
          const childSet = getExpandedFromMatches(n.children, q, n.path);
          if (childSet.size > 0) {
            s.add(n.path);
            childSet.forEach((p) => s.add(p));
          }
        }
      }
    }
    return s;
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <div
            onClick={() => toggleFolder(node.path)}
            onMouseDown={(e) => e.preventDefault()}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#21262d] cursor-pointer rounded group select-none"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-400" />
            ) : (
              <Folder className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-sm text-gray-300">{node.name}</span>
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
        className={`flex items-center gap-2 px-2 py-1.5 hover:bg-[#21262d] cursor-pointer rounded ${
          isSelected ? 'bg-[#21262d]' : ''
        }`}
        style={{ paddingLeft: `${depth * 12 + 28}px` }}
      >
        <File className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-300">{node.name}</span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-[#30363d]">
        <div className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 px-2 py-1">
          <span className="text-xs font-semibold text-gray-500 uppercase">Files</span>
        </div>
        {fileStructure.map((node) => renderNode(node))}
      </div>
    </div>
  );
}

export default FileExplorer;
