import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
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

# API路由需要先挂载，确保/api请求不会被静态文件拦截
app.include_router(router, prefix="/api")

# 挂载静态文件服务 - 在API路由之后
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")


@app.exception_handler(404)
async def custom_404_handler(request: Request, exc):
    # 对于/api开头的请求，返回JSON 404
    if request.url.path.startswith("/api"):
        return JSONResponse(
            status_code=404,
            content={"detail": "Not Found"}
        )
    # 对于其他请求，尝试返回前端页面
    if os.path.exists(static_dir):
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
    # 最后返回默认的404
    return JSONResponse(
        status_code=404,
        content={"detail": "Not Found"}
    )


@app.get("/")
def root():
    static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "alfred_ Execution Decision Layer API", "docs": "/docs"}
