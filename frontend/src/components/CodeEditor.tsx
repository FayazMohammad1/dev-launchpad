import Editor from "@monaco-editor/react";
import { Copy, Check, ChevronRight, File as FileIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { editor } from 'monaco-editor';

interface CodeEditorProps {
  file: string;
  files?: Record<string, string> | null;
  onContentChange?: (path: string, content: string) => void;
  onFileSelect?: (path: string) => void;
}

interface BreadcrumbItem {
  path: string;
  name: string;
  isFolder: boolean;
}

function CodeEditor({ file, files, onContentChange, onFileSelect }: CodeEditorProps) {
  const [content, setContent] = useState<string>(
    (files && files[file]) || ""
  );
  const [copied, setCopied] = useState(false);
  const [showBreadcrumbDropdown, setShowBreadcrumbDropdown] = useState<number | null>(null);
  const [breadcrumbExpandedPath, setBreadcrumbExpandedPath] = useState<string>("");
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const monacoRef = useRef<any>(null);
  const decorationIdsRef = useRef<string[]>([]);

  // Load content when file changes
  useEffect(() => {
    const newContent = (files && files[file]) || "";
    setContent(newContent);
    
    // Wait for editor to update with new content before handling any pending scroll
    if (editorRef.current && monacoRef.current) {
      // Small delay to ensure editor has rendered the new content
      setTimeout(() => {
        // Trigger a custom event to notify that content is loaded
        window.dispatchEvent(new CustomEvent('editorContentLoaded'));
      }, 50);
    }
  }, [file, files]);

  // Listen for scroll to line events from search
  useEffect(() => {
    const handleScrollToLine = (event: Event) => {
      const customEvent = event as CustomEvent<{ line: number }>;
      const line = customEvent.detail.line;
      
      if (editorRef.current && monacoRef.current) {
        // Scroll to line
        editorRef.current.revealLineInCenter(line);
        
        // Clear previous decorations
        if (decorationIdsRef.current.length > 0) {
          editorRef.current.deltaDecorations(decorationIdsRef.current, []);
        }
        
        // Add new decoration to highlight the line
        const newDecorations = [
          {
            range: monacoRef.current.Range.fromPositions(
              new monacoRef.current.Position(line, 1),
              new monacoRef.current.Position(line, 1000)
            ),
            options: {
              isWholeLine: true,
              className: 'highlighted-line',
              glyphMarginClassName: 'glyph-highlight',
            },
          },
        ];
        
        const decorationIds = editorRef.current.deltaDecorations([], newDecorations);
        decorationIdsRef.current = decorationIds;
      }
    };

    window.addEventListener('scrollToLine', handleScrollToLine);
    return () => window.removeEventListener('scrollToLine', handleScrollToLine);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowBreadcrumbDropdown(null);
      }
    };

    if (showBreadcrumbDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showBreadcrumbDropdown]);

  // Update content on change
  const handleChange = (value: string | undefined) => {
    const updated = value ?? "";
    setContent(updated);
    onContentChange?.(file, updated);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguage = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";

    switch (ext) {
      case "tsx":
      case "ts":
        return "typescript";
      case "json":
        return "json";
      case "jsx":
      case "js":
        return "javascript";
      case "html":
        return "html";
      case "css":
        return "css";
      case "md":
        return "markdown";
      default:
        return "plaintext";
    }
  };

  const language = getLanguage(file);
  const pathParts = file.split("/");

  // Get items at a specific path level
  const getItemsAtPathLevel = (basePath: string): BreadcrumbItem[] => {
    if (!files) return [];
    
    const allPaths = Object.keys(files);
    const items = new Map<string, BreadcrumbItem>();

    allPaths.forEach((fullPath) => {
      const prefix = basePath ? basePath + "/" : "";
      
      if (fullPath.startsWith(prefix)) {
        const remainingPath = basePath ? fullPath.substring(prefix.length) : fullPath;
        const parts = remainingPath.split("/");
        
        if (parts.length > 0) {
          const itemName = parts[0];
          const itemPath = prefix + itemName;
          const isFolder = parts.length > 1;
          
          if (!items.has(itemPath)) {
            items.set(itemPath, {
              path: itemPath,
              name: itemName,
              isFolder,
            });
          }
        }
      }
    });

    return Array.from(items.values()).sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  };

  const handleBreadcrumbClick = (index: number) => {
    const isOpening = showBreadcrumbDropdown !== index;
    setShowBreadcrumbDropdown(isOpening ? index : null);
    // Set the base path for this breadcrumb level
    const basePath = index === 0 ? "" : pathParts.slice(0, index).join("/");
    setBreadcrumbExpandedPath(basePath);
  };

  const handleItemSelect = (itemPath: string, isItemFolder: boolean) => {
    if (isItemFolder) {
      // For folders, expand to show its contents
      setBreadcrumbExpandedPath(itemPath);
    } else if (onFileSelect) {
      // For files, open in editor
      onFileSelect(itemPath);
      setShowBreadcrumbDropdown(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d]">
        <div className="flex items-center gap-0 text-sm relative">
          {pathParts.map((part, index) => {
            // Calculate the base path for this breadcrumb level
            const levelBasePath = index === 0 ? "" : pathParts.slice(0, index).join("/");
            const isDropdownOpen = showBreadcrumbDropdown === index;
            
            // Get items to display based on expanded path or current level
            const currentDisplayPath = isDropdownOpen && breadcrumbExpandedPath !== levelBasePath 
              ? breadcrumbExpandedPath 
              : levelBasePath;
            const displayItems = getItemsAtPathLevel(currentDisplayPath);
            const items = getItemsAtPathLevel(levelBasePath);

            return (
              <div key={index} className="flex items-center relative">
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#21262d] transition-colors ${
                    index === pathParts.length - 1 ? 'text-blue-300 font-medium' : 'text-gray-300'
                  }`}
                >
                  <span className="text-xs">{part}</span>
                  {items.length > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                </button>

                {/* Dropdown for items */}
                {isDropdownOpen && displayItems.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 mt-0.5 bg-[#161b22] border border-[#30363d] rounded shadow-lg z-50 min-w-[250px] max-h-[400px] overflow-y-auto"
                  >
                    {breadcrumbExpandedPath && breadcrumbExpandedPath !== levelBasePath && (
                      <div className="sticky top-0 bg-[#161b22] border-b border-[#30363d] px-2 py-2">
                        <div className="text-xs text-gray-400 truncate">{breadcrumbExpandedPath}</div>
                      </div>
                    )}
                    {displayItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => handleItemSelect(item.path, item.isFolder)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left hover:bg-[#21262d] transition-colors ${
                          file === item.path && !item.isFolder
                            ? 'bg-blue-600/20 border-l-2 border-blue-500 text-blue-300'
                            : 'text-gray-300'
                        }`}
                      >
                        {item.isFolder ? (
                          <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        ) : (
                          <FileIcon className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        )}
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-[#21262d] rounded transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          value={content}
          theme="vs-dark"
          onChange={handleChange}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
          options={{
            minimap: { enabled: true },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: true,
            automaticLayout: true,
            tabSize: 2,
            readOnly: false,
            wordWrap: "on",
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
          }}
          beforeMount={(monaco) => {
            monacoRef.current = monaco;
            
            // Configure TypeScript/JavaScript compiler options
            monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
              target: monaco.languages.typescript.ScriptTarget.ES2020,
              module: monaco.languages.typescript.ModuleKind.ESNext,
              jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
              jsxFactory: "React",
              jsxFragmentFactory: "React.Fragment",
              moduleResolution: monaco.languages.typescript.ModuleResolutionKind.Bundler,
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
              forceConsistentCasingInFileNames: true,
              allowImportingTsExtensions: true,
              lib: ["ES2020", "DOM", "DOM.Iterable"],
            });

            // Add React type definitions
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
              `
                declare namespace React {
                  interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
                    type: T;
                    props: P;
                    key: string | number | null;
                  }
                  type JSXElementConstructor<P> = (props: P & { children?: ReactNode }) => ReactElement<any, any> | null;
                  type ReactNode = ReactElement | string | number | ReactFragment | ReactPortal | boolean | null | undefined;
                  type ReactFragment = {} | Iterable<ReactNode>;
                  type ReactPortal = {
                    $$typeof: symbol;
                    key: null | string | number;
                    children: ReactNode;
                    containerInfo: any;
                    implementation: any;
                  };
                }
              `,
              "file:///node_modules/@types/react/index.d.ts"
            );

            // Add custom CSS for highlighted line
            const style = document.createElement('style');
            style.textContent = `
              .highlighted-line {
                background-color: rgba(120, 140, 160, 0.25) !important;
              }
              .glyph-highlight {
                background-color: rgba(120, 140, 160, 0.3) !important;
              }
            `;
            if (document.head) {
              document.head.appendChild(style);
            }
          }}
        />
        
        {/* Highlighted line indicator removed - using Monaco decorations instead */}
      </div>
    </div>
  );
}

export default CodeEditor;
