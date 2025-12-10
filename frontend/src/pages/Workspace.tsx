import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Code, Database, Settings, Github, Upload, Download } from 'lucide-react';
import JSZip from 'jszip';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import Steps from '../components/Steps';
import FileExplorer from '../components/FileExplorer';
import CodeEditor from '../components/CodeEditor';
import Terminal from '../components/Terminal';
import Preview from '../components/Preview';
import { useWebContainer } from '../hooks/useWebContainer';

interface WorkspaceProps {}

type ViewMode = 'code' | 'preview' | 'database' | 'settings';

function Workspace(_: WorkspaceProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const prompt = (location.state && (location.state as any).prompt) || '';
  const files = (location.state && (location.state as any).files) || null;
  const template = (location.state && (location.state as any).template) || null;
  const chat = (location.state && (location.state as any).chat) || null;

  const [viewMode, setViewMode] = useState<ViewMode>('code');
  const [selectedFile, setSelectedFile] = useState<string>('src/App.tsx');
  const [terminals, setTerminals] = useState<string[]>(['Terminal 1']);

  const { webContainer, bootError } = useWebContainer(files);

  const addTerminal = () => {
    setTerminals([...terminals, `Terminal ${terminals.length + 1}`]);
  };

  const removeTerminal = (index: number) => {
    setTerminals(terminals.filter((_, i) => i !== index));
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleDownload = async () => {
    try {
      const zip = new JSZip();

      if (files) {
        Object.entries(files).forEach(([path, content]) => {
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
        {bootError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117] z-50">
            <div className="max-w-md bg-[#161b22] border border-red-500 rounded-lg p-6">
              <h3 className="text-red-400 font-semibold mb-2">WebContainer Failed to Start</h3>
              <p className="text-gray-300 text-sm mb-4">{bootError}</p>
              <div className="text-gray-400 text-xs space-y-1">
                <p>Possible causes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Network connectivity to StackBlitz CDN blocked</li>
                  <li>Ad blocker or browser extension interference</li>
                  <li>Firewall or corporate proxy restrictions</li>
                  <li>Browser doesn't support WebContainers</li>
                </ul>
                <p className="mt-3">Check the browser console for detailed logs.</p>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors w-full"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        <PanelGroup direction="horizontal">
          
          {/* Left Sidebar */}
          <Panel defaultSize={20} minSize={20} maxSize={20}>
            <div className="h-full bg-[#0d1117] border-r border-[#30363d]">
              <Steps prompt={prompt} files={files} uiPrompts={template?.uiPrompts} chat={chat} />
            </div>
          </Panel>

          {/* <PanelResizeHandle className="w-1 bg-[#30363d] hover:bg-blue-600 transition-colors cursor-col-resize" /> */}

          {/* Right Side - Editor + Preview */}
          <Panel defaultSize={80}>
            <PanelGroup direction="horizontal">
              {viewMode === 'code' && (
                <>
                  <Panel defaultSize={20} minSize={20} maxSize={30}>
                    <div className="h-full bg-[#0d1117] border-r border-[#30363d]">
                      <FileExplorer onFileSelect={setSelectedFile} selectedFile={selectedFile} files={files} />
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
                      <CodeEditor file={selectedFile} files={files} />
                    ) : viewMode === 'database' ? (
                      <div className="h-full flex items-center justify-center text-gray-400">Database view coming soon</div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">Settings view coming soon</div>
                    )}
                  </Panel>

                  {terminals.length > 0 && (
                    <>
                      <PanelResizeHandle className="h-1 bg-[#30363d] hover:bg-blue-600 transition-colors" />

                      <Panel defaultSize={30} minSize={15} maxSize={50}>
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
