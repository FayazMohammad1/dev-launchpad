import { WebContainer, type FileSystemTree } from '@webcontainer/api';
import { useEffect, useMemo, useState } from 'react';

// ==============================
// Global singleton state
// ==============================
let sharedWebContainer: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;
let bootError: string | null = null;

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

  // Mount files when container or files change
  useEffect(() => {
    if (!webContainer) {
      console.log('[useWebContainer] no container yet, skipping mount');
      return;
    }

    async function mountFiles() {
      try {
        console.log(
          '[useWebContainer] mounting files:',
          Object.keys(fileTree)
        );

        const start = Date.now();
        await webContainer.mount(fileTree);
        console.log(
          `[useWebContainer] mount completed in ${Date.now() - start}ms`
        );

        try {
          const rootFiles = await webContainer.fs.readdir('/');
          console.log('[useWebContainer] root contents:', rootFiles);
        } catch {
          /* ignore */
        }
      } catch (err) {
        console.error('[useWebContainer] mount failed:', err);
      }
    }

    mountFiles();
  }, [webContainer, fileTree]);

  return {
    webContainer,
    bootError: bootErrorState,
    isBootReady,
  };
}
