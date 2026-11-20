import React, { useState, useRef, useEffect } from 'react';
import { Settings, AlignLeft, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { VideoRatio, PromptFields } from '../types';
import getCaretCoordinates from 'textarea-caret';

interface MentionMenuProps {
  options: string[];
  onSelect: (option: string) => void;
  position: { top: number; left: number } | null;
}

const MentionMenu: React.FC<MentionMenuProps> = ({ options, onSelect, position }) => {
  if (!position || options.length === 0) return null;

  return (
    <div 
      className="absolute z-50 bg-blue-50 border border-blue-200 rounded-md shadow-lg py-1 min-w-[120px] max-h-[200px] overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      {options.map((opt, i) => (
        <div 
          key={i} 
          className="px-3 py-1.5 text-sm text-blue-800 hover:bg-blue-100 cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(opt);
          }}
        >
          {opt}
        </div>
      ))}
    </div>
  );
};

export const ParameterInput: React.FC = () => {
  const { 
    prompts, setPrompts, 
    ratio, setRatio, 
    duration, setDuration,
    generateAudio, setGenerateAudio,
    webSearch, setWebSearch,
    watermark, setWatermark,
    taskStatus,
    referenceImages,
    referenceVideos,
    referenceAudios,
    publicFigureAssetId
  } = useStore();

  const [mentionMenuPosition, setMentionMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [activeField, setActiveField] = useState<keyof PromptFields | null>(null);
  const [availableOptions, setAvailableOptions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareasRef = useRef<{ [key in keyof PromptFields]?: HTMLTextAreaElement | HTMLInputElement | null }>({});

  const handlePromptChange = (field: keyof PromptFields, value: string) => {
    setPrompts({ [field]: value });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>, field: keyof PromptFields) => {
    if (e.key === '@') {
      const options: string[] = [];
      referenceImages.forEach((_, idx) => options.push(`@图片${idx + 1}`));
      if (publicFigureAssetId.trim()) {
        options.push(`@图片${referenceImages.length + 1}`);
      }
      referenceVideos.forEach((_, idx) => options.push(`@视频${idx + 1}`));
      referenceAudios.forEach((_, idx) => options.push(`@音频${idx + 1}`));

      if (options.length > 0) {
        setAvailableOptions(options);
        setActiveField(field);
        
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();
        
        // Calculate the caret coordinates within the textarea/input
        const caret = getCaretCoordinates(target, target.selectionEnd || 0);
        
        if (containerRect) {
          // Calculate the final position relative to the container
          setMentionMenuPosition({
            top: rect.top - containerRect.top + caret.top + 20, // 20 is approx line-height
            left: rect.left - containerRect.left + caret.left
          });
        }
      }
    } else {
      setMentionMenuPosition(null);
      setActiveField(null);
    }
  };

  const handleSelectMention = (option: string) => {
    if (activeField) {
      const currentVal = prompts[activeField];
      // Since the user typed '@' and it triggered this menu, the last character is '@'.
      // We remove the last '@' and append the full option (e.g. '@图片1').
      const baseVal = currentVal.endsWith('@') ? currentVal.slice(0, -1) : currentVal;
      handlePromptChange(activeField, baseVal + option + ' ');
    }
    setMentionMenuPosition(null);
    setActiveField(null);
    
    // Refocus
    if (activeField && textareasRef.current[activeField]) {
      textareasRef.current[activeField]?.focus();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setMentionMenuPosition(null);
      setActiveField(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5 relative" ref={containerRef}>
      <MentionMenu options={availableOptions} position={mentionMenuPosition} onSelect={handleSelectMention} />

      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-zinc-800">Generation Parameters</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-1 text-sm font-medium text-zinc-700 mb-1.5">
            <AlignLeft className="w-4 h-4" /> 画面提示词 (Visual Prompt) <span className="text-red-500">*</span>
          </label>
          <textarea
            ref={el => textareasRef.current['visual'] = el}
            value={prompts.visual}
            onChange={(e) => {
              handlePromptChange('visual', e.target.value);
              if (e.target.value.endsWith('@')) {
                handleKeyDown({ key: '@', currentTarget: e.target } as any, 'visual');
              } else {
                setMentionMenuPosition(null);
                setActiveField(null);
              }
            }}
            
            placeholder="描述视频的主要画面内容..."
            className="w-full h-24 p-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-zinc-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">对话 (Dialogue)</label>
            <textarea
              ref={el => textareasRef.current['dialogue'] = el}
              value={prompts.dialogue}
              onChange={(e) => {
                handlePromptChange('dialogue', e.target.value);
                if (e.target.value.endsWith('@')) {
                  handleKeyDown({ key: '@', currentTarget: e.target } as any, 'dialogue');
                } else {
                  setMentionMenuPosition(null);
                  setActiveField(null);
                }
              }}
              
              placeholder="视频中的人物对话内容..."
              className="w-full h-16 p-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-zinc-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">旁白 (Voiceover)</label>
            <textarea
              ref={el => textareasRef.current['voiceover'] = el}
              value={prompts.voiceover}
              onChange={(e) => {
                handlePromptChange('voiceover', e.target.value);
                if (e.target.value.endsWith('@')) {
                  handleKeyDown({ key: '@', currentTarget: e.target } as any, 'voiceover');
                } else {
                  setMentionMenuPosition(null);
                  setActiveField(null);
                }
              }}
              
              placeholder="视频的背景旁白解说..."
              className="w-full h-16 p-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-zinc-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">音效 (Sound Effects)</label>
            <input
              ref={el => textareasRef.current['soundEffects'] = el}
              type="text"
              value={prompts.soundEffects}
              onChange={(e) => {
                handlePromptChange('soundEffects', e.target.value);
                if (e.target.value.endsWith('@')) {
                  handleKeyDown({ key: '@', currentTarget: e.target } as any, 'soundEffects');
                } else {
                  setMentionMenuPosition(null);
                  setActiveField(null);
                }
              }}
              
              placeholder="如：海浪声、鸟鸣..."
              className="w-full p-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">机位 (Camera Position)</label>
            <input
              ref={el => textareasRef.current['cameraPosition'] = el}
              type="text"
              value={prompts.cameraPosition}
              onChange={(e) => {
                handlePromptChange('cameraPosition', e.target.value);
                if (e.target.value.endsWith('@')) {
                  handleKeyDown({ key: '@', currentTarget: e.target } as any, 'cameraPosition');
                } else {
                  setMentionMenuPosition(null);
                  setActiveField(null);
                }
              }}
              
              placeholder="如：特写、全景..."
              className="w-full p-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">运镜 (Movement)</label>
            <input
              ref={el => textareasRef.current['cameraMovement'] = el}
              type="text"
              value={prompts.cameraMovement}
              onChange={(e) => {
                handlePromptChange('cameraMovement', e.target.value);
                if (e.target.value.endsWith('@')) {
                  handleKeyDown({ key: '@', currentTarget: e.target } as any, 'cameraMovement');
                } else {
                  setMentionMenuPosition(null);
                  setActiveField(null);
                }
              }}
              
              placeholder="如：推镜头、环绕..."
              className="w-full p-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Video Ratio</label>
            <select
              value={ratio}
              onChange={(e) => setRatio(e.target.value as VideoRatio)}
              
              className="w-full p-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-50"
            >
              <option value="adaptive">adaptive (智能匹配)</option>
              <option value="16:9">16:9</option>
              <option value="4:3">4:3</option>
              <option value="1:1">1:1</option>
              <option value="3:4">3:4</option>
              <option value="9:16">9:16</option>
              <option value="21:9">21:9</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-zinc-700 mb-1.5">
              <Clock className="w-4 h-4" /> Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              
              className="w-full p-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-50"
            >
              <option value="-1">智能指定 (Smart)</option>
              {Array.from({ length: 12 }, (_, i) => i + 4).map((d) => (
                <option key={d} value={d}>{d}s</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
            <input
              type="checkbox"
              checked={webSearch}
              onChange={(e) => setWebSearch(e.target.checked)}
              
              className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            Web Search
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
            <input
              type="checkbox"
              checked={generateAudio}
              onChange={(e) => setGenerateAudio(e.target.checked)}
              
              className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            Generate Audio
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
            <input
              type="checkbox"
              checked={watermark}
              onChange={(e) => setWatermark(e.target.checked)}
              
              className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            Add Watermark
          </label>
        </div>
      </div>
    </div>
  );
};
