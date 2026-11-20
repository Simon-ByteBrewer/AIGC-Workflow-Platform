import os
import uuid
import time
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from enum import Enum
from volcenginesdkarkruntime import Ark
import tos

app = FastAPI(title="Seedance Video Generation API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Mount static files for frontend (支持 Docker 和原生部署)
STATIC_DIR = "static"
if not os.path.exists(STATIC_DIR) and os.path.exists("dist"):
    STATIC_DIR = "dist"

if os.path.exists(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

class VideoRatio(str, Enum):
    RATIO_16_9 = "16:9"
    RATIO_4_3 = "4:3"
    RATIO_1_1 = "1:1"
    RATIO_3_4 = "3:4"
    RATIO_9_16 = "9:16"
    RATIO_21_9 = "21:9"
    ADAPTIVE = "adaptive"

class TaskStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"

class VideoGenerateRequest(BaseModel):
    api_key: str
    model_id: str
    prompt: str
    ratio: VideoRatio = VideoRatio.ADAPTIVE
    duration: int = 5
    generate_audio: bool = False
    web_search: bool = False
    watermark: bool = True
    reference_images: Optional[List[str]] = None
    reference_videos: Optional[List[str]] = None
    reference_audios: Optional[List[str]] = None
    public_figure_asset_id: Optional[str] = None

class VideoGenerateResponse(BaseModel):
    task_id: str
    status: TaskStatus
    created_at: str

class TaskStatusResponse(BaseModel):
    task_id: str
    status: TaskStatus
    video_url: Optional[str] = None
    error: Optional[str] = None
    progress: int = 0

class UploadResponse(BaseModel):
    url: str
    filename: str

class CreateBucketRequest(BaseModel):
    ak: str
    sk: str

class DeleteMaterialRequest(BaseModel):
    ak: str
    sk: str
    bucket: str
    key: str

# In-memory storage for tasks (demo purpose)
TASK_DB: Dict[str, Dict[str, Any]] = {}

@app.post("/api/video/generate", response_model=VideoGenerateResponse)
async def generate_video(req: VideoGenerateRequest):
    if not req.api_key:
        raise HTTPException(status_code=400, detail="API Key is required")
        
    client = Ark(
        base_url='https://ark.cn-beijing.volces.com/api/v3',
        api_key=req.api_key,
    )
    
    # Construct content array
    content = [{"type": "text", "text": req.prompt}]
    
    if req.reference_images:
        for img_url in req.reference_images:
            content.append({
                "type": "image_url",
                "image_url": {"url": img_url},
                "role": "reference_image"
            })
            
    if req.reference_videos:
        for vid_url in req.reference_videos:
            content.append({
                "type": "video_url",
                "video_url": {"url": vid_url},
                "role": "reference_video"
            })
        
    if req.reference_audios:
        for aud_url in req.reference_audios:
            content.append({
                "type": "audio_url",
                "audio_url": {"url": aud_url},
                "role": "reference_audio"
            })

    if req.public_figure_asset_id:
        asset_id = req.public_figure_asset_id.strip()
        if not asset_id.startswith("asset://"):
            asset_id = f"asset://{asset_id}"
            
        content.append({
            "type": "image_url",
            "image_url": {"url": asset_id},
            "role": "reference_image"
        })

    kwargs = {
        "model": req.model_id,
        "content": content,
        "generate_audio": req.generate_audio,
        "ratio": req.ratio.value,
        "duration": req.duration,
        "watermark": req.watermark
    }
    
    if req.web_search:
        kwargs["tools"] = [{"type": "web_search"}]

    try:
        create_result = client.content_generation.tasks.create(**kwargs)
        
        task_id = create_result.id
        
        TASK_DB[task_id] = {
            "api_key": req.api_key,
            "status": TaskStatus.QUEUED,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "video_url": None,
            "error": None,
            "progress": 0
        }
        
        return VideoGenerateResponse(
            task_id=task_id,
            status=TaskStatus.QUEUED,
            created_at=TASK_DB[task_id]["created_at"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/video/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    task_info = TASK_DB.get(task_id)
    if not task_info:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # If already terminal state, return directly
    if task_info["status"] in [TaskStatus.SUCCEEDED, TaskStatus.FAILED]:
        return TaskStatusResponse(
            task_id=task_id,
            status=task_info["status"],
            video_url=task_info["video_url"],
            error=task_info["error"],
            progress=task_info["progress"]
        )
        
    try:
        client = Ark(
            base_url='https://ark.cn-beijing.volces.com/api/v3',
            api_key=task_info["api_key"],
        )
        
        get_result = client.content_generation.tasks.get(task_id=task_id)
        status = get_result.status
        
        if status == "succeeded":
            task_info["status"] = TaskStatus.SUCCEEDED
            task_info["progress"] = 100
            # Depending on SDK, the output video URL could be in get_result.content or similar.
            # Assuming get_result.content.video_url
            if hasattr(get_result, "content") and get_result.content:
                task_info["video_url"] = get_result.content.video_url
        elif status == "failed":
            task_info["status"] = TaskStatus.FAILED
            task_info["error"] = str(get_result.error) if hasattr(get_result, "error") else "Unknown error"
        else:
            # running, queued
            task_info["status"] = TaskStatus.PROCESSING if status == "running" else TaskStatus.QUEUED
            task_info["progress"] = 50 if status == "running" else 10
            
        return TaskStatusResponse(
            task_id=task_id,
            status=task_info["status"],
            video_url=task_info["video_url"],
            error=task_info["error"],
            progress=task_info["progress"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/material/bucket")
async def create_material_bucket(req: CreateBucketRequest):
    if not req.ak or not req.sk:
        raise HTTPException(status_code=400, detail="AK and SK are required")
    bucket_name = f"seedance-lib-{uuid.uuid4().hex[:8]}"
    endpoint = "tos-cn-beijing.volces.com"
    region = "cn-beijing"
    client = tos.TosClientV2(req.ak, req.sk, endpoint, region)
    try:
        client.create_bucket(bucket_name, acl=tos.ACLType.ACL_Public_Read)
        return {"bucket_name": bucket_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/material/list")
async def list_materials(bucket: str, type: str, ak: str, sk: str):
    if not ak or not sk:
        raise HTTPException(status_code=400, detail="AK and SK are required")
    endpoint = "tos-cn-beijing.volces.com"
    region = "cn-beijing"
    client = tos.TosClientV2(ak, sk, endpoint, region)
    try:
        prefix = f"uploads/{type}/"
        result = client.list_objects(bucket, prefix=prefix)
        items = []
        if result.contents:
            for obj in result.contents:
                url = f"https://{bucket}.{endpoint}/{obj.key}"
                items.append({"url": url, "key": obj.key})
        return {"items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/material/delete")
async def delete_material(req: DeleteMaterialRequest):
    if not req.ak or not req.sk:
        raise HTTPException(status_code=400, detail="AK and SK are required")
    endpoint = "tos-cn-beijing.volces.com"
    region = "cn-beijing"
    client = tos.TosClientV2(req.ak, req.sk, endpoint, region)
    try:
        resp = client.delete_object(req.bucket, req.key)
        if resp.status_code == 204:
            return {"success": True}
        else:
            raise Exception(f"Failed to delete object, status {resp.status_code}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(
    request: Request, 
    file: UploadFile = File(...), 
    type: str = Form(...),
    ak: str = Form(""),
    sk: str = Form(""),
    bucket_name: str = Form("")
):
    if not ak or not sk:
        raise HTTPException(status_code=400, detail="控制面 AK and SK are required for TOS upload")

    # Hardcoded endpoint and bucket as per usual volcengine conventions for Ark
    # You might want to make these configurable later
    endpoint = "tos-cn-beijing.volces.com"
    region = "cn-beijing"
    target_bucket = bucket_name if bucket_name else "ark-video-generation" # Standard bucket for demo, adjust if needed
    
    # Try to extract the extension from the uploaded file
    ext = ""
    if file.filename:
        parts = file.filename.rsplit(".", 1)
        if len(parts) > 1:
            ext = "." + parts[1]

    # Generate a unique object key
    object_key = f"uploads/{type}/{uuid.uuid4().hex}{ext}"

    try:
        # Read the file content
        content = await file.read()
        
        # Upload to TOS
        client = tos.TosClientV2(ak, sk, endpoint, region)
        
        # Make sure the bucket exists or we handle the error gracefully
        try:
            client.head_bucket(target_bucket)
        except tos.exceptions.TosClientError as e:
            # If bucket doesn't exist, try to create it (might fail depending on IAM permissions)
            if e.status_code == 404:
                client.create_bucket(target_bucket, acl=tos.ACLType.ACL_Public_Read)
            else:
                pass # Proceed and let put_object throw if it fails
        
        resp = client.put_object(target_bucket, object_key, content=content, acl=tos.ACLType.ACL_Public_Read)
        
        if resp.status_code != 200:
            raise Exception(f"TOS upload failed with status {resp.status_code}")
            
        # The URL format for Volcengine TOS
        url = f"https://{target_bucket}.{endpoint}/{object_key}"
        
        return UploadResponse(url=url, filename=file.filename or object_key)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload to TOS failed: {str(e)}")

