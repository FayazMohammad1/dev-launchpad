import { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Code, Database, Settings, Github, Upload, Download } from 'lucide-react';
import JSZip from 'jszip';
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels';

import Steps from '../components/Steps';
import FileExplorer from '../components/FileExplorer';
import CodeEditor from '../components/CodeEditor';
import Terminal from '../components/Terminal';
import Preview from '../components/Preview';
import { useWebContainer } from '../hooks/useWebContainer';
import parseBoltArtifact from '../lib/boltParser';
import { CHAT_URL } from '../lib/config';

interface WorkspaceProps {}

type ViewMode = 'code' | 'preview' | 'database' | 'settings';

type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

const EXPLORER_COLLAPSE_THRESHOLD = 8;
const TERMINAL_COLLAPSE_THRESHOLD = 8;

function Workspace(_: WorkspaceProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const prompt = (location.state && (location.state as any).prompt) || '';
  const initialFiles = (location.state && (location.state as any).files) || null;
  const template = (location.state && (location.state as any).template) || null;
  const chat = (location.state && (location.state as any).chat) || null;

  const [viewMode, setViewMode] = useState<ViewMode>('code');
  const [selectedFile, setSelectedFile] = useState<string>('src/App.tsx');
  const [terminals, setTerminals] = useState<string[]>(['Terminal 1']);
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>(
    () => initialFiles || {}
  );
  const explorerPanelRef = useRef<ImperativePanelHandle | null>(null);
  const terminalPanelRef = useRef<ImperativePanelHandle | null>(null);
  const [lastExplorerSize, setLastExplorerSize] = useState<number>(22);
  const [lastTerminalSize, setLastTerminalSize] = useState<number>(30);

  const initialMessages = useMemo<ChatMessage[]>(() => {
    const seeded: ChatMessage[] = [];

    if (Array.isArray(template?.prompts)) {
      template.prompts.forEach((p: any) => {
        seeded.push({ role: 'user', content: String(p) });
      });
    }

    if (prompt) {
      seeded.push({ role: 'user', content: String(prompt) });
    }

    if (chat?.response || chat?.text) {
      seeded.push({ role: 'model', content: String(chat.response || chat.text || '') });
    }

    return seeded;
  }, [chat, prompt, template?.prompts]);

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const { webContainer, bootError } = useWebContainer(projectFiles);

  // Log boot issues to console only (UI overlay disabled per request)
  useEffect(() => {
    if (bootError) {
      console.error('WebContainer boot error:', bootError);
    }
  }, [bootError]);

  const addTerminal = () => {
    setTerminals([...terminals, `Terminal ${terminals.length + 1}`]);
  };

  const removeTerminal = (index: number) => {
    setTerminals(terminals.filter((_, i) => i !== index));
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleFileChange = (path: string, content: string) => {
    setProjectFiles((prev) => ({ ...prev, [path]: content }));
  };

  const handleSendFollowUp = async (text: string): Promise<boolean> => {
    const trimmed = text.trim();
    if (!trimmed) return false;

    const pendingUser: ChatMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, pendingUser];
    setMessages(nextMessages);
    setSending(true);
    setChatError(null);

    try {
      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Chat request failed');
      }

      const modelMessage: ChatMessage = {
        role: 'model',
        content: String(data?.response || data?.text || ''),
      };

      setMessages((prev) => [...prev, modelMessage]);

      const newFiles = parseBoltArtifact(modelMessage.content || '');
      if (Object.keys(newFiles).length > 0) {
        setProjectFiles((prev) => ({ ...prev, ...newFiles }));
      }

      return true;
    } catch (error: any) {
      setChatError(error?.message || 'Failed to send message');
      return false;
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async () => {
    try {
      const zip = new JSZip();

      if (projectFiles) {
        Object.entries(projectFiles).forEach(([path, content]) => {
          zip.file(path, content as string);
        });
      }

      const blob = await zip.generateAsync({ type: 'blob' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project.zip';

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
    }
  };

  return (
    <div className="h-screen bg-[#0d1117] flex flex-col">
      {/* Top Bar */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded flex items-center gap-2 transition-colors ${
                viewMode === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>

            <button
              onClick={() => setViewMode('code')}
              className={`px-3 py-1.5 rounded flex items-center gap-2 transition-colors ${
                viewMode === 'code'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code className="w-4 h-4" />
              Code
            </button>

            <button
              onClick={() => setViewMode('database')}
              className={`px-3 py-1.5 rounded flex items-center gap-2 transition-colors ${
                viewMode === 'database'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              Database
            </button>

            <button
              onClick={() => setViewMode('settings')}
              className={`px-3 py-1.5 rounded flex items-center gap-2 transition-colors ${
                viewMode === 'settings'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors flex items-center gap-2">
            <Github className="w-4 h-4" />
            GitHub
          </button>

          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          <button className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Publish
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* bootError overlay intentionally disabled; check console logs instead */}
        <PanelGroup direction="horizontal">
          
          {/* Left Sidebar */}
          <Panel defaultSize={25} minSize={25} maxSize={25}>
            <div className="h-full bg-[#0d1117] border-r border-[#30363d]">
              <Steps
                prompt={prompt}
                files={projectFiles}
                uiPrompts={template?.uiPrompts}
                chat={chat}
                messages={messages}
                sending={sending}
                error={chatError}
                onSendMessage={handleSendFollowUp}
              />
            </div>
          </Panel>

          {/* <PanelResizeHandle className="w-1 bg-[#30363d] hover:bg-blue-600 transition-colors cursor-col-resize" /> */}

          {/* Right Side - Editor + Preview */}
          <Panel defaultSize={80}>
            <PanelGroup direction="horizontal">
              {viewMode === 'code' && (
                <>
                  <Panel
                    ref={explorerPanelRef}
                    defaultSize={22}
                    minSize={EXPLORER_COLLAPSE_THRESHOLD}
                    maxSize={32}
                    collapsible
                    collapsedSize={0}
                    onResize={(size) => {
                      if (size <= EXPLORER_COLLAPSE_THRESHOLD) {
                        explorerPanelRef.current?.collapse();
                        return;
                      }
                      setLastExplorerSize(size);
                    }}
                    onExpand={() => {
                      explorerPanelRef.current?.resize(lastExplorerSize || 22);
                    }}
                  >
                    <div className="h-full bg-[#0d1117] border-r border-[#30363d]">
                      <FileExplorer
                        onFileSelect={setSelectedFile}
                        selectedFile={selectedFile}
                        files={projectFiles}
                      />
                    </div>
                  </Panel>

                  <PanelResizeHandle className="w-1 bg-[#30363d] hover:bg-blue-600 transition-colors cursor-col-resize" />
                </>
              )}

              <Panel defaultSize={80}>
                <PanelGroup direction="vertical">
                  <Panel defaultSize={70} minSize={30}>
                    {viewMode === 'preview' ? (
                      <Preview webContainer={webContainer} />
                    ) : viewMode === 'code' ? (
                      <CodeEditor
                        file={selectedFile}
                        files={projectFiles}
                        onContentChange={handleFileChange}
                        onFileSelect={setSelectedFile}
                      />
                    ) : viewMode === 'database' ? (
                      <div className="h-full flex items-center justify-center text-gray-400">Database view coming soon</div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">Settings view coming soon</div>
                    )}
                  </Panel>

                  {terminals.length > 0 && (
                    <>
                      <PanelResizeHandle className="h-1 bg-[#30363d] hover:bg-blue-600 transition-colors" />

                      <Panel
                        ref={terminalPanelRef}
                        defaultSize={30}
                        minSize={TERMINAL_COLLAPSE_THRESHOLD}
                        maxSize={50}
                        collapsible
                        collapsedSize={0}
                        onResize={(size) => {
                          if (size <= TERMINAL_COLLAPSE_THRESHOLD) {
                            terminalPanelRef.current?.collapse();
                            return;
                          }
                          setLastTerminalSize(size);
                        }}
                        onExpand={() => {
                          terminalPanelRef.current?.resize(lastTerminalSize || 30);
                        }}
                      >
                        <Terminal
                          terminals={terminals}
                          onAddTerminal={addTerminal}
                          onRemoveTerminal={removeTerminal}
                        />
                      </Panel>
                    </>
                  )}
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default Workspace;
