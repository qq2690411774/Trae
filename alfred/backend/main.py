import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from config import CORS_ORIGINS
from routes import router

app = FastAPI(
    title="alfred_ Execution Decision Layer",
    description="API for alfred_'s execution decision engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载API路由
app.include_router(router, prefix="/api")

static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")


@app.get("/")
def root():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "alfred_ Execution Decision Layer API", "docs": "/docs"}


@app.middleware("http")
async def frontend_middleware(request: Request, call_next):
    # 如果是API请求，直接通过
    if request.url.path.startswith("/api") or request.url.path.startswith("/docs") or request.url.path.startswith("/openapi.json"):
        return await call_next(request)
    
    # 尝试调用下一个中间件（正常路由）
    response = await call_next(request)
    
    # 如果是404，返回前端页面
    if response.status_code == 404:
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
    
    return response


@app.get("/health")
def health_check():
    return {"status": "ok", "static_dir_exists": os.path.exists(static_dir)}
