import React, { useState, useRef, useEffect } from 'react';
import { Folder, Image as ImageIcon, Video, Music, Plus, X, UploadCloud, Copy, Check, PlusCircle, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';

const MaterialModal = ({ type, onClose, bucket, ak, sk }: any) => {
  const { 
    referenceImages, addReferenceImage, 
    referenceVideos, addReferenceVideo, 
    referenceAudios, addReferenceAudio 
  } = useStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/material/list?bucket=${bucket}&type=${type}&ak=${ak}&sk=${sk}`);
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [type]);

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('ak', ak);
    formData.append('sk', sk);
    formData.append('bucket_name', bucket);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (xhr.status >= 200 && xhr.status < 300) {
        fetchItems(); // Refresh list
      } else {
        alert('Upload failed. Please check AK/SK and bucket permissions.');
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert('Network Error during upload.');
    };
    xhr.open('POST', '/api/upload', true);
    xhr.send(formData);
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleAddToReference = (url: string) => {
    if (type === 'image') {
      if (referenceImages.length >= 9) alert('Maximum 9 images allowed');
      else {
        addReferenceImage(url);
        alert('Added to Reference Materials');
      }
    } else if (type === 'video') {
      if (referenceVideos.length >= 3) alert('Maximum 3 videos allowed');
      else {
        addReferenceVideo(url);
        alert('Added to Reference Materials');
      }
    } else if (type === 'audio') {
      if (referenceAudios.length >= 3) alert('Maximum 3 audios allowed');
      else {
        addReferenceAudio(url);
        alert('Added to Reference Materials');
      }
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    
    try {
      const res = await fetch('/api/material/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ak, sk, bucket, key })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchItems(); // Refresh the list
      } else {
        alert('Delete failed: ' + (data.detail || 'Unknown error'));
      }
    } catch (e) {
      alert('Delete failed due to network error.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            {type === 'image' && <ImageIcon className="w-5 h-5 text-blue-600" />}
            {type === 'video' && <Video className="w-5 h-5 text-blue-600" />}
            {type === 'audio' && <Music className="w-5 h-5 text-blue-600" />}
            <h3 className="text-lg font-semibold capitalize">{type} Library</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"><X className="w-5 h-5 text-zinc-500"/></button>
        </div>
        
        <div className="p-5 flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-zinc-500">
              You can upload {type}s here and copy their URLs to use in the Reference Materials section.
            </p>
            <div className="flex items-center gap-4">
              {uploading && (
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-zinc-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">{progress}%</span>
                </div>
              )}
              <button 
                onClick={handleUpload} 
                disabled={uploading} 
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                <UploadCloud className="w-4 h-4" /> Upload New {type}
              </button>
            </div>
          </div>
          
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept={`${type}/*`} />
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500">Loading materials...</div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl">
                  <Folder className="w-12 h-12 mb-3 text-zinc-300" />
                  <p>No {type}s found in this library.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((item, i) => (
                    <div key={i} className="border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50 flex flex-col group relative">
                      <div className="h-32 bg-zinc-100 flex items-center justify-center relative group/img">
                        {type === 'image' && <img src={item.url} alt="img" className="w-full h-full object-cover" />}
                        {type === 'video' && <video src={item.url} controls className="w-full h-full object-cover" />}
                        {type === 'audio' && <audio src={item.url} controls className="w-full mt-8 px-2" />}
                        <button 
                          onClick={() => handleDelete(item.key)}
                          className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-red-50 text-red-600 rounded-md opacity-0 group-hover/img:opacity-100 transition-all shadow-sm"
                          title="Delete material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-3 border-t border-zinc-200 bg-white">
                        <div className="text-xs text-zinc-600 truncate mb-2" title={item.key}>{item.key.split('/').pop()}</div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleCopy(item.url)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium border border-zinc-200 rounded text-zinc-700 hover:bg-zinc-50 transition-colors"
                          >
                            {copiedUrl === item.url ? (
                              <><Check className="w-3 h-3 text-green-600" /> Copied!</>
                            ) : (
                              <><Copy className="w-3 h-3" /> Copy</>
                            )}
                          </button>
                          <button 
                            onClick={() => handleAddToReference(item.url)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                          >
                            <PlusCircle className="w-3 h-3" /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MaterialLibrary: React.FC = () => {
  const { ak, sk, materialBuckets, activeBucket, addMaterialBucket, setActiveBucket } = useStore();
  const [creating, setCreating] = useState(false);
  const [activeModal, setActiveModal] = useState<'image' | 'video' | 'audio' | null>(null);

  const handleCreateBucket = async () => {
    if (!ak || !sk) {
      alert('请先在顶部配置保存 AK 和 SK，才能调用 TOS 创建素材库。');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/material/bucket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ak, sk })
      });
      const data = await res.json();
      if (res.ok) {
        addMaterialBucket(data.bucket_name);
        alert('素材库创建成功！已自动绑定。');
      } else {
        alert('创建失败: ' + (data.detail || '未知错误'));
      }
    } catch (e) {
      alert('创建失败: 网络错误');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-zinc-800">素材库 (Material Library)</h2>
        </div>
        
        {materialBuckets.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="text-xs text-zinc-500 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <select 
                value={activeBucket || ''} 
                onChange={(e) => setActiveBucket(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                {materialBuckets.map(bucket => (
                  <option key={bucket} value={bucket}>{bucket}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleCreateBucket} 
              disabled={creating}
              className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-colors"
              title="创建新素材库"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {materialBuckets.length === 0 ? (
        <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-lg bg-zinc-50">
          <p className="text-sm text-zinc-500 mb-4">您还未创建专属的 TOS 素材存储桶，无法使用素材库功能。</p>
          <button 
            onClick={handleCreateBucket} 
            disabled={creating}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> {creating ? '正在创建并绑定...' : '一键创建专属素材库'}
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-zinc-600 mb-4">
            点击下方分类进入素材库管理页面，可查看已上传的素材或上传新素材。
          </p>
          <div className="grid grid-cols-3 gap-4">
            <button 
              onClick={() => setActiveModal('image')} 
              className="flex flex-col items-center gap-3 p-4 border border-zinc-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group bg-zinc-50"
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:text-blue-600">
                <ImageIcon className="w-5 h-5 text-zinc-500 group-hover:text-blue-600" />
              </div>
              <span className="text-sm font-medium text-zinc-700 group-hover:text-blue-700">Images</span>
            </button>
            
            <button 
              onClick={() => setActiveModal('video')} 
              className="flex flex-col items-center gap-3 p-4 border border-zinc-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group bg-zinc-50"
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:text-blue-600">
                <Video className="w-5 h-5 text-zinc-500 group-hover:text-blue-600" />
              </div>
              <span className="text-sm font-medium text-zinc-700 group-hover:text-blue-700">Video</span>
            </button>
            
            <button 
              onClick={() => setActiveModal('audio')} 
              className="flex flex-col items-center gap-3 p-4 border border-zinc-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group bg-zinc-50"
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:text-blue-600">
                <Music className="w-5 h-5 text-zinc-500 group-hover:text-blue-600" />
              </div>
              <span className="text-sm font-medium text-zinc-700 group-hover:text-blue-700">Audio</span>
            </button>
          </div>
        </div>
      )}

      {activeModal && activeBucket && (
        <MaterialModal 
          type={activeModal} 
          onClose={() => setActiveModal(null)} 
          bucket={activeBucket}
          ak={ak}
          sk={sk}
        />
      )}
    </div>
  );
};
