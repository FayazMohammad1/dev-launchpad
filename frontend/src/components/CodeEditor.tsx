import Editor from '@monaco-editor/react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CodeEditorProps {
  file: string;
}

const fileContents: Record<string, string> = {
  'src/App.tsx': `import { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import './styles/globals.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <Header />
      <div className="container">
        <Sidebar />
        <main className="main-content">
          <h1>Welcome to Your App</h1>
          <p>Count: {count}</p>
          <button onClick={() => setCount(count + 1)}>
            Increment
          </button>
        </main>
      </div>
    </div>
  );
}

export default App;`,
  'src/components/App.tsx': `import { useState, useEffect } from 'react';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app-container">
      <h1>Dashboard</h1>
      <div className="data-grid">
        {data.map((item) => (
          <div key={item.id} className="data-card">
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;`,
  'src/components/Header.tsx': `interface HeaderProps {
  title?: string;
}

function Header({ title = 'My Application' }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-content">
        <h1>{title}</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </header>
  );
}

export default Header;`,
  'src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
  'package.json': `{
  "name": "my-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.2"
  }
}`,
};

function CodeEditor({ file }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const content = fileContents[file] || '// File content not available';
  const language = file.endsWith('.tsx') || file.endsWith('.ts') ? 'typescript' :
                   file.endsWith('.json') ? 'json' :
                   file.endsWith('.css') ? 'css' : 'plaintext';

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pathParts = file.split('/');

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d]">
        <div className="flex items-center gap-2 text-sm">
          {pathParts.map((part, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-600">›</span>}
              <span className={index === pathParts.length - 1 ? 'text-white' : 'text-gray-500'}>
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
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={content}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            readOnly: false,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
}

export default CodeEditor;
