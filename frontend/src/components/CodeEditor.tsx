import Editor from "@monaco-editor/react";
import { Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface CodeEditorProps {
  file: string;
  files?: Record<string, string> | null;
  onContentChange?: (path: string, content: string) => void;
}

function CodeEditor({ file, files, onContentChange }: CodeEditorProps) {
  const [content, setContent] = useState<string>(
    (files && files[file]) || ""
  );
  const [copied, setCopied] = useState(false);

  // Load content when file changes
  useEffect(() => {
    setContent((files && files[file]) || "");
  }, [file, files]);

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

  // TODO: need to add html, css files
  const language =
    file.endsWith(".tsx") || file.endsWith(".ts")
      ? "typescript"
      : file.endsWith(".json")
      ? "json"
      : file.endsWith(".css")
      ? "css"
      : "plaintext";

  const pathParts = file.split("/");

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d]">
        <div className="flex items-center gap-2 text-sm">
          {pathParts.map((part, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-600">›</span>}
              <span
                className={
                  index === pathParts.length - 1
                    ? "text-white"
                    : "text-gray-500"
                }
              >
                {part}
              </span>
            </span>
          ))}
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
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={content}
          theme="vs-dark"
          onChange={handleChange}
          options={{
            minimap: { enabled: true },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: true,
            automaticLayout: true,
            tabSize: 2,
            readOnly: false,
            wordWrap: "on",
          }}
          beforeMount={(monaco) => {
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
          }}
        />
      </div>
    </div>
  );
}

export default CodeEditor;
