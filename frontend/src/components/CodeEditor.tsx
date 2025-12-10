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
        />
      </div>
    </div>
  );
}

export default CodeEditor;
