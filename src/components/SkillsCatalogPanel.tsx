import { Book, Zap, Hash, Tag } from 'lucide-react';
import { useOntologyStore } from '../stores/ontologyStore';
import { PromptNodeType } from '../types';
import { SkillsCatalogGenerator } from '../services/agentServices';

export const SkillsCatalogPanel: React.FC = () => {
  const { nodes, setSelectedNode } = useOntologyStore();

  // Get all skills
  const skills = nodes.filter(n => n.nodeType === PromptNodeType.SKILL);

  // Generate catalog using the service
  const catalog = SkillsCatalogGenerator.generateCatalog(nodes);
  const catalogText = SkillsCatalogGenerator.generateCatalogText(nodes);

  // Calculate total tokens
  const totalSkillTokens = skills.reduce((sum, skill) => {
    return sum + (skill.estimatedTokens || 0);
  }, 0);

  const totalAlwaysLoadedTokens = nodes
    .filter(n => n.invocationStrategy === 'always_loaded')
    .reduce((sum, n) => sum + (n.estimatedTokens || 0), 0);

  const tokenSavings = totalSkillTokens > 0
    ? Math.round((totalSkillTokens / (totalAlwaysLoadedTokens + totalSkillTokens)) * 100)
    : 0;

  // Calculate catalog token cost (approximate: name + summary + triggers)
  const catalogTokens = catalog.entries.reduce((sum, entry) => {
    const nameTokens = Math.ceil(entry.name.length / 4);
    const summaryTokens = Math.ceil(entry.summary.length / 4);
    const triggerTokens = entry.triggers.reduce((s, t) => s + Math.ceil(t.length / 4), 0);
    return sum + nameTokens + summaryTokens + triggerTokens + 10; // +10 for formatting
  }, 50); // +50 for catalog header

  if (skills.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Book size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Skills Available</h3>
        <p className="text-sm text-gray-600">
          Load the agentic demo to see skills with on-demand loading.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Book size={32} />
          <div>
            <h2 className="text-2xl font-bold">Skills Catalog</h2>
            <p className="text-amber-100 text-sm mt-1">
              On-demand capabilities that load only when needed
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-amber-100 text-xs mb-1">Total Skills</p>
            <p className="text-2xl font-bold">{skills.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-amber-100 text-xs mb-1">Total Tokens</p>
            <p className="text-2xl font-bold">{totalSkillTokens.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-amber-100 text-xs mb-1">Token Savings</p>
            <p className="text-2xl font-bold">~{tokenSavings}%</p>
          </div>
        </div>
      </div>

      {/* Catalog Text (as it would appear in system prompt) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Tag size={20} />
          Catalog Text for System Prompt
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          This is the lightweight catalog text that would be embedded in the main system prompt:
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-xs overflow-x-auto">
          <pre className="whitespace-pre-wrap text-gray-700">{catalogText}</pre>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          <strong>Token cost:</strong> {catalogTokens} tokens (vs {totalSkillTokens.toLocaleString()} if all skills were loaded)
        </p>
      </div>

      {/* Skills List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap size={20} />
          Available Skills ({skills.length})
        </h3>

        <div className="space-y-4">
          {catalog.entries.map((entry) => {
            const skill = nodes.find(n => n.id === entry.id);
            if (!skill) return null;

            return (
              <div
                key={entry.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedNode(entry.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{skill.title}</h4>
                    {entry.summary && (
                      <p className="text-sm text-gray-600 italic">"{entry.summary}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-300 font-semibold">
                      SKILL
                    </span>
                    {entry.category && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {entry.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Triggers */}
                {entry.triggers && entry.triggers.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <Zap size={12} />
                      Triggers:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {entry.triggers.map((trigger, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200 font-mono"
                        >
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Load Priority & Tokens */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Hash size={12} />
                      Priority: {entry.loadPriority}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag size={12} />
                      {entry.estimatedTokens.toLocaleString()} tokens
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(entry.id);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How Skills Work</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>On-Demand Loading:</strong> Skills are not included in the main system prompt.
            Instead, a lightweight catalog is embedded showing what skills are available.
          </p>
          <p>
            <strong>Trigger Keywords:</strong> When the conversation contains certain keywords,
            the relevant skill can be loaded dynamically via the <code className="bg-blue-100 px-1 rounded">load_skill()</code> function.
          </p>
          <p>
            <strong>Token Efficiency:</strong> This approach saves ~{tokenSavings}% of tokens compared to
            loading all skills upfront, while maintaining full capability access.
          </p>
          <p>
            <strong>Load Priority:</strong> Skills with higher priority (lower numbers) are loaded first
            when multiple skills match the same triggers.
          </p>
        </div>
      </div>
    </div>
  );
};
