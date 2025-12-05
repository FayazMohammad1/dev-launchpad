import { useState } from 'react';
import { Plus, X, Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  terminals: string[];
  onAddTerminal: () => void;
  onRemoveTerminal: (index: number) => void;
}

function Terminal({ terminals, onAddTerminal, onRemoveTerminal }: TerminalProps) {
  const [activeTab, setActiveTab] = useState(0);

  const terminalOutputs: Record<number, string[]> = {
    0: [
      '$ npm install',
      'Installing dependencies...',
      'added 245 packages in 12s',
      '$ npm run dev',
      'VITE v5.4.2  ready in 432 ms',
      '➜  Local:   http://localhost:5173/',
      '➜  Network: use --host to expose',
    ],
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117] border-t border-[#30363d]">
      <div className="flex items-center bg-[#161b22] border-b border-[#30363d]">
        <div className="flex-1 flex items-center overflow-x-auto">
          {terminals.map((terminal, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 px-3 py-2 border-r border-[#30363d] cursor-pointer ${
                activeTab === index ? 'bg-[#0d1117]' : 'hover:bg-[#21262d]'
              }`}
              onClick={() => setActiveTab(index)}
            >
              <TerminalIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">{terminal}</span>
              {terminals.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTerminal(index);
                    if (activeTab === index && index > 0) {
                      setActiveTab(index - 1);
                    }
                  }}
                  className="hover:text-white text-gray-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onAddTerminal}
          className="px-3 py-2 hover:bg-[#21262d] text-gray-400 hover:text-white transition-colors"
          title="Add new terminal"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {terminalOutputs[activeTab] ? (
          <div className="space-y-1">
            {terminalOutputs[activeTab].map((line, index) => (
              <div
                key={index}
                className={line.startsWith('$') ? 'text-green-400' : 'text-gray-300'}
              >
                {line}
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-green-400">$</span>
              <span className="text-gray-300 animate-pulse">_</span>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span className="animate-pulse">_</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Terminal;
