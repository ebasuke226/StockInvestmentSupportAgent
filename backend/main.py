import os
import logging
from fastapi import FastAPI

# ロガー設定
logging.basicConfig(
    level=logging.DEBUG,  # 開発中は DEBUG レベルで詳細出力
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("main")

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    logger.debug("アプリケーション起動: FastAPI startup_event")

@app.get("/")
def read_root():
    logger.debug("GET / 呼び出し")
    return {"message": "Hello from FastAPI"}
