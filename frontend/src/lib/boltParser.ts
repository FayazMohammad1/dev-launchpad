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

    files[filePath] = content;
  }

  return files;
}

export default parseBoltArtifact;
