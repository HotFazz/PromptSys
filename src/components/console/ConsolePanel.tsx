import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Plus, Upload, FileCode } from 'lucide-react';
import { useOntologyStore } from '../../stores/ontologyStore';
import { AnalyzeTab } from './AnalyzeTab';
import { CreateAgentTab } from './CreateAgentTab';
import { BulkImportTab } from './BulkImportTab';
import { SystemViewTab } from './SystemViewTab';

type TabType = 'analyze' | 'create' | 'import' | 'system';

interface TabConfig {
  id: TabType;
  label: string;
  icon: typeof Sparkles;
  component: React.FC;
}

const tabs: TabConfig[] = [
  { id: 'analyze', label: 'Analyze', icon: Sparkles, component: AnalyzeTab },
  { id: 'create', label: 'Create', icon: Plus, component: CreateAgentTab },
  { id: 'import', label: 'Import', icon: Upload, component: BulkImportTab },
  { id: 'system', label: 'System', icon: FileCode, component: SystemViewTab },
];

export const ConsolePanel: React.FC = () => {
  const { isSidePanelOpen, toggleSidePanel } = useOntologyStore();
  const [activeTab, setActiveTab] = useState<TabType>('analyze');

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || AnalyzeTab;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleSidePanel}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-blue-600 text-white p-2 rounded-r-lg shadow-lg hover:bg-blue-700 transition-colors"
        style={{ left: isSidePanelOpen ? '420px' : '0' }}
        title={isSidePanelOpen ? 'Close console' : 'Open console'}
      >
        {isSidePanelOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Console Panel */}
      <div
        className={`fixed left-0 top-0 h-full bg-gray-900 text-white shadow-2xl transition-transform duration-300 z-40 ${
          isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '420px' }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-700">
            <h2 className="text-xl font-bold">Agent Console</h2>
            <p className="text-xs text-gray-400 mt-1">
              Create, import, and manage your agentic system
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700 bg-gray-800">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 px-3 py-3 text-xs font-medium transition-colors
                    flex items-center justify-center gap-1.5
                    ${isActive
                      ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white hover:bg-gray-750'
                    }
                  `}
                  title={tab.label}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </>
  );
};
