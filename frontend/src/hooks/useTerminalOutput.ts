import { useState, useCallback, useEffect, useRef } from 'react';
import { detectFileErrors } from './useFileValidator';

export function useTerminalOutput(projectFiles: Record<string, string> | null) {
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '$ npm install',
    'added 289 packages in 2s',
    '',
    '65 packages are looking for funding',
    '  run `npm fund` for details',
    '',
    '$ npm run dev',
    '',
    '> vite-react-typescript-starter@0.0.0 dev',
    '> vite',
    '',
    '  VITE v5.4.8  ready in 791 ms',
    '',
    '  ➜  Local:   http://localhost:5173/',
    '  ➜  Network: use --host to expose',
    '  ➜  press h + enter to show help',
  ]);

  const previousFilesRef = useRef<Record<string, string> | null>(null);
  const fileChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<{ key: string; count: number } | null>(null);
  const lastErrorsRef = useRef<string>('');

  const addTerminalLine = useCallback((line: string) => {
    setTerminalOutput((prev) => [...prev, line]);
  }, []);

  const clearTerminal = useCallback(() => {
    setTerminalOutput([]);
  }, []);

  // Watch for file changes and errors
  useEffect(() => {
    if (!projectFiles) return;

    // Get current file keys
    const currentFiles = new Set(Object.keys(projectFiles || {}));
    const previousFiles = new Set(Object.keys(previousFilesRef.current || {}));

    // Find changes
    const changedFiles: string[] = [];
    const newFiles: string[] = [];
    const deletedFiles: string[] = [];

    currentFiles.forEach((file) => {
      if (!previousFiles.has(file)) {
        newFiles.push(file);
      } else if (projectFiles[file] !== previousFilesRef.current?.[file]) {
        changedFiles.push(file);
      }
    });

    previousFiles.forEach((file) => {
      if (!currentFiles.has(file)) {
        deletedFiles.push(file);
      }
    });

    // Clear existing timeout
    if (fileChangeTimeoutRef.current) {
      clearTimeout(fileChangeTimeoutRef.current);
    }

    // Add a slight delay to batch rapid changes
    if (changedFiles.length > 0 || newFiles.length > 0 || deletedFiles.length > 0) {
      fileChangeTimeoutRef.current = setTimeout(() => {
        const timestamp = new Date().toLocaleTimeString();

        // Format Vite-like HMR update messages
        const updates = [
          ...changedFiles.map((f) => `${f}`),
          ...newFiles.map((f) => `${f} (new)`),
          ...deletedFiles.map((f) => `${f} (deleted)`),
        ];

        if (updates.length > 0) {
          const updateKey = updates.join(', ');
          setTerminalOutput((prev) => {
            const last = lastUpdateRef.current;
            let newOutput = [...prev];

            if (last && last.key === updateKey && prev.length > 0) {
              const nextCount = last.count + 1;
              lastUpdateRef.current = { key: updateKey, count: nextCount };
              const updatedLine = `${timestamp} [vite] hmr update ${updateKey} (x${nextCount})`;
              newOutput = [...prev.slice(0, -1), updatedLine];
            } else {
              lastUpdateRef.current = { key: updateKey, count: 1 };
              newOutput = [...prev, `${timestamp} [vite] hmr update ${updateKey}`];
            }

            // Check for errors in changed files
            const allErrors: { file: string; errors: any[] }[] = [];
            changedFiles.forEach((file) => {
              const content = projectFiles[file];
              const errors = detectFileErrors(file, content);
              if (errors.length > 0) {
                allErrors.push({ file, errors });
              }
            });

            if (allErrors.length > 0) {
              // Only show the first error from the first file to avoid cascading errors
              const firstFileErrors = allErrors[0];
              const firstError = firstFileErrors.errors[0];

              const errorKey = `${firstFileErrors.file}:${firstError.line}:${firstError.column}`;

              if (lastErrorsRef.current !== errorKey) {
                lastErrorsRef.current = errorKey;
                newOutput.push('');
                newOutput.push(
                  `${timestamp} [vite] Internal server error: ${firstFileErrors.file}: ${firstError.message}`
                );

                // Add context lines
                const lines = projectFiles[firstFileErrors.file].split('\n');
                const startLine = Math.max(0, firstError.line - 3);
                const endLine = Math.min(lines.length, firstError.line + 2);

                for (let i = startLine; i < endLine; i++) {
                  const lineNum = i + 1;
                  const lineContent = lines[i];
                  const linePrefix = `${lineNum} | `;

                  if (lineNum === firstError.line) {
                    newOutput.push(`> ${linePrefix}${lineContent}`);
                    newOutput.push(
                      `  ${' '.repeat(linePrefix.length - 2)}${' '.repeat(
                        firstError.column - 1
                      )}^`
                    );
                  } else {
                    newOutput.push(`  ${linePrefix}${lineContent}`);
                  }
                }

                newOutput.push('');
                newOutput.push(`  Plugin: vite:react-babel`);
                newOutput.push(`  File: ${firstFileErrors.file}:${firstError.line}:${firstError.column}`);
              }
            } else {
              lastErrorsRef.current = '';
            }

            return newOutput;
          });
        }
      }, 300);
    }

    previousFilesRef.current = projectFiles;

    return () => {
      if (fileChangeTimeoutRef.current) {
        clearTimeout(fileChangeTimeoutRef.current);
      }
    };
  }, [projectFiles]);

  return {
    terminalOutput: terminalOutput,
    addTerminalLine,
    clearTerminal,
  };
}
