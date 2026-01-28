import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLog, verifyAuditChain } from '../api/client';
import { AuditEntry as AuditEntryComponent } from '../components/AuditEntry';

export function Audit() {
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const { data: entries, isLoading } = useQuery({
    queryKey: ['audit', limit, offset],
    queryFn: () => getAuditLog({ limit, offset }),
    refetchInterval: 10000,
  });

  const { data: verification, isLoading: verifyLoading } = useQuery({
    queryKey: ['audit', 'verify'],
    queryFn: verifyAuditChain,
    refetchInterval: 30000,
  });

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit));
    }
  };

  const handleNextPage = () => {
    if (entries && entries.length === limit) {
      setOffset(offset + limit);
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Audit Log</h1>

      {/* Chain Verification Status */}
      {!verifyLoading && verification && (
        <div
          className={`mb-6 rounded-lg border p-4 ${
            verification.valid
              ? 'border-green-700 bg-green-900/20'
              : 'border-red-700 bg-red-900/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">
                {verification.valid
                  ? '✓ Hash Chain Valid'
                  : '✗ Hash Chain Broken'}
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                {verification.message}
              </p>
            </div>
            <div className="text-right font-mono text-sm">
              <div className="text-gray-400">Entries: {verification.entryCount}</div>
              {!verification.valid && verification.brokenAt && (
                <div className="text-red-400">
                  Broken at: {verification.brokenAt}
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 font-mono text-xs text-gray-500">
            <div>
              <span className="text-gray-400">Genesis: </span>
              {verification.genesisHash.slice(0, 16)}...
            </div>
            <div>
              <span className="text-gray-400">Latest: </span>
              {verification.lastHash.slice(0, 16)}...
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-400">
            Entries per page:
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setOffset(0);
              }}
              className="ml-2 rounded border border-gray-700 bg-gray-800 px-3 py-1 text-gray-300"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrevPage}
            disabled={offset === 0}
            className="rounded border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={!entries || entries.length < limit}
            className="rounded border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      </div>

      {/* Audit Entries */}
      {isLoading ? (
        <div className="text-gray-400">Loading audit entries...</div>
      ) : !entries || entries.length === 0 ? (
        <div className="rounded border border-gray-700 bg-gray-800 p-6 text-center text-gray-400">
          No audit entries found
        </div>
      ) : (
        <div className="rounded-lg border border-gray-700 bg-gray-800">
          {entries.map((entry) => (
            <AuditEntryComponent key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {entries && entries.length > 0 && (
        <div className="mt-4 text-center font-mono text-sm text-gray-500">
          Showing {offset + 1} - {offset + entries.length}
        </div>
      )}
    </div>
  );
}
