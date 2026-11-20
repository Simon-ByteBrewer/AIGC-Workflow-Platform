export type VideoRatio = '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9' | 'adaptive';
export type ModelType = 'seedance2.0' | 'seedance2.0-fast' | 'custom';

export type TaskStatus = 'queued' | 'processing' | 'succeeded' | 'failed' | 'idle';

export interface PromptFields {
  visual: string; // 画面提示词
  dialogue: string; // 对话
  voiceover: string; // 旁白
  soundEffects: string; // 音效
  cameraPosition: string; // 机位
  cameraMovement: string; // 运镜
}

export interface HistoryItem {
  taskId: string;
  prompt: string; // We can still save the concatenated string or we can save the object. For simplicity, we'll keep the concatenated string for history.
  promptsObj?: PromptFields; // Optional, to support restoring the detailed fields
  status: TaskStatus;
  createdAt: string;
  videoUrl?: string | null;
  error?: string | null;
  thumbnail?: string | null; // For UI display
}

export interface VideoGenerateRequest {
  api_key: string;
  model_id: string;
  prompt: string;
  ratio?: VideoRatio;
  duration?: number;
  generate_audio?: boolean;
  web_search?: boolean;
  watermark?: boolean;
  reference_images?: string[];
  reference_videos?: string[];
  reference_audios?: string[];
  public_figure_asset_id?: string | null;
}

export interface VideoGenerateResponse {
  task_id: string;
  status: TaskStatus;
  created_at: string;
}

export interface TaskStatusResponse {
  task_id: string;
  status: TaskStatus;
  video_url?: string;
  error?: string;
  progress: number;
}

export interface UploadResponse {
  url: string;
  filename: string;
}
