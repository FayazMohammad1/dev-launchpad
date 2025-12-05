import { useState } from 'react';
import { ArrowLeft, Eye, Code, Database, Settings, Github, Upload } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Steps from './Steps';
import FileExplorer from './FileExplorer';
import CodeEditor from './CodeEditor';
import Terminal from './Terminal';
import Preview from './Preview';

interface WorkspaceProps {
  prompt: string;
  onBack: () => void;
}

type ViewMode = 'code' | 'preview' | 'database' | 'settings';

function Workspace({ prompt, onBack }: WorkspaceProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('code');
  const [selectedFile, setSelectedFile] = useState<string>('src/App.tsx');
  const [terminals, setTerminals] = useState<string[]>(['Terminal 1']);

  const addTerminal = () => {
    setTerminals([...terminals, `Terminal ${terminals.length + 1}`]);
  };

  const removeTerminal = (index: number) => {
    setTerminals(terminals.filter((_, i) => i !== index));
  };

  return (
    <div className="h-screen bg-[#0d1117] flex flex-col">
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
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
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors flex items-center gap-2">
            <Github className="w-4 h-4" />
            GitHub
          </button>
          <button className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Publish
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full bg-[#0d1117] border-r border-[#30363d]">
              <Steps prompt={prompt} />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#30363d] hover:bg-blue-600 transition-colors" />

          <Panel defaultSize={80}>
            <PanelGroup direction="horizontal">
              {viewMode === 'code' && (
                <>
                  <Panel defaultSize={25} minSize={15} maxSize={40}>
                    <div className="h-full bg-[#0d1117] border-r border-[#30363d]">
                      <FileExplorer onFileSelect={setSelectedFile} selectedFile={selectedFile} />
                    </div>
                  </Panel>

                  <PanelResizeHandle className="w-1 bg-[#30363d] hover:bg-blue-600 transition-colors" />
                </>
              )}

              <Panel defaultSize={75}>
                <PanelGroup direction="vertical">
                  <Panel defaultSize={70} minSize={30}>
                    {viewMode === 'preview' ? (
                      <Preview />
                    ) : viewMode === 'code' ? (
                      <CodeEditor file={selectedFile} />
                    ) : viewMode === 'database' ? (
                      <div className="h-full bg-[#0d1117] flex items-center justify-center">
                        <p className="text-gray-400">Database view coming soon</p>
                      </div>
                    ) : (
                      <div className="h-full bg-[#0d1117] flex items-center justify-center">
                        <p className="text-gray-400">Settings view coming soon</p>
                      </div>
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
