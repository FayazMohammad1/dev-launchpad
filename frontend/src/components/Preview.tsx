import { RefreshCw, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { WebContainer } from '@webcontainer/api';

interface PreviewProps {
  webContainer?: WebContainer;
  isBootReady?: boolean;
  bootError?: string | null;
}

type InstallPhase = 'waiting' | 'installing' | 'installed' | 'starting-server' | 'server-ready' | 'error';

function Preview({ webContainer, isBootReady = false, bootError }: PreviewProps) {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(bootError || null);
  const [installPhase, setInstallPhase] = useState<InstallPhase>('waiting');
  const [installOutput, setInstallOutput] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const serverReadyUnsubscribeRef = useRef<(() => void) | undefined>();

  // Track install progress
  const addInstallOutput = (line: string) => {
    setInstallOutput((prev) => [...prev.slice(-50), line]); // Keep last 50 lines
  };

  useEffect(() => {
    console.log('[preview] effect triggered, webContainer exists:', !!webContainer, 'isBootReady:', isBootReady, 'bootError:', bootError);
    
    if (bootError) {
      console.log('[preview] boot error detected, marking as error');
      setInstallPhase('error');
      setError(bootError);
      setLoading(false);
      return;
    }

    if (!webContainer || !isBootReady) {
      console.log('[preview] waiting for webContainer to be ready...');
      setInstallPhase('waiting');
      return;
    }

    console.log('[preview] webContainer ready, starting dev server setup');
    const container = webContainer;

    let cancelled = false;

    async function installDependencies() {
      try {
        console.log('[preview] ===== STARTING NPM INSTALL =====');
        console.log('[preview] spawning npm install process...');
        addInstallOutput('📦 Starting npm install...');
        
        // Use npm cache for faster installs
        const installProcess = await container.spawn('npm', ['install', '--prefer-offline', '--no-audit']);
        console.log('[preview] npm install process spawned successfully');

        addInstallOutput('⏳ Installing dependencies...');
        
        // Pipe install output to console and UI
        let lastUpdate = Date.now();
        let installStartTime = Date.now();

        const outputReader = installProcess.output.getReader();
        const textDecoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await outputReader.read();
            if (done) break;
            
            const text = textDecoder.decode(value, { stream: true });
            console.log('[npm install output]', text);
            
            // Update install output every 500ms to avoid too many renders
            const now = Date.now();
            if (now - lastUpdate > 500) {
              addInstallOutput(text.substring(0, 100));
              lastUpdate = now;
            }
          }
        } catch (err) {
          console.warn('[preview] error reading install output:', err);
        }

        console.log('[preview] waiting for install process to exit...');
        const exitCode = await installProcess.exit;
        const installDuration = Date.now() - installStartTime;
        console.log(`[preview] npm install exited with code: ${exitCode} (took ${installDuration}ms)`);
        
        if (exitCode !== 0) {
          addInstallOutput(`❌ npm install failed with code ${exitCode}`);
          throw new Error(`npm install failed with exit code ${exitCode}`);
        }

        addInstallOutput(`✅ Dependencies installed (${Math.round(installDuration / 1000)}s)`);
        return exitCode;
      } catch (err: any) {
        const msg = err?.message || 'Install failed';
        console.error('[preview] install error:', msg);
        addInstallOutput(`❌ Install error: ${msg}`);
        throw err;
      }
    }

    async function startDevServer() {
      try {
        console.log('[preview] ===== STARTING DEV SERVER SETUP =====');
        setLoading(true);
        setError(null);

        console.log('[preview] step 1: checking for package.json...');
        try {
          const packageJson = await container.fs.readFile('package.json', 'utf-8');
          console.log('[preview] package.json found');
          addInstallOutput('✓ package.json found');
        } catch (pkgError) {
          console.error('[preview] package.json not found or unreadable:', pkgError);
          addInstallOutput('⚠ Warning: package.json not found');
        }

        console.log('[preview] step 2: installing dependencies...');
        setInstallPhase('installing');
        const installExitCode = await installDependencies();

        if (installExitCode !== 0) {
          console.error(`[preview] install failed with exit code ${installExitCode}`);
          throw new Error(`npm install failed with exit code ${installExitCode}`);
        }

        console.log('[preview] step 3: npm install successful, spawning dev server...');
        setInstallPhase('starting-server');
        addInstallOutput('🚀 Starting dev server...');
        
        const devProcess = await container.spawn('npm', ['run', 'dev']);
        console.log('[preview] dev server process spawned');

        // Pipe dev server output
        const devReader = devProcess.output.getReader();
        const textDecoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await devReader.read();
            if (done) break;
            
            const text = textDecoder.decode(value, { stream: true });
            console.log('[npm run dev output]', text);
            
            // Show server startup messages
            if (text.includes('VITE') || text.includes('ready') || text.includes('listening')) {
              addInstallOutput(text.substring(0, 100));
            }
          }
        } catch (err) {
          console.warn('[preview] error reading dev server output:', err);
        }

        // Listen for server-ready event
        console.log('[preview] step 4: listening for server-ready event...');
        addInstallOutput('⏳ Waiting for server to be ready...');

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Server ready event timeout (waited 30 seconds)'));
          }, 30000);

          serverReadyUnsubscribeRef.current = container.on('server-ready', (port, serverUrl) => {
            clearTimeout(timeout);
            console.log('[preview] ===== SERVER READY EVENT FIRED =====');
            console.log(`[preview] Port: ${port}`);
            console.log(`[preview] URL: ${serverUrl}`);
            
            addInstallOutput(`✅ Server ready at ${serverUrl}`);
            console.log('[preview] setting URL state and marking loading as false');
            setUrl(serverUrl);
            setLoading(false);
            setInstallPhase('server-ready');
            console.log('[preview] state updated, preview should now show iframe');
            
            resolve();
          });
        });
      } catch (err: any) {
        console.error('[preview] ===== DEV SERVER SETUP FAILED =====');
        console.error('[preview] error:', err);
        console.error('[preview] error message:', err?.message);
        
        const msg = err?.message || 'Failed to start dev server';
        addInstallOutput(`❌ Error: ${msg}`);
        setError(msg);
        setLoading(false);
        setInstallPhase('error');
      }
    }

    if (cancelled) {
      console.log('[preview] effect cancelled, skipping startDevServer');
      return;
    }

    console.log('[preview] calling startDevServer()...');
    startDevServer();

    return () => {
      console.log('[preview] effect cleanup called');
      cancelled = true;
      if (serverReadyUnsubscribeRef.current) {
        console.log('[preview] unsubscribing from server-ready');
        serverReadyUnsubscribeRef.current();
      }
    };
  }, [webContainer, isBootReady, bootError]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleOpenExternal = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d]">
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={handleRefresh}
            disabled={!url}
            className="p-1.5 hover:bg-[#21262d] rounded transition-colors text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5">
            <span className="text-sm text-gray-400">
              {url || 'Waiting for server...'}
            </span>
          </div>
          <button
            onClick={handleOpenExternal}
            disabled={!url}
            className="p-1.5 hover:bg-[#21262d] rounded transition-colors text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white relative overflow-hidden">
        {!url && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117] p-6">
            <div className="flex flex-col items-center gap-4 max-w-md w-full">
              {/* Spinner and Status */}
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <div>
                  <p className="text-white text-sm font-semibold">
                    {installPhase === 'waiting' && 'Initializing WebContainer...'}
                    {installPhase === 'installing' && 'Installing Dependencies...'}
                    {installPhase === 'starting-server' && 'Starting Dev Server...'}
                    {installPhase === 'server-ready' && 'Server Ready!'}
                    {installPhase === 'error' && 'Error Occurred'}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {installPhase === 'waiting' && 'WebContainer is initializing...'}
                    {installPhase === 'installing' && 'npm install in progress...'}
                    {installPhase === 'starting-server' && 'Dev server is starting...'}
                  </p>
                </div>
              </div>

              {/* Install Output Log */}
              {(installPhase === 'installing' || installPhase === 'starting-server' || installPhase === 'error') && (
                <div className="w-full bg-[#161b22] border border-[#30363d] rounded-lg p-3 max-h-64 overflow-y-auto">
                  <div className="space-y-1">
                    {installOutput.length === 0 ? (
                      <p className="text-gray-500 text-xs">Waiting for output...</p>
                    ) : (
                      installOutput.map((line, idx) => (
                        <div key={idx} className="text-xs text-gray-300 font-mono break-words">
                          {line}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && installPhase === 'error' && (
                <div className="w-full bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-xs">{error}</p>
                  </div>
                </div>
              )}

              {/* Progress Info */}
              <div className="w-full text-center">
                <p className="text-gray-500 text-xs">
                  {installPhase === 'waiting' && '⏳ First load may take 10-30 seconds...'}
                  {installPhase === 'installing' && '📦 Installing npm dependencies...'}
                  {installPhase === 'starting-server' && '🚀 Starting Vite dev server...'}
                </p>
              </div>
            </div>
          </div>
        )}

        {url && !loading && (
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full border-0"
            title="Preview"
          />
        )}
      </div>
    </div>
  );
}

export default Preview;
