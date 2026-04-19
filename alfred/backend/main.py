import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
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

# 先挂载API路由 - 这很重要，必须在静态文件之前
app.include_router(router, prefix="/api")

static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")


@app.get("/")
def root():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "alfred_ Execution Decision Layer API", "docs": "/docs"}


@app.get("/favicon.svg")
def favicon():
    file_path = os.path.join(static_dir, "favicon.svg")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"detail": "Not Found"}


@app.get("/icons.svg")
def icons():
    file_path = os.path.join(static_dir, "icons.svg")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"detail": "Not Found"}


@app.get("/assets/{filename:path}")
def serve_assets(filename: str):
    file_path = os.path.join(static_dir, "assets", filename)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    return {"detail": "Not Found"}


@app.get("/health")
def health_check():
    return {"status": "ok", "static_dir_exists": os.path.exists(static_dir), "routes": [r.path for r in app.routes]}


@app.get("/api/debug")
async def debug_info():
    return {
        "service": "alfred_ backend",
        "version": "1.0.0",
        "environment": {
            "cwd": os.getcwd(),
            "port": os.environ.get("PORT", "not set"),
            "static_dir": static_dir,
            "static_dir_exists": os.path.exists(static_dir),
        },
        "routes": [
            {
                "path": getattr(r, 'path', None),
                "methods": list(getattr(r, 'methods', [])) if hasattr(r, 'methods') else None,
                "type": type(r).__name__,
            }
            for r in app.routes
        ],
        "files_in_static": os.listdir(static_dir) if os.path.exists(static_dir) else [],
    }


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    if request.url.path.startswith('/api'):
        return JSONResponse(status_code=404, content={"detail": f"API endpoint not found: {request.url.path}"})
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse(status_code=404, content={"detail": "Not Found"})
