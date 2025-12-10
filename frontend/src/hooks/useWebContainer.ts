import { WebContainer, type FileSystemTree } from '@webcontainer/api';
import { useEffect, useMemo, useState } from 'react';

function buildFileTree(files?: Record<string, string> | null): FileSystemTree {
    console.log('[buildFileTree] called with files:', files ? Object.keys(files).length + ' files' : 'no files');
    const root: FileSystemTree = {};
    if (!files) {
        console.log('[buildFileTree] no files provided, returning empty tree');
        return root;
    }

    console.log('[buildFileTree] processing files:', Object.keys(files));
    for (const [fullPath, contents] of Object.entries(files)) {
        console.log(`[buildFileTree] processing file: ${fullPath} (${contents.length} chars)`);
        const parts = fullPath.split('/').filter(Boolean);
        if (parts.length === 0) {
            console.log(`[buildFileTree] skipping empty path`);
            continue;
        }

        let cursor: FileSystemTree = root;

        parts.forEach((part, idx) => {
            const isLast = idx === parts.length - 1;
            if (isLast) {
                console.log(`[buildFileTree]   adding file: ${part}`);
                cursor[part] = { file: { contents } };
            } else {
                console.log(`[buildFileTree]   adding directory: ${part}`);
                if (!cursor[part] || !('directory' in cursor[part]!)) {
                    cursor[part] = { directory: {} };
                }
                cursor = (cursor[part] as { directory: FileSystemTree }).directory;
            }
        });
    }

    console.log('[buildFileTree] file tree built successfully, root keys:', Object.keys(root));
    return root;
}

export function useWebContainer(files?: Record<string, string> | null) {
    const [webContainer, setWebContainer] = useState<WebContainer>();
    const [bootError, setBootError] = useState<string | null>(null);

    // Boot webcontainer once
    useEffect(() => {
        console.log('[webcontainer] boot effect triggered');
        console.log('[webcontainer] checking cross-origin isolation...');
        console.log('[webcontainer] crossOriginIsolated:', window.crossOriginIsolated);
        console.log('[webcontainer] isSecureContext:', window.isSecureContext);
        
        if (!window.crossOriginIsolated) {
            const errorMsg = 'Cross-Origin Isolation not enabled';
            console.error('[webcontainer] CRITICAL:', errorMsg);
            console.error('[webcontainer] WebContainer requires COOP and COEP headers to be set');
            console.error('[webcontainer] Check vite.config.ts server.headers configuration');
            setBootError(errorMsg);
            return;
        }
        
        let cancelled = false;
        let bootTimeout: NodeJS.Timeout;
        let retryCount = 0;
        const MAX_RETRIES = 3;

        async function boot() {
            try {
                console.log('[webcontainer] ===== BOOT ATTEMPT', retryCount + 1, 'of', MAX_RETRIES, '=====');
                console.log('[webcontainer] ===== BOOT ATTEMPT', retryCount + 1, 'of', MAX_RETRIES, '=====');
                console.log('[webcontainer] calling WebContainer.boot()...');
                console.log('[webcontainer] this may take 10-30 seconds on first load...');
                console.log('[webcontainer] WebContainer will download required assets from StackBlitz CDN...');
                
                const bootStartTime = Date.now();
                
                // Add timeout to detect if boot is hanging
                const bootPromise = WebContainer.boot();
                const timeoutPromise = new Promise((_, reject) => {
                    bootTimeout = setTimeout(() => {
                        reject(new Error(`WebContainer.boot() timed out after 60 seconds (attempt ${retryCount + 1}/${MAX_RETRIES})`));
                    }, 60000);
                });
                
                const webcontainerInstance = await Promise.race([bootPromise, timeoutPromise]) as WebContainer;
                clearTimeout(bootTimeout);
                
                const bootDuration = Date.now() - bootStartTime;
                console.log(`[webcontainer] ✅ WebContainer.boot() completed in ${bootDuration}ms`);
                console.log('[webcontainer] instance created:', !!webcontainerInstance);
                
                if (cancelled) {
                    console.log('[webcontainer] boot cancelled, not setting state');
                    return;
                }
                
                console.log('[webcontainer] boot successful, setting webContainer state');
                setWebContainer(webcontainerInstance);
                setBootError(null);
                console.log('[webcontainer] ✅ WebContainer ready for use!');
            } catch (error) {
                console.error('[webcontainer] ===== BOOT FAILED =====');
                console.error('[webcontainer] attempt', retryCount + 1, 'of', MAX_RETRIES, 'failed');
                console.error('[webcontainer] error:', error);
                console.error('[webcontainer] error details:', {
                    message: error instanceof Error ? error.message : 'unknown',
                    stack: error instanceof Error ? error.stack : 'no stack',
                    attempt: retryCount + 1
                });
                
                // Retry logic
                if (retryCount < MAX_RETRIES - 1 && !cancelled) {
                    retryCount++;
                    const retryDelay = 2000 * retryCount; // Exponential backoff: 2s, 4s
                    console.log(`[webcontainer] ⏳ retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
                    setTimeout(() => {
                        if (!cancelled) boot();
                    }, retryDelay);
                } else {
                    const errorMsg = error instanceof Error ? error.message : 'WebContainer boot failed';
                    setBootError(errorMsg);
                    console.error('[webcontainer] ❌ All retry attempts exhausted');
                    console.error('[webcontainer] Possible issues:');
                    console.error('[webcontainer]   1. Network access to StackBlitz CDN blocked');
                    console.error('[webcontainer]   2. Ad blocker or browser extension interference');
                    console.error('[webcontainer]   3. Browser doesn\'t support WebContainers (Chrome 102+, Edge 102+, Safari 16.4+)');
                    console.error('[webcontainer]   4. GitHub Codespaces network restrictions');
                    console.error('[webcontainer]   5. Firewall or corporate proxy blocking stackblitz.com');
                }
            }
        }

        boot();

        return () => {
            console.log('[webcontainer] boot effect cleanup, setting cancelled=true');
            cancelled = true;
            if (bootTimeout) clearTimeout(bootTimeout);
        };
    }, []);

    const fileTree = useMemo(() => buildFileTree(files), [files]);

    // Mount files whenever they change
    useEffect(() => {
        console.log('[webcontainer] mount effect triggered, webContainer exists:', !!webContainer);
        console.log('[webcontainer] fileTree keys:', Object.keys(fileTree));
        
        if (!webContainer) {
            console.log('[webcontainer] no webContainer instance, skipping mount');
            return;
        }

        const instance = webContainer;

        async function mountFiles() {
            try {
                const topLevel = Object.keys(fileTree);
                console.log('[webcontainer] starting mount with top-level entries:', topLevel);
                console.log('[webcontainer] full fileTree structure:', JSON.stringify(fileTree, null, 2));
                
                const mountStart = Date.now();
                await instance.mount(fileTree);
                const mountDuration = Date.now() - mountStart;
                
                console.log(`[webcontainer] mount complete in ${mountDuration}ms`);
                console.log('[webcontainer] verifying mounted files...');
                
                // Try to read a file to verify mount
                try {
                    const files = await instance.fs.readdir('/');
                    console.log('[webcontainer] root directory contents:', files);
                } catch (readError) {
                    console.warn('[webcontainer] could not read root directory:', readError);
                }
            } catch (error) {
                console.error('[webcontainer] mount failed with error:', error);
                console.error('[webcontainer] mount error details:', {
                    message: error instanceof Error ? error.message : 'unknown',
                    stack: error instanceof Error ? error.stack : 'no stack'
                });
            }
        }

        mountFiles();
    }, [webContainer, fileTree]);

    return { webContainer, bootError };
}