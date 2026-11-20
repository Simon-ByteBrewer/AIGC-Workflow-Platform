import React, { useEffect } from 'react';
import { Film, Key, Lock, User, Save, Trash2, Eraser } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Header: React.FC = () => {
  const { 
    apiKey, setApiKey, ak, setAk, sk, setSk, 
    savedApiKey, savedAk, savedSk, saveApiConfig, clearApiConfig, clearCache,
    modelType, setModelType, customModelId, setCustomModelId
  } = useStore();
  const [showKey, setShowKey] = React.useState(false);
  const [showAk, setShowAk] = React.useState(false);
  const [showSk, setShowSk] = React.useState(false);

  // Initialize inputs from saved config on mount
  useEffect(() => {
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedAk) setAk(savedAk);
    if (savedSk) setSk(savedSk);
  }, [savedApiKey, savedAk, savedSk, setApiKey, setAk, setSk]);

  const handleSaveConfig = () => {
    saveApiConfig();
    alert('配置已保存！这些密钥现在会常驻保留。');
  };

  const handleDeleteConfig = () => {
    if (confirm('确定要删除常驻保存的密钥吗？')) {
      clearApiConfig();
      alert('配置已删除。');
    }
  };

  const handleClearCache = () => {
    if (confirm('警告：此操作将清空所有本地缓存（包括历史记录、素材库列表、填写的提示词和密钥）。是否确认清空？')) {
      clearCache();
      alert('本地缓存已完全清空，请刷新页面！');
      window.location.reload();
    }
  };

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900">Seedance Video Generator</h1>
            <button
              onClick={handleClearCache}
              className="ml-2 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="清空所有本地缓存数据 (Debug)"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <select 
              value={modelType}
              onChange={(e) => setModelType(e.target.value as any)}
              className="px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 focus:outline-none focus:border-blue-500"
            >
              <option value="seedance2.0">Seedance 2.0</option>
              <option value="seedance2.0-fast">Seedance 2.0 Fast</option>
              <option value="custom">自定义接入点 (Custom)</option>
            </select>
            
            {modelType === 'custom' && (
              <input
                type="text"
                value={customModelId}
                onChange={(e) => setCustomModelId(e.target.value)}
                placeholder="ep-..."
                className="px-2 py-1 w-[180px] bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 focus:outline-none focus:border-blue-500"
              />
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-zinc-50 border border-zinc-200 p-2.5 rounded-lg shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-600 w-[100px] text-right">数据面 API Key:</span>
              <div className="relative flex items-center">
                <Key className="w-4 h-4 text-zinc-400 absolute left-3" />
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter Volcengine API Key"
                  className="pl-9 pr-14 py-1.5 border border-zinc-300 rounded-md text-sm w-[308px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-600 w-[100px] text-right">控制面 AK/SK:</span>
              <div className="flex gap-2">
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3" />
                  <input
                    type={showAk ? "text" : "password"}
                    value={ak}
                    onChange={(e) => setAk(e.target.value)}
                    placeholder="Access Key (AK)"
                    className="pl-9 pr-14 py-1.5 border border-zinc-300 rounded-md text-sm w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowAk(!showAk)}
                    className="absolute right-3 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showAk ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3" />
                  <input
                    type={showSk ? "text" : "password"}
                    value={sk}
                    onChange={(e) => setSk(e.target.value)}
                    placeholder="Secret Key (SK)"
                    className="pl-9 pr-14 py-1.5 border border-zinc-300 rounded-md text-sm w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowSk(!showSk)}
                    className="absolute right-3 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showSk ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center border-l border-zinc-200 pl-4 ml-1">
            <div className="flex gap-2 w-full mb-1.5">
              <button
                onClick={handleSaveConfig}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-blue-50 text-blue-600 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors"
                title="保存配置"
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </button>
              <button
                onClick={handleDeleteConfig}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-red-50 text-red-600 rounded-md text-xs font-medium hover:bg-red-100 transition-colors"
                title="删除配置"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
            <span className="text-[10px] text-zinc-400 text-center max-w-[150px] leading-tight">请妥善保存您的密钥，临时使用请贴入对应key，如需常驻使用请点击Save，支持删除</span>
          </div>
        </div>
      </div>
    </header>
  );
};
