import os
import re
import logging
import pathlib
import json
import pandas as pd
import requests
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ロガー設定
logger = logging.getLogger("stocks_router")
logger.setLevel(logging.DEBUG)

router = APIRouter(prefix="/stocks", tags=["stocks"])


# --- 年初来安値ランキング用モデル ---
class YearLowRecord(BaseModel):
    rank: int
    name: str
    code: str
    market: str
    current_price: float
    year_low_price: float
    year_low_date: str
    prev_close: float

class YearLowResponse(BaseModel):
    data: list[YearLowRecord]

@router.get("/yearlow", response_model=YearLowResponse)
async def get_yearlow_ranking():
    logger.debug("Fetch year-to-date low ranking")
    url = "https://finance.yahoo.co.jp/stocks/ranking/yearToDateLow?market=all"
    resp = requests.get(url, timeout=10)
    if resp.status_code != 200:
        logger.error(f"Failed to fetch ranking page: {resp.status_code}")
        raise HTTPException(status_code=502, detail="ランキングページの取得に失敗しました。")

    soup = BeautifulSoup(resp.text, "html.parser")
    card_div = soup.find("div", class_=re.compile(r"StocksContents__group.*wide__3qa3"))
    if not card_div:
        logger.error("Ranking table container not found")
        raise HTTPException(status_code=500, detail="ランキングテーブルの解析に失敗しました。")
    table = card_div.find("table")
    rows = table.find_all("tr")[1:]
    if not rows:
        logger.error("No rows found in ranking table")
        raise HTTPException(status_code=500, detail="ランキングデータが見つかりませんでした。")

    records: list[dict] = []

    def span_text(parent, cls, idx=0):
        ss = parent.find_all("span", class_=cls)
        return ss[idx].get_text(strip=True) if len(ss) > idx else ""

    for tr in rows:
        row = BeautifulSoup(str(tr), "html.parser")
        rank_tag = row.find("th")
        rank = int(rank_tag.get_text(strip=True)) if rank_tag else 0
        name = row.find("a").get_text(strip=True)
        lis = row.find_all("li")
        code   = lis[0].get_text(strip=True)
        market = lis[1].get_text(strip=True)
        # 絞り込み: 東証PRM / STD / GRT のみ
        if market not in {"東証PRM", "東証STD", "東証GRT"}:
            continue

        tds = row.find_all("td")
        current_price   = float(span_text(tds[1], "StyledNumber__value__3rXW").replace(",", ""))

        year_low_price  = float(span_text(tds[2], "StyledNumber__value__3rXW", 0).replace(",", ""))
        year_low_date   = tds[2].find("span", class_="RankingTable__secondary__1cYU").get_text(strip=True)

        prev_close      = float(span_text(tds[3], "StyledNumber__value__3rXW").replace(",", ""))

        records.append({
            "rank": rank,
            "name": name,
            "code": code,
            "market": market,
            "current_price": current_price,
            "year_low_price": year_low_price,
            "year_low_date": year_low_date,
            "prev_close": prev_close,
        })

    return JSONResponse(content={"data": records})


# --- 業種別＋時系列データ取得用モデル ---
class CombinedRecord(BaseModel):
    code: str
    name: str
    market: str
    industry_33_category: str
    Date: str
    Open: float
    High: float
    Low: float
    Close: float
    Volume: int

@router.get("/industry/{ticker}", response_model=list[CombinedRecord])
async def get_industry_details(ticker: str):
    data_dir = pathlib.Path(__file__).parent.parent / "data"

    # 1) 銘柄リスト読み込み
    df_list = pd.read_csv(
        data_dir / "stockList.csv",
        dtype=str,
        usecols=[
            "code","name","market",
            "industry_33_code","industry_33_category",
            "scale_code"
        ],
        engine="python",
        on_bad_lines="skip",
    )

    # 対象tickerのindustry_33_code
    row = df_list[df_list["code"] == ticker]
    if row.empty:
        raise HTTPException(status_code=404, detail="該当銘柄コードが見つかりません。")
    industry = row.iloc[0]["industry_33_code"]

    # 2) 同じ業種(33) + 規模(1 or 2) フィルタ
    partners = df_list[
        (df_list["industry_33_code"] == industry) &
        (df_list["scale_code"].isin(["1","2"]))
    ][["code","name","market","industry_33_category"]]
    if partners.empty:
        return []

    # 3) 時系列データ読み込み
    df_time = pd.read_csv(
        data_dir / "df_combined_data.csv",
        dtype={"Ticker_int": str},
        parse_dates=["Date"],
        engine="python",
        on_bad_lines="skip",
    )

    # 4) マージ
    merged = pd.merge(
        partners,
        df_time,
        left_on="code", right_on="Ticker_int",
        how="inner"
    )
    if merged.empty:
        return []

    # 5) カラム整形＆日付文字列化
    out = merged[[
        "code","name","market","industry_33_category",
        "Date","Open","High","Low","Close","Volume"
    ]]
    out["Date"] = out["Date"].dt.strftime("%Y-%m-%d")

    return out.to_dict(orient="records")
