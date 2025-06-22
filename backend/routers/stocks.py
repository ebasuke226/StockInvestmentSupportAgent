import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai

# ロガー設定（モジュール名ごとに取得）
logger = logging.getLogger("stocks_router")
logger.setLevel(logging.DEBUG)

router = APIRouter(prefix="/stocks", tags=["stocks"])

class TickerRequest(BaseModel):
    ticker: str

class GeminiResponse(BaseModel):
    text: str

# 環境変数からキーを設定
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.warning("GEMINI_API_KEY が設定されていません。環境変数を確認してください。")
genai.configure(api_key=api_key)

genai.configure(api_key=api_key)

def generate_llm_response(
    prompt: str,
    model_name: str = "gemini-1.5-flash",
    prompt_template_version: str = "v1.0",
    user_id: str = "anonymous"
):
    logger.debug(f"[generate_llm_response] prompt_template_version={prompt_template_version}, user_id={user_id}")
    # 実際に Gemini API を呼び出す
    response = genai.GenerativeModel(model_name).generate_content(prompt)
    logger.debug(f"[generate_llm_response] response.text={response.text}")
    return response

@router.post("/analyze", response_model=GeminiResponse)
async def analyze_ticker(req: TickerRequest):
    logger.debug(f"POST /stocks/analyze リクエスト受信: ticker={req.ticker}")
    prompt = f"銘柄コード {req.ticker} の銘柄名と現在の投資判断を一言で教えてください。"
    logger.debug(f"生成するプロンプト: {prompt}")
    try:
        resp = generate_llm_response(
            prompt,
            model_name="gemini-1.5-flash"
        )
        # レスポンスから最終メッセージを取り出し
        text = resp.text
        logger.debug(f"Gemini レスポンス取得: {text}")
        return GeminiResponse(text=text)
    except Exception as e:
        logger.exception("Gemini API 呼び出し中に例外発生")
        raise HTTPException(status_code=500, detail=f"Gemini API error: {e}")
