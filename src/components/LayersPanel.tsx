import React from 'react';

export interface LayersPanelProps {
  activeTab: 'original' | 'tapered';
  onTabChange: (tab: 'original' | 'tapered') => void;
  onClose: () => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({ activeTab, onTabChange, onClose }) => {
  return (
    <div className="absolute top-0 right-0 h-full w-96 bg-white border-l shadow-lg z-30 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="">Layers</span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-xl">&times;</button>
      </div>
      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 text-center font-semibold ${activeTab === 'original' ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'}`}
          onClick={() => onTabChange('original')}
          type="button"
        >
          Original
        </button>
        <button
          className={`flex-1 py-2 text-center font-semibold ${activeTab === 'tapered' ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'}`}
          onClick={() => onTabChange('tapered')}
          type="button"
        >
          Tapered
        </button>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === 'original' && (
          <div>
            <div className="mb-2 font-semibold">Original Diagram</div>
            {/* More content for original layer can go here */}
          </div>
        )}
        {activeTab === 'tapered' && (
          <div>
            <div className="mb-2 font-semibold">Tapered Diagram</div>
            {/* More content for tapered layer can go here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default LayersPanel;
