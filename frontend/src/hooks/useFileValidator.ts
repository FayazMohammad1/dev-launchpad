export interface FileError {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
  context: string[];
}

export function detectFileErrors(file: string, content: string): FileError[] {
  const errors: FileError[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      continue;
    }

    // Check for arrow functions without opening brace on same or next line
    const arrowFunctionMatch = line.match(/=>\s*$/);
    if (arrowFunctionMatch) {
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      
      // Check if next line starts with { or (
      if (
        nextLine.length > 0 &&
        !nextLine.startsWith('{') &&
        !nextLine.startsWith('(') &&
        nextLine.startsWith('const ') // This is the problem - const instead of {
      ) {
        errors.push({
          file,
          line: i + 2, // Line after the arrow
          column: 1,
          message: "Unexpected token. Expected '{' after '=>'",
          code: 'SYNTAX_ERROR',
          context: [line, nextLine],
        });
        return errors;
      }

      // Check if arrow is followed by something on same line but not {
      const afterArrow = line.substring(arrowFunctionMatch.index! + 2).trim();
      if (afterArrow.length > 0 && !afterArrow.startsWith('{')) {
        // Check if it looks like it should be a block statement
        if (
          afterArrow.startsWith('const ') ||
          afterArrow.startsWith('let ') ||
          afterArrow.startsWith('var ') ||
          afterArrow.startsWith('if ') ||
          afterArrow.startsWith('return ')
        ) {
          errors.push({
            file,
            line: i + 1,
            column: line.indexOf('=>') + 2,
            message: "Unexpected token. Expected '{' after '=>'",
            code: 'SYNTAX_ERROR',
            context: [line],
          });
          return errors;
        }
      }
    }

    // Check for incomplete JSX closing tags
    const unclosedJsxMatch = line.match(/<\w+(?:\s[^>]*)?$/);
    if (unclosedJsxMatch && !line.includes('/>')) {
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      if (!nextLine.includes('>')) {
        const tagName = line.match(/<(\w+)/)?.[1] || 'unknown';
        errors.push({
          file,
          line: i + 1,
          column: line.length,
          message: `Unexpected token. Incomplete opening tag '<${tagName}>'`,
          code: 'SYNTAX_ERROR',
          context: [line],
        });
        return errors;
      }
    }
  }

  // Check for brace mismatches
  let braceCount = 0;
  let bracketCount = 0;
  let parenCount = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      // Handle strings
      if ((char === '"' || char === "'" || char === '`') && (j === 0 || line[j - 1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
        continue;
      }

      if (inString) continue;

      // Skip comments
      if (char === '/' && line[j + 1] === '/') break;

      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;
      else if (char === '(') parenCount++;
      else if (char === ')') parenCount--;

      // Report unmatched closing braces immediately
      if (braceCount < 0) {
        errors.push({
          file,
          line: i + 1,
          column: j + 1,
          message: 'Unexpected token }',
          code: 'SYNTAX_ERROR',
          context: [line],
        });
        return errors;
      }
      if (bracketCount < 0) {
        errors.push({
          file,
          line: i + 1,
          column: j + 1,
          message: 'Unexpected token ]',
          code: 'SYNTAX_ERROR',
          context: [line],
        });
        return errors;
      }
      if (parenCount < 0) {
        errors.push({
          file,
          line: i + 1,
          column: j + 1,
          message: 'Unexpected token )',
          code: 'SYNTAX_ERROR',
          context: [line],
        });
        return errors;
      }
    }
  }

  return errors;
}
