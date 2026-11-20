import React, { useRef, useState } from 'react';
import { UploadCloud, X, Image as ImageIcon, Video, Music, UserSquare } from 'lucide-react';
import { useStore } from '../store/useStore';

export const MaterialUpload: React.FC = () => {
  const { 
    referenceImages, addReferenceImage, removeReferenceImage,
    referenceVideos, addReferenceVideo, removeReferenceVideo,
    referenceAudios, addReferenceAudio, removeReferenceAudio,
    publicFigureAssetId, setPublicFigureAssetId,
    ak, sk, activeBucket,
    taskStatus
  } = useStore();

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'image' | 'video' | 'audio'>('image');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState<'image' | 'video' | 'audio' | null>(null);
  const [publicFigureInput, setPublicFigureInput] = useState('');

  const handleUploadClick = (type: 'image' | 'video' | 'audio') => {
    setUploadType(type);
    fileInputRef.current?.click();
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim() || !showUrlInput) return;
    
    const url = urlInput.trim();
    if (showUrlInput === 'image') {
      if (referenceImages.length >= 9) {
        alert('Maximum 9 images allowed');
        return;
      }
      addReferenceImage(url);
    }
    if (showUrlInput === 'video') {
      if (referenceVideos.length >= 3) {
        alert('Maximum 3 videos allowed');
        return;
      }
      addReferenceVideo(url);
    }
    if (showUrlInput === 'audio') {
      if (referenceAudios.length >= 3) {
        alert('Maximum 3 audios allowed');
        return;
      }
      addReferenceAudio(url);
    }
    
    setUrlInput('');
    setShowUrlInput(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!ak || !sk) {
      alert("Please enter both Access Key (AK) and Secret Key (SK) in the top configuration bar before uploading materials to TOS.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', uploadType);
    formData.append('ak', ak);
    formData.append('sk', sk);
    if (activeBucket) {
      formData.append('bucket_name', activeBucket);
    }

    const xhr = new XMLHttpRequest();
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          if (data.url) {
            if (uploadType === 'image') {
              if (referenceImages.length >= 9) alert('Maximum 9 images allowed');
              else addReferenceImage(data.url);
            }
            if (uploadType === 'video') {
              if (referenceVideos.length >= 3) alert('Maximum 3 videos allowed');
              else addReferenceVideo(data.url);
            }
            if (uploadType === 'audio') {
              if (referenceAudios.length >= 3) alert('Maximum 3 audios allowed');
              else addReferenceAudio(data.url);
            }
          }
        } else {
          throw new Error(data.detail || 'Upload failed');
        }
      } catch (error) {
        console.error('Upload failed:', error);
        alert('File upload failed. Check console for details.');
      } finally {
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    xhr.onerror = () => {
      console.error('Upload failed: Network Error');
      alert('File upload failed due to a network error.');
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    xhr.open('POST', '/api/upload', true);
    xhr.send(formData);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <UploadCloud className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-zinc-800">Reference Materials</h2>
        <span className="text-xs text-zinc-500 ml-2">首次使用 Upload 按钮请在下方创建素材库</span>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept={uploadType === 'image' ? 'image/*' : uploadType === 'video' ? 'video/*' : 'audio/*'}
      />

      <div className="grid grid-cols-3 gap-4">
        {/* Images */}
        <div className="border border-zinc-200 rounded-lg p-3 flex flex-col items-center bg-zinc-50 relative">
          <ImageIcon className="w-6 h-6 text-zinc-400 mb-2" />
          <span className="text-xs font-medium text-zinc-600 mb-2">Images (Max 9)</span>
          <div className="flex gap-2 w-full">
            <button 
              onClick={() => handleUploadClick('image')}
              disabled={ uploading}
              className="flex-1 py-1.5 text-xs bg-white border border-zinc-300 rounded hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              Upload
            </button>
            <button 
              onClick={() => setShowUrlInput(showUrlInput === 'image' ? null : 'image')}
              disabled={ uploading}
              className="flex-1 py-1.5 text-xs bg-white border border-zinc-300 rounded hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              URL
            </button>
          </div>
          {showUrlInput === 'image' && (
            <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 flex gap-2">
              <input 
                type="text" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter image URL..."
                className="flex-1 px-2 py-1 text-xs border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button 
                onClick={handleUrlSubmit}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Video */}
        <div className="border border-zinc-200 rounded-lg p-3 flex flex-col items-center bg-zinc-50 relative">
          <Video className="w-6 h-6 text-zinc-400 mb-2" />
          <span className="text-xs font-medium text-zinc-600 mb-2">Video (Max 3)</span>
          <div className="flex gap-2 w-full">
            <button 
              onClick={() => handleUploadClick('video')}
              disabled={ uploading || referenceVideos.length >= 3}
              className="flex-1 py-1.5 text-xs bg-white border border-zinc-300 rounded hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              Upload
            </button>
            <button 
              onClick={() => setShowUrlInput(showUrlInput === 'video' ? null : 'video')}
              disabled={ uploading || referenceVideos.length >= 3}
              className="flex-1 py-1.5 text-xs bg-white border border-zinc-300 rounded hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              URL
            </button>
          </div>
          {showUrlInput === 'video' && (
            <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 flex gap-2">
              <input 
                type="text" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter video URL..."
                className="flex-1 px-2 py-1 text-xs border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button 
                onClick={handleUrlSubmit}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Audio */}
        <div className="border border-zinc-200 rounded-lg p-3 flex flex-col items-center bg-zinc-50 relative">
          <Music className="w-6 h-6 text-zinc-400 mb-2" />
          <span className="text-xs font-medium text-zinc-600 mb-2">Audio (Max 3)</span>
          <div className="flex gap-2 w-full">
            <button 
              onClick={() => handleUploadClick('audio')}
              disabled={ uploading || referenceAudios.length >= 3}
              className="flex-1 py-1.5 text-xs bg-white border border-zinc-300 rounded hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              Upload
            </button>
            <button 
              onClick={() => setShowUrlInput(showUrlInput === 'audio' ? null : 'audio')}
              disabled={ uploading || referenceAudios.length >= 3}
              className="flex-1 py-1.5 text-xs bg-white border border-zinc-300 rounded hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              URL
            </button>
          </div>
          {showUrlInput === 'audio' && (
            <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 flex gap-2">
              <input 
                type="text" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter audio URL..."
                className="flex-1 px-2 py-1 text-xs border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button 
                onClick={handleUrlSubmit}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>

      {uploading && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-blue-700 flex items-center gap-2">
              Uploading {uploadType}...
            </span>
            <span className="text-blue-600 font-medium">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Public Figure Asset ID */}
      <div className="mt-4 pt-4 border-t border-zinc-100">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-1 text-sm font-medium text-zinc-700">
            <UserSquare className="w-4 h-4" /> Public Figure Image Materials
          </label>
          <a 
            href="https://console.volcengine.com/ark/region:ark+cn-beijing/experience/vision?modelId=doubao-seedance-2-0-260128&tab=GenVideo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            公共人像素材库
          </a>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={publicFigureInput}
            onChange={(e) => setPublicFigureInput(e.target.value)}
            disabled={false}
            placeholder="示例：asset://asset-20260224225818-2r9ls"
            className="flex-1 p-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-50"
          />
          <button 
            onClick={() => {
              if (publicFigureInput) {
                let val = publicFigureInput.trim();
                if (!val.startsWith('asset://')) {
                  val = `asset://${val}`;
                }
                setPublicFigureAssetId(val);
                setPublicFigureInput('');
              }
            }}
            disabled={ !publicFigureInput}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </div>
        <div className="mt-2 text-[10px] text-zinc-400 leading-tight">
          可访问方舟公共素材库，点击形象查看详情并复制assetid
        </div>
      </div>

      {/* Uploaded List */}
      <div className="mt-4 space-y-2">
        {publicFigureAssetId && (
          <div className="flex items-center justify-between bg-zinc-50 px-3 py-2 rounded border border-zinc-200">
            <div className="flex items-center gap-2 overflow-hidden">
              <UserSquare className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-xs text-zinc-600 truncate">{publicFigureAssetId}</span>
            </div>
            <button onClick={() => setPublicFigureAssetId('')} disabled={false} className="text-zinc-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {referenceImages.map((url, i) => (
          <div key={i} className="flex items-center justify-between bg-zinc-50 px-3 py-2 rounded border border-zinc-200">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 bg-zinc-200 rounded overflow-hidden shrink-0 flex items-center justify-center border border-zinc-300">
                <img src={url} alt={`图片${i+1}`} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-700">图片 {i+1}</span>
                <span className="text-[10px] text-zinc-500 truncate max-w-[200px]">{url.split('/').pop()}</span>
              </div>
            </div>
            <button onClick={() => removeReferenceImage(url)} disabled={false} className="text-zinc-400 hover:text-red-500 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {referenceVideos.map((url, i) => (
          <div key={`vid-${i}`} className="flex items-center justify-between bg-zinc-50 px-3 py-2 rounded border border-zinc-200">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 bg-zinc-200 rounded overflow-hidden shrink-0 flex items-center justify-center border border-zinc-300">
                <video src={url} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-700">视频 {i+1}</span>
                <span className="text-[10px] text-zinc-500 truncate max-w-[200px]">{url.split('/').pop()}</span>
              </div>
            </div>
            <button onClick={() => removeReferenceVideo(url)} disabled={false} className="text-zinc-400 hover:text-red-500 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {referenceAudios.map((url, i) => (
          <div key={`aud-${i}`} className="flex items-center justify-between bg-zinc-50 px-3 py-2 rounded border border-zinc-200">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 bg-zinc-100 rounded overflow-hidden shrink-0 flex items-center justify-center border border-zinc-300">
                <Music className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-700">音频 {i+1}</span>
                <span className="text-[10px] text-zinc-500 truncate max-w-[200px]">{url.split('/').pop()}</span>
              </div>
            </div>
            <button onClick={() => removeReferenceAudio(url)} disabled={false} className="text-zinc-400 hover:text-red-500 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
