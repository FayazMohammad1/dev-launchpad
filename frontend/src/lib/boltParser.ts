export function parseBoltArtifact(text: string): Record<string, string> {
  const files: Record<string, string> = {};

  if (!text) return files;

  // Match <boltAction type="file" filePath="...">...</boltAction>
  const fileActionRe = /<boltAction\s+type=\"file\"\s+filePath=\"([^\"]+)\">([\s\S]*?)<\/boltAction>/g;
  let m: RegExpExecArray | null;

  while ((m = fileActionRe.exec(text))) {
    const filePath = m[1];
    let content = m[2] || '';

    // The content may include HTML-escaped entities; try to unescape common ones
    content = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

    // Trim leading/trailing newlines introduced by artifact formatting
    content = content.replace(/^\n+|\n+$/g, '');

    // Many LLMs indent the entire artifact uniformly (e.g., 4 spaces).
    // Remove the common leading whitespace shared by all non-empty lines.
    content = stripUniformIndent(content);

    files[filePath] = content;
  }

  return files;
}

function stripUniformIndent(value: string): string {
  const lines = value.split('\n');
  // Collect leading whitespace for non-empty lines
  const indents: string[] = [];
  for (const line of lines) {
    if (line.trim().length === 0) continue; // ignore blank/whitespace-only lines
    const match = line.match(/^[ \t]*/);
    indents.push(match ? match[0] : '');
  }

  if (indents.length === 0) return value;

  // Find the common prefix among all indent strings
  let prefix = indents[0];
  for (let i = 1; i < indents.length && prefix.length > 0; i++) {
    const cur = indents[i];
    let j = 0;
    const max = Math.min(prefix.length, cur.length);
    while (j < max && prefix[j] === cur[j]) j++;
    prefix = prefix.slice(0, j);
  }

  if (!prefix) return value; // no common indent to remove

  // Remove exactly the common prefix from lines that have it
  const out = lines.map((line) => (line.startsWith(prefix) ? line.slice(prefix.length) : line));
  return out.join('\n');
}

export default parseBoltArtifact;
