import React from 'react';
import { Clock, Trash2, Play, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { HistoryItem } from '../types';

export const HistoryList: React.FC = () => {
  const { history, removeHistoryItem, setCurrentTask, setTaskStatus, setPrompts } = useStore();

  const handleRestore = (item: HistoryItem) => {
    if (item.promptsObj) {
      setPrompts(item.promptsObj);
    }
    setCurrentTask(item.taskId);
    setTaskStatus(item.status, 100, item.error, item.videoUrl);
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-zinc-800">History</h2>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {history.map((item) => (
          <div key={item.taskId} className="border border-zinc-200 rounded-lg p-3 hover:border-blue-300 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                item.status === 'succeeded' ? 'bg-green-100 text-green-700' :
                item.status === 'failed' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {item.status.toUpperCase()}
              </span>
              <span className="text-xs text-zinc-400">
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </div>
            
            <p className="text-sm text-zinc-700 line-clamp-2 mb-3" title={item.prompt}>
              {item.prompt}
            </p>

            <div className="flex items-center justify-between mt-auto">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleRestore(item)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {item.status === 'succeeded' ? (
                    <><Play className="w-3 h-3" /> View</>
                  ) : (
                    <><RefreshCw className="w-3 h-3" /> Restore</>
                  )}
                </button>
              </div>
              <button 
                onClick={() => removeHistoryItem(item.taskId)}
                className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
