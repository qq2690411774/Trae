import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
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
    return {"status": "ok", "static_dir_exists": os.path.exists(static_dir)}
