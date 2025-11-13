import { FileCode } from 'lucide-react';

export const SystemViewTab: React.FC = () => {
  return (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="text-center">
        <FileCode size={48} className="mx-auto text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">System View</h3>
        <p className="text-sm text-gray-400">
          Assembled system prompt view coming soon...
        </p>
      </div>
    </div>
  );
};
