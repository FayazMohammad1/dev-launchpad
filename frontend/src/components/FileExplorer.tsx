import { useState } from 'react';
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
}

function FileExplorer({ onFileSelect, selectedFile }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['src', 'src/components', 'src/styles'])
  );
  const [searchQuery, setSearchQuery] = useState('');

  const fileStructure: FileNode[] = [
    {
      name: 'src',
      type: 'folder',
      path: 'src',
      children: [
        {
          name: 'components',
          type: 'folder',
          path: 'src/components',
          children: [
            { name: 'App.tsx', type: 'file', path: 'src/components/App.tsx' },
            { name: 'Header.tsx', type: 'file', path: 'src/components/Header.tsx' },
            { name: 'Sidebar.tsx', type: 'file', path: 'src/components/Sidebar.tsx' },
            { name: 'Button.tsx', type: 'file', path: 'src/components/Button.tsx' },
          ],
        },
        {
          name: 'styles',
          type: 'folder',
          path: 'src/styles',
          children: [
            { name: 'globals.css', type: 'file', path: 'src/styles/globals.css' },
            { name: 'theme.css', type: 'file', path: 'src/styles/theme.css' },
          ],
        },
        {
          name: 'utils',
          type: 'folder',
          path: 'src/utils',
          children: [
            { name: 'helpers.ts', type: 'file', path: 'src/utils/helpers.ts' },
            { name: 'constants.ts', type: 'file', path: 'src/utils/constants.ts' },
          ],
        },
        { name: 'main.tsx', type: 'file', path: 'src/main.tsx' },
        { name: 'App.tsx', type: 'file', path: 'src/App.tsx' },
      ],
    },
    {
      name: 'public',
      type: 'folder',
      path: 'public',
      children: [
        { name: 'favicon.ico', type: 'file', path: 'public/favicon.ico' },
        { name: 'logo.svg', type: 'file', path: 'public/logo.svg' },
      ],
    },
    { name: 'package.json', type: 'file', path: 'package.json' },
    { name: 'tsconfig.json', type: 'file', path: 'tsconfig.json' },
    { name: 'vite.config.ts', type: 'file', path: 'vite.config.ts' },
  ];

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

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
  const getExpandedFromMatches = (nodes: FileNode[], q: string, parentPath = ''): Set<string> => {
    const s = new Set<string>();
    if (!q.trim()) return s;
    for (const n of nodes) {
      const path = parentPath ? `${parentPath}/${n.name}` : n.path;
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
