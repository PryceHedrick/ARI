/**
 * Chunking
 *
 * Restructures lists into grouped chunks to fit working memory constraints.
 */

export interface Chunk {
  label: string;
  items: string[];
}

export interface ChunkedInformation {
  chunks: Chunk[];
  totalChunks: number;
  maxItemsPerChunk: number;
}

function makeLabel(items: string[]): string {
  // Simple heuristic label: first meaningful word of first item
  const first = items[0] ?? 'Chunk';
  const word = first.split(/\s+/).find(w => w.length >= 3) ?? 'Chunk';
  return word.replace(/[^a-z0-9_-]/gi, '');
}

export function chunkInformation(items: string[], opts?: { maxPerChunk?: number }): ChunkedInformation {
  const maxPerChunk = Math.max(2, Math.min(6, opts?.maxPerChunk ?? 4));
  const clean = items.map(s => s.trim()).filter(Boolean);

  const chunks: Chunk[] = [];
  for (let i = 0; i < clean.length; i += maxPerChunk) {
    const slice = clean.slice(i, i + maxPerChunk);
    chunks.push({ label: makeLabel(slice), items: slice });
  }

  return {
    chunks,
    totalChunks: chunks.length,
    maxItemsPerChunk: chunks.reduce((m, c) => Math.max(m, c.items.length), 0),
  };
}

