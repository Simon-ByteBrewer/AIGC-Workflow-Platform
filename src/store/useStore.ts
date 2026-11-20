import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TaskStatus, PromptFields, VideoRatio, HistoryItem, ModelType } from '../types';

interface AppState {
  apiKey: string;
  ak: string;
  sk: string;
  savedApiKey: string;
  savedAk: string;
  savedSk: string;
  
  modelType: ModelType;
  customModelId: string;
  prompts: PromptFields;
  ratio: VideoRatio;
  duration: number;
  generateAudio: boolean;
  webSearch: boolean;
  watermark: boolean;
  referenceImages: string[];
  referenceVideos: string[];
  referenceAudios: string[];
  publicFigureAssetId: string;
  materialBuckets: string[];
  activeBucket: string | null;
  
  currentTaskId: string | null;
  taskStatus: TaskStatus;
  taskProgress: number;
  taskError: string | null;
  videoUrl: string | null;
  
  history: HistoryItem[];

  setApiKey: (key: string) => void;
  setAk: (ak: string) => void;
  setSk: (sk: string) => void;
  saveApiConfig: () => void;
  clearApiConfig: () => void;
  
  setModelType: (type: ModelType) => void;
  setCustomModelId: (id: string) => void;
  setPrompts: (prompts: Partial<PromptFields>) => void;
  setRatio: (ratio: VideoRatio) => void;
  setDuration: (duration: number) => void;
  setGenerateAudio: (val: boolean) => void;
  setWebSearch: (val: boolean) => void;
  setWatermark: (val: boolean) => void;
  setPublicFigureAssetId: (id: string) => void;
  addMaterialBucket: (bucket: string) => void;
  setActiveBucket: (bucket: string | null) => void;
  
  addReferenceImage: (url: string) => void;
  removeReferenceImage: (url: string) => void;
  addReferenceVideo: (url: string) => void;
  removeReferenceVideo: (url: string) => void;
  addReferenceAudio: (url: string) => void;
  removeReferenceAudio: (url: string) => void;
  
  setCurrentTask: (taskId: string | null) => void;
  setTaskStatus: (status: TaskStatus, progress?: number, error?: string | null, videoUrl?: string | null) => void;
  
  addHistoryItem: (item: HistoryItem) => void;
  updateHistoryItem: (taskId: string, updates: Partial<HistoryItem>) => void;
  removeHistoryItem: (taskId: string) => void;
  
  resetCurrentTask: () => void;
  resetForm: () => void;
  clearCache: () => void;
}

