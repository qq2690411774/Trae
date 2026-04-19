import sys
import os

# Get current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
print(f"Current directory: {current_dir}")

# Add site-packages and current directory to path
site_packages = os.path.join(current_dir, 'site-packages')
sys.path.insert(0, site_packages)
sys.path.insert(0, current_dir)
print(f"Path: {sys.path[:5]}")

# Test importing main
try:
    import main
    print("Successfully imported main")
    print(f"App: {main.app}")
except Exception as e:
    print(f"Error importing main: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

import uvicorn

if __name__ == "__main__":
    print("Starting uvicorn server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8088)

