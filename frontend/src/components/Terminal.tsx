import { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  output: string[];
}

function Terminal({ output }: TerminalProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (scrollContainerRef.current) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      });
    }
  }, [output]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] border-t border-[#3e3e42]">
      {/* Terminal Header */}
      <div className="flex items-center bg-[#252526] border-b border-[#3e3e42] px-4 py-2">
        <TerminalIcon className="w-4 h-4 text-gray-400 mr-2" />
        <span className="text-xs text-gray-300 font-medium">TERMINAL</span>
      </div>

      {/* Terminal Output */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed bg-[#1e1e1e]"
      >
        {output.length > 0 ? (
          <div className="text-gray-300 whitespace-pre-wrap break-words">
            {output.map((line, index) => (
              <div key={index}>{renderLine(line)}</div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-xs">Ready for input...</div>
        )}
      </div>
    </div>
  );
}

function renderLine(line: string) {
  const hmrMatch = line.match(/^(\d{2}:\d{2}:\d{2})\s+\[(vite)\]\s+(hmr update)\s+(.+)$/i);
  if (hmrMatch) {
    const [, time, vite, updateLabel, files] = hmrMatch;
    return (
      <span>
        <span className="text-gray-500">{time} </span>
        <span className="text-blue-400">[{vite}] </span>
        <span className="text-green-400">{updateLabel} </span>
        <span className="text-gray-300">{files}</span>
      </span>
    );
  }

  const viteErrorMatch = line.match(
    /^(\d{2}:\d{2}:\d{2})\s+\[(vite)\]\s+Internal server error:\s+(.+?):\s+(.+)$/i
  );
  if (viteErrorMatch) {
    const [, time, vite, file, message] = viteErrorMatch;
    return (
      <span>
        <span className="text-gray-500">{time} </span>
        <span className="text-blue-400">[{vite}] </span>
        <span className="text-red-400">Internal server error: </span>
        <span className="text-gray-300">{file}: </span>
        <span className="text-red-400">{message}</span>
      </span>
    );
  }

  const viteStatusMatch = line.match(/^(\d{2}:\d{2}:\d{2})\s+\[(vite)\]\s+(.+)$/i);
  if (viteStatusMatch) {
    const [, time, vite, message] = viteStatusMatch;
    const isError = message.toLowerCase().includes('error');
    return (
      <span>
        <span className="text-gray-500">{time} </span>
        <span className="text-blue-400">[{vite}] </span>
        <span className={isError ? 'text-red-400' : 'text-gray-300'}>{message}</span>
      </span>
    );
  }

  if (line.trim().startsWith('>') && line.includes('|')) {
    return <span className="text-red-400">{line}</span>;
  }

  if (line.includes('^') && line.trim().length < 50) {
    return <span className="text-red-400">{line}</span>;
  }

  if (line.trim().startsWith('Plugin:') || line.trim().startsWith('File:')) {
    return <span className="text-yellow-400">{line}</span>;
  }

  if (line.includes('warning') || line.startsWith('warn')) {
    return <span className="text-yellow-400">{line}</span>;
  }

  if (line.startsWith('error') || line.startsWith('Error')) {
    return <span className="text-red-400">{line}</span>;
  }

  if (line.trim().startsWith('at ')) {
    return <span className="text-gray-400">{line}</span>;
  }

  if (line.startsWith('$')) {
    return <span className={textGreen}>{line}</span>;
  }

  if (line.includes('➜')) {
    return renderLineWithUrl(line);
  }

  return <span className="text-gray-300">{line}</span>;
}

function renderLineWithUrl(line: string) {
  const urlMatch = line.match(/(https?:\/\/\S+)/i);
  if (!urlMatch) {
    return <span className="text-gray-300">{line}</span>;
  }

  const url = urlMatch[0];
  const [before, after] = line.split(url);

  return (
    <span>
      <span className="text-gray-300">{before}</span>
      <span className="text-blue-400">{url}</span>
      <span className="text-gray-300">{after}</span>
    </span>
  );
}

export default Terminal;
