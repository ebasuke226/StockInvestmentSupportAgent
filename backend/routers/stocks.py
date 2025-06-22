from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import google.generativeai as genai


router = APIRouter(prefix="/stocks", tags=["stocks"])

class TickerRequest(BaseModel):
    ticker: str

class GeminiResponse(BaseModel):
    text: str

# 環境変数からキーを設定
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

@router.post("/analyze", response_model=GeminiResponse)
async def analyze_ticker(req: TickerRequest):
    prompt = f"銘柄コード {req.ticker} の現在の投資判断を一言で教えてください。"
    try:
        resp = genai.chat.completions.create(
            model="gemini-1.5-flash",
            messages=[{"author": "user", "content": prompt}],
            temperature=0.7,
        )
        # レスポンスから最終メッセージを取り出し
        text = resp.last
        return GeminiResponse(text=text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {e}")
