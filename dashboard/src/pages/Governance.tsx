import { useQuery } from '@tanstack/react-query';
import {
  getProposals,
  getGovernanceRules,
  getQualityGates,
} from '../api/client';

export function Governance() {
  const { data: proposals, isLoading: proposalsLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: getProposals,
    refetchInterval: 15000,
  });

  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['governance', 'rules'],
    queryFn: getGovernanceRules,
  });

  const { data: gates, isLoading: gatesLoading } = useQuery({
    queryKey: ['governance', 'gates'],
    queryFn: getQualityGates,
  });

  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Governance</h1>

      {/* Proposals */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Active Proposals</h2>
        {proposalsLoading ? (
          <div className="text-gray-400">Loading proposals...</div>
        ) : !proposals || proposals.length === 0 ? (
          <div className="rounded border border-gray-700 bg-gray-800 p-6 text-center text-gray-400">
            No active proposals
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="rounded-lg border border-gray-700 bg-gray-800 p-6"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {proposal.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      {proposal.description}
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${
                      proposal.status === 'APPROVED'
                        ? 'bg-green-900/50 text-green-300'
                        : proposal.status === 'REJECTED'
                          ? 'bg-red-900/50 text-red-300'
                          : proposal.status === 'EXPIRED'
                            ? 'bg-gray-700 text-gray-400'
                            : 'bg-yellow-900/50 text-yellow-300'
                    }`}
                  >
                    {proposal.status}
                  </span>
                </div>

                <div className="mb-3 flex gap-4 font-mono text-sm">
                  <div>
                    <span className="text-gray-400">Type: </span>
                    <span className="text-gray-300">{proposal.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Threshold: </span>
                    <span className="text-gray-300">
                      {proposal.threshold * 100}%
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-gray-400">Votes</span>
                    <span className="font-mono text-gray-300">
                      {proposal.votes.approve}/{proposal.votes.total}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-700">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${(proposal.votes.approve / proposal.votes.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between font-mono text-xs text-gray-500">
                  <span>
                    Created: {new Date(proposal.createdAt).toLocaleString()}
                  </span>
                  <span>
                    Expires: {new Date(proposal.expiresAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Constitutional Rules */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Constitutional Rules</h2>
        {rulesLoading ? (
          <div className="text-gray-400">Loading rules...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rules?.map((rule) => (
              <div
                key={rule.id}
                className="rounded-lg border border-gray-700 bg-gray-800 p-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-semibold text-white">{rule.name}</h3>
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      rule.enabled
                        ? 'bg-green-900/50 text-green-300'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {rule.enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="mb-3 text-sm text-gray-400">
                  {rule.description}
                </p>
                <div className="font-mono text-xs text-gray-500">
                  Violations: {rule.violations}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quality Gates */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Quality Gates</h2>
        {gatesLoading ? (
          <div className="text-gray-400">Loading gates...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {gates?.map((gate) => (
              <div
                key={gate.id}
                className="rounded-lg border border-gray-700 bg-gray-800 p-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-semibold text-white">{gate.name}</h3>
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      gate.enabled
                        ? 'bg-green-900/50 text-green-300'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {gate.enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="mb-3 text-sm text-gray-400">
                  {gate.description}
                </p>
                <div className="flex gap-4 font-mono text-xs">
                  <span className="text-green-400">Pass: {gate.passCount}</span>
                  <span className="text-red-400">Fail: {gate.failCount}</span>
                  <span className="text-gray-500">
                    Threshold: {gate.threshold}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
