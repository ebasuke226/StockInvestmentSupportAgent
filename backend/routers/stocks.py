import os
import re
import logging
import json
import pandas as pd
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import google.generativeai as genai

# ロガー設定
logger = logging.getLogger("stocks_router")
logger.setLevel(logging.DEBUG)

router = APIRouter(prefix="/stocks", tags=["stocks"])

class TickerRequest(BaseModel):
    ticker: str

class StockInfo(BaseModel):
    code: str
    name: str
    price: float
    report_date: str

class StocksResponse(BaseModel):
    data: list[StockInfo]

# 環境変数からキーを設定
genai_api_key = os.getenv("GEMINI_API_KEY")
if not genai_api_key:
    logger.warning("GEMINI_API_KEY が設定されていません。environment を確認してください。")
genai.configure(api_key=genai_api_key)


def extract_json_from_text(text: str) -> dict:
    """
    テキストの中から最初の '{' から最後の '}' を抜き出し、
    コメントや余分なカンマを除去したうえで JSON にデコード
    """
    start_idx = text.find('{')
    end_idx = text.rfind('}') + 1
    snippet = text[start_idx:end_idx] if start_idx != -1 and end_idx != 0 else text

    snippet = re.sub(r"//.*", "", snippet)
    snippet = re.sub(r",(\s*[}\]])", r"\1", snippet)
    return json.loads(snippet)


def generate_llm_response(prompt: str, model_name: str = "gemini-1.5-flash") -> str:
    logger.debug(f"[LLM] Prompt: {prompt}")
    response = genai.GenerativeModel(model_name).generate_content(prompt)
    logger.debug(f"[LLM] Raw response: {response.text}")
    return response.text


@router.post("/analyze", response_model=StocksResponse)
async def analyze_ticker(req: TickerRequest):
    logger.debug(f"Analyze request received: ticker={req.ticker}")

    # 1) CSV読込 (英語カラム名を指定)
    cols_to_use = [
        'code', 'name', 'market',
        'industry_33_code', 'industry_33_category',
        'industry_17_code', 'industry_17_category',
        'scale_code', 'scale_category'
    ]
    df = pd.read_csv(
        "stockList.csv",
        dtype=str,
        engine="python",
        on_bad_lines="skip",
        usecols=cols_to_use
    )
    logger.debug(f"CSV loaded ({df.shape[0]} rows), columns={list(df.columns)}")

    # 2) 銘柄コードでフィルタ
    matched = df[df['code'] == req.ticker]
    if matched.empty:
        logger.error(f"Ticker not found: {req.ticker}")
        raise HTTPException(status_code=404, detail="該当する銘柄コードが見つかりません。")

    # 3) 業種(33) + 規模(1 or 2) フィルタ
    industry_code = matched.iloc[0]['industry_33_code']
    filtered = df[
        (df['industry_33_code'] == industry_code) &
        (df['scale_code'].isin(['1','2']))
    ][['code','name']]
    logger.debug(f"Filtered tickers count: {filtered.shape[0]}")

    # 4) LLMプロンプト作成
    tickers_list = filtered.to_dict(orient='records')
    prompt = (
        '以下の銘柄リストについて、直近の株価と次回の決算発表日をJSON形式で教えてください。\n'
        + json.dumps(tickers_list, ensure_ascii=False)
    )

    # 5) LLM呼び出し + JSON抽出 + パース
    llm_text = generate_llm_response(prompt)
    try:
        records = extract_json_from_text(llm_text)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing failed: {e}\nRaw response: {llm_text}")
        raise HTTPException(status_code=500, detail="LLMの応答パースエラー: JSON形式ではありませんでした。")

    # 6) DataFrame化 + レスポンス
    result_df = pd.DataFrame(records)
    logger.debug(f"Result DataFrame columns: {list(result_df.columns)} | rows={len(result_df)}")
    response_data = result_df.to_dict(orient='records')
    return JSONResponse(content={'data': response_data})