const defaultPrompts: PromptFields = {
  visual: '',
  dialogue: '',
  voiceover: '',
  soundEffects: '',
  cameraPosition: '',
  cameraMovement: ''
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      apiKey: '',
      ak: '',
      sk: '',
      savedApiKey: '',
      savedAk: '',
      savedSk: '',
      modelType: 'seedance2.0',
      customModelId: '',
      prompts: defaultPrompts,
      ratio: 'adaptive',
      duration: -1,
      generateAudio: false,
      webSearch: false,
      watermark: true,
      referenceImages: [],
      referenceVideos: [],
      referenceAudios: [],
      publicFigureAssetId: '',
      materialBuckets: [],
      activeBucket: null,
      
      currentTaskId: null,
      taskStatus: 'idle',
      taskProgress: 0,
      taskError: null,
      videoUrl: null,
      
      history: [],
      
      setApiKey: (key) => set({ apiKey: key }),
      setAk: (ak) => set({ ak }),
      setSk: (sk) => set({ sk }),
      saveApiConfig: () => set((state) => ({
        savedApiKey: state.apiKey,
        savedAk: state.ak,
        savedSk: state.sk
      })),
      clearApiConfig: () => set({
        savedApiKey: '',
        savedAk: '',
        savedSk: '',
        apiKey: '',
        ak: '',
        sk: ''
      }),
      setModelType: (type) => set({ modelType: type }),
      setCustomModelId: (id) => set({ customModelId: id }),
      setPrompts: (promptsUpdate) => set((state) => ({ prompts: { ...state.prompts, ...promptsUpdate } })),
      setRatio: (ratio) => set({ ratio }),
      setDuration: (duration) => set({ duration }),
      setGenerateAudio: (val) => set({ generateAudio: val }),
      setWebSearch: (val) => set({ webSearch: val }),
      setWatermark: (val) => set({ watermark: val }),
      setPublicFigureAssetId: (id) => set({ publicFigureAssetId: id }),
      addMaterialBucket: (bucket) => set((state) => ({ 
        materialBuckets: state.materialBuckets.includes(bucket) ? state.materialBuckets : [...state.materialBuckets, bucket],
        activeBucket: bucket 
      })),
      setActiveBucket: (bucket) => set({ activeBucket: bucket }),
      
      addReferenceImage: (url) => set((state) => ({ referenceImages: [...state.referenceImages, url] })),
      removeReferenceImage: (url) => set((state) => ({ referenceImages: state.referenceImages.filter(img => img !== url) })),
      addReferenceVideo: (url) => set((state) => ({ referenceVideos: [...state.referenceVideos, url] })),
      removeReferenceVideo: (url) => set((state) => ({ referenceVideos: state.referenceVideos.filter(vid => vid !== url) })),
      addReferenceAudio: (url) => set((state) => ({ referenceAudios: [...state.referenceAudios, url] })),
      removeReferenceAudio: (url) => set((state) => ({ referenceAudios: state.referenceAudios.filter(aud => aud !== url) })),
      
      setCurrentTask: (taskId) => set({ currentTaskId: taskId }),
      setTaskStatus: (status, progress = 0, error = null, videoUrl = null) => 
        set((state) => {
          const updates: any = { taskStatus: status, taskProgress: progress };
          if (error !== null) updates.taskError = error;
          if (videoUrl !== null) updates.videoUrl = videoUrl;
          return updates;
        }),
        
      addHistoryItem: (item) => set((state) => ({ history: [item, ...state.history] })),
      updateHistoryItem: (taskId, updates) => set((state) => ({
        history: state.history.map(item => item.taskId === taskId ? { ...item, ...updates } : item)
      })),
      removeHistoryItem: (taskId) => set((state) => ({
        history: state.history.filter(item => item.taskId !== taskId)
      })),
      
      resetCurrentTask: () => set({
        currentTaskId: null,
        taskStatus: 'idle',
        taskProgress: 0,
        taskError: null,
        videoUrl: null,
      }),
      
      resetForm: () => set((state) => ({
        prompts: defaultPrompts,
        referenceImages: [],
        referenceVideos: [],
        referenceAudios: [],
        publicFigureAssetId: '',
        // If they weren't saved explicitly, clear them out
        apiKey: state.savedApiKey ? state.apiKey : '',
        ak: state.savedAk ? state.ak : '',
        sk: state.savedSk ? state.sk : ''
      })),
      
      clearCache: () => {
        set({
          apiKey: '',
          ak: '',
          sk: '',
          savedApiKey: '',
          savedAk: '',
          savedSk: '',
          prompts: defaultPrompts,
          ratio: 'adaptive',
          duration: -1,
          generateAudio: false,
          webSearch: false,
          watermark: true,
          referenceImages: [],
          referenceVideos: [],
          referenceAudios: [],
          publicFigureAssetId: '',
          materialBuckets: [],
          activeBucket: null,
          currentTaskId: null,
          taskStatus: 'idle',
          taskProgress: 0,
          taskError: null,
          videoUrl: null,
          history: []
        });
        localStorage.removeItem('seedance-storage');
      }
    }),
    {
      name: 'seedance-storage',
      partialize: (state) => ({ 
        savedApiKey: state.savedApiKey,
        savedAk: state.savedAk,
        savedSk: state.savedSk,
        modelType: state.modelType,
        customModelId: state.customModelId,
        history: state.history,
        ratio: state.ratio,
        duration: state.duration,
        generateAudio: state.generateAudio,
        webSearch: state.webSearch,
        watermark: state.watermark,
        prompts: state.prompts,
        publicFigureAssetId: state.publicFigureAssetId,
        materialBuckets: state.materialBuckets,
        activeBucket: state.activeBucket
      }),
    }
  )
);
