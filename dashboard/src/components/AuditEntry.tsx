import type { AuditEntry as AuditEntryType } from '../types/api';

interface AuditEntryProps {
  entry: AuditEntryType;
}

export function AuditEntry({ entry }: AuditEntryProps) {
  return (
    <div className="border-b border-gray-700 p-4 font-mono text-sm hover:bg-gray-800/50">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded bg-blue-900/50 px-2 py-1 text-xs text-blue-300">
            {entry.agent}
          </span>
          <span className="text-gray-400">{entry.action}</span>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(entry.timestamp).toLocaleString()}
        </span>
      </div>

      {Object.keys(entry.details).length > 0 && (
        <details className="mt-2 cursor-pointer">
          <summary className="text-xs text-gray-400 hover:text-gray-300">
            Details
          </summary>
          <pre className="mt-2 overflow-x-auto rounded bg-gray-900 p-2 text-xs text-gray-300">
            {JSON.stringify(entry.details, null, 2)}
          </pre>
        </details>
      )}

      <div className="mt-2 flex gap-4 text-xs text-gray-600">
        <span title="Previous Hash">
          PREV: {entry.previousHash.slice(0, 12)}...
        </span>
        <span title="Current Hash">HASH: {entry.hash.slice(0, 12)}...</span>
      </div>
    </div>
  );
}
