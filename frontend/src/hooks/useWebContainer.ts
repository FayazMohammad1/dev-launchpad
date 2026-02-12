import { WebContainer, type FileSystemTree } from '@webcontainer/api';
import { useEffect, useMemo, useState } from 'react';

// ==============================
// Global singleton state
// ==============================
let sharedWebContainer: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;
let bootError: string | null = null;

// Persistent state for optimizations (Bolt-level)
let devServerStarted: boolean = false;
let devServerUrl: string | null = null;
let nodeModulesInstalled: boolean = false;
let lastMountedFiles: Set<string> = new Set();

// ==============================
// File tree builder
// ==============================
function buildFileTree(
  files?: Record<string, string> | null
): FileSystemTree {
  console.log(
    '[buildFileTree] called with files:',
    files ? `${Object.keys(files).length} files` : 'no files'
  );

  const root: FileSystemTree = {};

  if (!files) {
    console.log('[buildFileTree] no files provided');
    return root;
  }

  for (const [fullPath, contents] of Object.entries(files)) {
    // NEVER touch node_modules - Bolt pattern
    if (fullPath.startsWith('node_modules/') || fullPath === 'node_modules') {
      console.log('[buildFileTree] skipping node_modules path:', fullPath);
      continue;
    }

    const parts = fullPath.split('/').filter(Boolean);
    if (parts.length === 0) continue;

    let cursor: FileSystemTree = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;

      if (isLast) {
        cursor[part] = {
          file: { contents },
        };
      } else {
        if (!cursor[part] || !('directory' in cursor[part]!)) {
          cursor[part] = { directory: {} };
        }
        cursor = (cursor[part] as { directory: FileSystemTree }).directory;
      }
    });
  }

  console.log('[buildFileTree] file tree built:', Object.keys(root));
  return root;
}

// ==============================
// Global boot function
// ==============================
function ensureWebContainerBoot(): Promise<WebContainer> {
  if (sharedWebContainer) {
    console.log('[webcontainer] using cached instance');
    return Promise.resolve(sharedWebContainer);
  }

  if (bootPromise) {
    console.log('[webcontainer] boot already in progress');
    return bootPromise;
  }

  console.log('[webcontainer] initiating global boot');

  bootPromise = (async () => {
    try {
      console.log('[webcontainer] crossOriginIsolated:', window.crossOriginIsolated);
      console.log('[webcontainer] isSecureContext:', window.isSecureContext);

      if (!window.crossOriginIsolated) {
        throw new Error(
          'Cross-Origin Isolation not enabled (COOP/COEP required)'
        );
      }

      const start = Date.now();

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('WebContainer.boot() timed out after 60s')),
          60_000
        )
      );

      sharedWebContainer = (await Promise.race([
        WebContainer.boot(),
        timeout,
      ])) as WebContainer;

      console.log(
        `[webcontainer] booted in ${Date.now() - start}ms`
      );

      bootError = null;
      return sharedWebContainer;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'WebContainer boot failed';
      bootError = message;
      console.error('[webcontainer] boot failed:', message);
      throw err;
    }
  })();

  return bootPromise;
}

// ==============================
// React hook
// ==============================
export function useWebContainer(
  files?: Record<string, string> | null
) {
  const [webContainer, setWebContainer] = useState<WebContainer | undefined>(
    sharedWebContainer ?? undefined
  );
  const [bootErrorState, setBootErrorState] = useState<string | null>(
    bootError
  );
  const [isBootReady, setIsBootReady] = useState<boolean>(
    !!sharedWebContainer
  );

  // Boot once globally
  useEffect(() => {
    let cancelled = false;

    ensureWebContainerBoot()
      .then((container) => {
        if (cancelled) return;
        setWebContainer(container);
        setBootErrorState(null);
        setIsBootReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setBootErrorState(
          err instanceof Error ? err.message : 'Boot failed'
        );
        setIsBootReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Build file tree
  const fileTree = useMemo(() => buildFileTree(files), [files]);

  // Write files incrementally when container or files change (Bolt pattern)
  useEffect(() => {
    if (!webContainer) {
      console.log('[useWebContainer] no container yet, skipping file operations');
      return;
    }

    async function writeFiles() {
      try {
        if (!files) {
          console.log('[useWebContainer] no files to write');
          return;
        }

        console.log('[useWebContainer] writing files incrementally (Bolt pattern)');
        const start = Date.now();
        
        const currentFiles = new Set(Object.keys(files).filter(
          path => !path.startsWith('node_modules/') && path !== 'node_modules'
        ));

        // Write new or modified files
        for (const [fullPath, contents] of Object.entries(files)) {
          // Skip node_modules
          if (fullPath.startsWith('node_modules/') || fullPath === 'node_modules') {
            continue;
          }

          try {
            // Ensure parent directory exists
            const parts = fullPath.split('/').filter(Boolean);
            if (parts.length > 1) {
              const dirPath = parts.slice(0, -1).join('/');
              try {
                await webContainer.fs.mkdir(dirPath, { recursive: true });
              } catch {
                // Directory might already exist
              }
            }

            // Write file
            await webContainer.fs.writeFile(fullPath, contents as string);
            console.log('[useWebContainer] wrote file:', fullPath);
          } catch (err) {
            console.error('[useWebContainer] failed to write file:', fullPath, err);
          }
        }

        // Update tracked files
        lastMountedFiles = currentFiles;

        console.log(
          `[useWebContainer] incremental write completed in ${Date.now() - start}ms`
        );

        try {
          const rootFiles = await webContainer.fs.readdir('/');
          console.log('[useWebContainer] root contents:', rootFiles);
        } catch {
          /* ignore */
        }
      } catch (err) {
        console.error('[useWebContainer] file write failed:', err);
      }
    }

    writeFiles();
  }, [webContainer, files]);

  return {
    webContainer,
    bootError: bootErrorState,
    isBootReady,
  };
}

// ==============================
// Dev server state management (Bolt pattern)
// ==============================
export function isDevServerRunning(): boolean {
  return devServerStarted;
}

export function getDevServerUrl(): string | null {
  return devServerUrl;
}

export function setDevServerRunning(running: boolean, url?: string) {
  devServerStarted = running;
  if (url) {
    devServerUrl = url;
  }
  console.log('[webcontainer] dev server state updated:', { running, url });
}

export function isNodeModulesInstalled(): boolean {
  return nodeModulesInstalled;
}

export function setNodeModulesInstalled(installed: boolean) {
  nodeModulesInstalled = installed;
  console.log('[webcontainer] node_modules state updated:', installed);
}
