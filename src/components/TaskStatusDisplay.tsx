import React, { useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, PlaySquare } from 'lucide-react';
import { useStore } from '../store/useStore';

export const TaskStatusDisplay: React.FC = () => {
  const { 
    currentTaskId, taskStatus, taskProgress, taskError, videoUrl,
    setTaskStatus, updateHistoryItem
  } = useStore();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentTaskId && (taskStatus === 'queued' || taskStatus === 'processing')) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/video/status/${currentTaskId}`);
          if (res.ok) {
            const data = await res.json();
            setTaskStatus(data.status, data.progress, data.error, data.video_url);
            
            // Sync with history
            updateHistoryItem(currentTaskId, {
              status: data.status,
              videoUrl: data.video_url,
              error: data.error
            });
            
            if (data.status === 'succeeded' || data.status === 'failed') {
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error('Failed to poll status:', error);
        }
      }, 5000); // Poll every 5s
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentTaskId, taskStatus, setTaskStatus, updateHistoryItem]);

  if (!currentTaskId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 flex flex-col items-center justify-center text-zinc-500 h-64">
        <PlaySquare className="w-12 h-12 mb-3 text-zinc-300" />
        <p>No video generated yet.</p>
        <p className="text-sm mt-1">Fill the parameters and click Generate.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
      <h2 className="text-lg font-semibold text-zinc-800 mb-4">Task Status</h2>
      
      {taskStatus === 'failed' && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">Generation Failed</h3>
            <p className="text-sm mt-1">{taskError || 'An unknown error occurred.'}</p>
          </div>
        </div>
      )}

      {(taskStatus === 'queued' || taskStatus === 'processing') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-zinc-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              {taskStatus === 'queued' ? 'Queued...' : 'Processing...'}
            </span>
            <span className="text-zinc-500">{taskProgress}%</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${taskProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-zinc-500 text-center mt-2">
            This might take a few minutes. Please wait...
          </p>
        </div>
      )}

      {taskStatus === 'succeeded' && videoUrl && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Generation Successful!</span>
          </div>
          <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden">
            <video 
              src={videoUrl} 
              controls 
              autoPlay
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
          <div className="flex justify-end">
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Download Video
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
