import sys
sys.path.insert(0, r'c:\D\users\Trae\alfred\backend\site-packages')
import uvicorn
from main import app
uvicorn.run(app, host='127.0.0.1', port=8088)