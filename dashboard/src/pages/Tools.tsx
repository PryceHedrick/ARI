import { useQuery } from '@tanstack/react-query';
import { getTools } from '../api/client';

export function Tools() {
  const { data: tools, isLoading } = useQuery({
    queryKey: ['tools'],
    queryFn: getTools,
    refetchInterval: 30000,
  });

  const groupedTools = tools?.reduce(
    (acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = [];
      }
      acc[tool.category].push(tool);
      return acc;
    },
    {} as Record<string, typeof tools>,
  );

  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Tool Registry</h1>

      {isLoading ? (
        <div className="text-gray-400">Loading tools...</div>
      ) : !tools || tools.length === 0 ? (
        <div className="rounded border border-gray-700 bg-gray-800 p-6 text-center text-gray-400">
          No tools registered
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTools || {}).map(([category, categoryTools]) => (
            <section key={category}>
              <h2 className="mb-4 text-xl font-semibold capitalize">
                {category}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="rounded-lg border border-gray-700 bg-gray-800 p-4"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="font-semibold text-white">{tool.name}</h3>
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          tool.enabled
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {tool.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>

                    <p className="mb-3 text-sm text-gray-400">
                      {tool.description}
                    </p>

                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded bg-blue-900/50 px-2 py-1 text-xs text-blue-300">
                        {tool.trustLevel}
                      </span>
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          tool.permissionTier === 'READ'
                            ? 'bg-green-900/50 text-green-300'
                            : tool.permissionTier === 'WRITE'
                              ? 'bg-yellow-900/50 text-yellow-300'
                              : 'bg-red-900/50 text-red-300'
                        }`}
                      >
                        {tool.permissionTier}
                      </span>
                    </div>

                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-gray-400">
                        Executions: {tool.executionCount}
                      </span>
                      {tool.errorCount > 0 && (
                        <span className="text-red-400">
                          Errors: {tool.errorCount}
                        </span>
                      )}
                    </div>

                    {tool.lastUsed && (
                      <div className="mt-2 font-mono text-xs text-gray-500">
                        Last used: {new Date(tool.lastUsed).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
