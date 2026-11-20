import React, { useState } from 'react';
import { Play, Square, Loader2, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { VideoGenerateRequest } from '../types';

export const GenerationControl: React.FC = () => {
  const { 
    apiKey, prompts, ratio, duration, generateAudio, webSearch, watermark, 
    referenceImages, referenceVideos, referenceAudios, publicFigureAssetId,
    taskStatus, setCurrentTask, setTaskStatus, addHistoryItem,
    resetCurrentTask, resetForm, modelType, customModelId
  } = useStore();

  const isGenerating = taskStatus === 'queued' || taskStatus === 'processing';
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleGenerate = async () => {
    if (!apiKey) {
      alert('Please enter your API Key first.');
      return;
    }
    if (!prompts.visual.trim()) {
      alert('画面提示词为必填项 (Visual Prompt is required).');
      return;
    }

    // Function to replace @ tags by keeping the text but removing the '@' symbol
    const replaceTags = (text: string) => {
      if (!text) return text;
      // Replaces "@图片1" with "图片1", "@视频1" with "视频1", etc.
      return text.replace(/@(图片|视频|音频)(\d+)/g, '$1$2').trim();
    };

    // Construct the combined prompt string
    const promptParts = [];
    if (prompts.visual.trim()) promptParts.push(`<画面提示词>${replaceTags(prompts.visual.trim())}`);
    if (prompts.dialogue.trim()) promptParts.push(`<对话>${replaceTags(prompts.dialogue.trim())}`);
    if (prompts.voiceover.trim()) promptParts.push(`<旁白>${replaceTags(prompts.voiceover.trim())}`);
    if (prompts.soundEffects.trim()) promptParts.push(`<音效>${replaceTags(prompts.soundEffects.trim())}`);
    if (prompts.cameraPosition.trim()) promptParts.push(`<机位>${replaceTags(prompts.cameraPosition.trim())}`);
    if (prompts.cameraMovement.trim()) promptParts.push(`<运镜>${replaceTags(prompts.cameraMovement.trim())}`);

    const combinedPrompt = promptParts.join('\n');

    let resolvedModelId = '';
    if (modelType === 'seedance2.0') {
      resolvedModelId = 'doubao-seedance-2-0-260128';
    } else if (modelType === 'seedance2.0-fast') {
      resolvedModelId = 'doubao-seedance-2-0-fast-260128';
    } else {
      if (!customModelId.trim()) {
        alert('请输入自定义接入点信息 (Custom Model ID is required).');
        return;
      }
      resolvedModelId = customModelId.trim();
    }

    try {
      setTaskStatus('queued', 0);
      
      const req: VideoGenerateRequest = {
        api_key: apiKey,
        model_id: resolvedModelId,
        prompt: combinedPrompt,
        ratio,
        duration,
        generate_audio: generateAudio,
        web_search: webSearch,
        watermark,
        reference_images: referenceImages,
        reference_videos: referenceVideos,
        reference_audios: referenceAudios,
        public_figure_asset_id: publicFigureAssetId.trim() ? publicFigureAssetId.trim() : null
      };

      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to create task');
      }

      const data = await res.json();
      setCurrentTask(data.task_id);
      
      addHistoryItem({
        taskId: data.task_id,
        prompt: combinedPrompt,
        promptsObj: prompts,
        status: 'queued',
        createdAt: data.created_at,
        thumbnail: referenceImages[0] || publicFigureAssetId || null
      });
      
      setShowSuccessModal(true);

    } catch (error: any) {
      console.error(error);
      setTaskStatus('failed', 0, error.message);
      alert(`Error: ${error.message}`);
    }
  };

  const handleCancel = () => {
    // Note: Volcengine SDK might not support cancelling, so we just reset UI locally
    resetCurrentTask();
  };

  const handleEditContent = () => {
    setShowSuccessModal(false);
  };

  const handleContinueNext = () => {
    setShowSuccessModal(false);
    resetForm();
  };

  return (
    <>
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5 flex items-center justify-between">
      <div className="text-sm text-zinc-500">
        Cost estimation: <span className="font-medium text-zinc-800">Standard rate</span>
      </div>
      
      <div className="flex gap-3">
        {isGenerating && (
          <button 
            onClick={handleCancel}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
          >
            <Square className="w-4 h-4 fill-current" />
            Cancel
          </button>
        )}
        
        <button 
          onClick={handleGenerate}
          disabled={!prompts.visual.trim() || !apiKey}
          className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
          ) : (
            <><Play className="w-5 h-5 fill-current" /> Start Generation</>
          )}
        </button>
      </div>
    </div>
    
    {/* Success Modal */}
    {showSuccessModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-zinc-800 mb-2">视频任务已提交</h3>
          <p className="text-zinc-600 mb-8">请在右侧 History 板块查看任务状态</p>
          
          <div className="flex w-full gap-4">
            <button 
              onClick={handleEditContent}
              className="flex-1 py-3 px-4 border border-zinc-200 text-zinc-700 font-medium rounded-xl hover:bg-zinc-50 transition-colors"
            >
              修改创作内容
            </button>
            <button 
              onClick={handleContinueNext}
              className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              继续生成下一条
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
