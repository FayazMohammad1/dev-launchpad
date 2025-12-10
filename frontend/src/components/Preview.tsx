import { RefreshCw, ExternalLink, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { WebContainer } from '@webcontainer/api';

interface PreviewProps {
  webContainer?: WebContainer;
}

function Preview({ webContainer }: PreviewProps) {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    console.log('[preview] effect triggered, webContainer exists:', !!webContainer);
    if (!webContainer) {
      console.log('[preview] no webContainer, waiting...');
      return;
    }

    console.log('[preview] webContainer available, starting dev server setup');
    let serverReadyUnsubscribe: (() => void) | undefined;

    async function installDependencies() {
      console.log('[preview] ===== STARTING NPM INSTALL =====');
      console.log('[preview] spawning npm install process...');
      
      const installProcess = await webContainer.spawn('npm', ['install']);
      console.log('[preview] npm install process spawned successfully');

      // Pipe install output to console
      console.log('[preview] piping install output to console...');
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            console.log('[npm install output]', data);
          },
        })
      );

      console.log('[preview] waiting for install process to exit...');
      const exitCode = await installProcess.exit;
      console.log(`[preview] npm install exited with code: ${exitCode}`);
      
      // Wait for install command to exit
      return exitCode;
    }

    async function startDevServer() {
      try {
        console.log('[preview] ===== STARTING DEV SERVER SETUP =====');
        setLoading(true);
        setError(null);

        console.log('[preview] step 1: checking for package.json...');
        try {
          const packageJson = await webContainer.fs.readFile('package.json', 'utf-8');
          console.log('[preview] package.json found:', packageJson.substring(0, 200) + '...');
        } catch (pkgError) {
          console.error('[preview] package.json not found or unreadable:', pkgError);
        }

        console.log('[preview] step 2: installing dependencies...');
        const installExitCode = await installDependencies();

        if (installExitCode !== 0) {
          console.error(`[preview] install failed with exit code ${installExitCode}`);
          throw new Error(`npm install failed with exit code ${installExitCode}`);
        }

        console.log('[preview] step 3: npm install successful, spawning dev server...');
        const devProcess = await webContainer.spawn('npm', ['run', 'dev']);
        console.log('[preview] dev server process spawned');

        // Pipe dev server output
        console.log('[preview] piping dev server output...');
        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              console.log('[npm run dev output]', data);
            },
          })
        );

        // Listen for server-ready event
        console.log('[preview] step 4: listening for server-ready event...');
        serverReadyUnsubscribe = webContainer.on('server-ready', (port, serverUrl) => {
          console.log('[preview] ===== SERVER READY EVENT FIRED =====');
          console.log(`[preview] Port: ${port}`);
          console.log(`[preview] URL: ${serverUrl}`);
          console.log('[preview] setting URL state and marking loading as false');
          setUrl(serverUrl);
          setLoading(false);
          console.log('[preview] state updated, preview should now show iframe');
        });
        
        console.log('[preview] server-ready listener attached');
      } catch (err: any) {
        console.error('[preview] ===== DEV SERVER SETUP FAILED =====');
        console.error('[preview] error:', err);
        console.error('[preview] error message:', err?.message);
        console.error('[preview] error stack:', err?.stack);
        setError(err?.message || 'Failed to start dev server');
        setLoading(false);
      }
    }

    console.log('[preview] calling startDevServer()...');
    startDevServer();

    return () => {
      console.log('[preview] effect cleanup called');
      if (serverReadyUnsubscribe) {
        console.log('[preview] unsubscribing from server-ready');
        serverReadyUnsubscribe();
      }
    };
  }, [webContainer]);

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

      <div className="flex-1 bg-white relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-gray-400 text-sm">Starting development server...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]">
            <div className="flex flex-col items-center gap-3 max-w-md text-center">
              <p className="text-red-400 text-sm">{error}</p>
              <p className="text-gray-500 text-xs">Check the terminal for more details</p>
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
