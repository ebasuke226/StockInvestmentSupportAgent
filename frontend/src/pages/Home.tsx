// src/pages/Home.tsx
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import 'chartjs-adapter-date-fns';

import {
  Chart as ChartJS,
  TimeScale,
  TimeSeriesScale,   // ★ 追加
  LinearScale,
  CategoryScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  CandlestickController,
  CandlestickElement,
} from 'chartjs-chart-financial';
import { Chart } from 'react-chartjs-2';

/* ---------- Chart.js 登録 (v4.5) ---------- */
ChartJS.register(
  TimeScale,
  TimeSeriesScale,   // ★ 追加
  LinearScale,
  CategoryScale,
  BarElement,
  CandlestickController,
  CandlestickElement,
  Tooltip,
  Legend
);

/* ---------- 型 ---------- */
type YearLowRecord = {
  rank: number;
  name: string;
  code: string;
  market: string;
  current_price: number;
  year_low_price: number;
  year_low_date: string;
  prev_close: number;
};
type CombinedRecord = {
  code: string;
  name: string;
  market: string;
  industry_33_category: string;
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
};

/* ====================================================== */
export const Home = () => {
  const [yearLowList, setYearLowList] = useState<YearLowRecord[] | null>(null);
  const [industryData, setIndustryData] = useState<CombinedRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------- API ---------- */
  const handleFetchYearLow = async () => {
    setLoading(true);
    setError(null);
    setIndustryData(null);
    try {
      const { data } = await axios.get<{ data: YearLowRecord[] }>(
        '/api/stocks/yearlow'
      );
      setYearLowList(
        data.data.filter((r) =>
          ['東証PRM', '東証STD', '東証GRT'].includes(r.market)
        )
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchIndustry = async (code: string) => {
    setLoading(true);
    setError(null);
    setIndustryData(null);
    try {
      const { data } = await axios.get<CombinedRecord[]>(
        `/api/stocks/industry/${code}`
      );
      setIndustryData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- グループ ---------- */
  const grouped = useMemo(() => {
    if (!industryData) return {};
    return industryData.reduce<Record<string, CombinedRecord[]>>((acc, r) => {
      (acc[r.code] = acc[r.code] || []).push(r);
      return acc;
    }, {});
  }, [industryData]);

  const industryName = industryData?.[0]?.industry_33_category ?? '';

  /* ====================================================== */
  return (
    <div className="p-4 max-w-[900px] mx-auto">
      <h1 className="text-2xl mb-6">銘柄分析エージェント</h1>

      <button
        className="bg-green-600 text-white px-4 py-2 rounded mb-6 disabled:opacity-50"
        onClick={handleFetchYearLow}
        disabled={loading}
      >
        {loading ? '取得中…' : '年初来安値リストを表示'}
      </button>

      {error && <p className="text-red-500 mb-4">エラー: {error}</p>}

      {/* ---------- 年初来安値テーブル ---------- */}
      {yearLowList && (
        <table className="w-full table-auto border border-gray-300 mb-8">
          <thead className="bg-blue-50">
            <tr>
              {[
                '順位',
                'コード',
                '名称',
                '市場',
                '取引値',
                '年初来安値',
                '安値日付',
                '前日終値',
              ].map((h) => (
                <th key={h} className="border px-2 py-1">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yearLowList.map((r) => (
              <tr key={r.code} className="hover:bg-gray-50">
                <td className="border px-2 py-1 text-center">{r.rank}</td>
                <td className="border px-2 py-1 text-center">
                  <button
                    className="underline text-blue-600"
                    onClick={() => fetchIndustry(r.code)}
                  >
                    {r.code}
                  </button>
                </td>
                <td className="border px-2 py-1">
                  <button
                    className="underline text-blue-600"
                    onClick={() => fetchIndustry(r.code)}
                  >
                    {r.name}
                  </button>
                </td>
                <td className="border px-2 py-1 text-center">{r.market}</td>
                <td className="border px-2 py-1 text-right">
                  {r.current_price.toLocaleString()}
                </td>
                <td className="border px-2 py-1 text-right">
                  {r.year_low_price.toLocaleString()}
                </td>
                <td className="border px-2 py-1 text-center">
                  {r.year_low_date}
                </td>
                <td className="border px-2 py-1 text-right">
                  {r.prev_close.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ---------- チャート ---------- */}
      {industryData && (
        <div className="mb-8">
          <h2 className="text-xl mb-2">同一業種チャート</h2>
          <p className="mb-4">業種：{industryName}</p>

          <div className="flex flex-wrap gap-x-6 gap-y-12">
            {Object.entries(grouped).map(([code, rows], idx) => {
              /* ---- 価格レンジ ---- */
              const highs = rows.map((r) => r.High);
              const lows = rows.map((r) => r.Low);
              const minP = Math.min(...lows) * 0.98;
              const maxP = Math.max(...highs) * 1.02;

              /* ---- データ ---- */
              const data = {
                datasets: [
                  {
                    /* 出来高 */
                    type: 'bar' as const,
                    order: 1,
                    yAxisID: 'volume',
                    backgroundColor: 'rgba(59,130,246,0.35)',
                    barThickness: 6,
                    data: rows.map((r) => ({
                      x: new Date(r.Date),
                      y: r.Volume,
                    })),
                  },
                  {
                    /* ローソク足 */
                    type: 'candlestick' as const,
                    order: 2,
                    yAxisID: 'price',
                    barThickness: 8,
                    upColor: '#26a69a',
                    downColor: '#ef5350',
                    borderColor: '#455a64',
                    data: rows.map((r) => ({
                      x: new Date(r.Date),
                      o: r.Open,
                      h: r.High,
                      l: r.Low,
                      c: r.Close,
                    })),
                  },
                ],
              };

              /* ---- オプション ---- */
              const options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { mode: 'index' as const, intersect: false },
                },
                scales: {
                  x: {
                    type: 'timeseries' as const,
                    time: {
                      displayFormats: { day: 'MMM d' },  // お好みで
                      tooltipFormat: 'yyyy-MM-dd'                      
                     },
                    ticks: {                  // ★ ここを追加
                      source: 'data',         // データ（ある日付）だけ目盛を作る
                      maxRotation: 0,         // ラベルを寝かせない
                      autoSkip: false,     // ← ★ これで間引きを禁止
                    },  
                    bounds: 'data',
                    offset: true, // 端を切らない
                    grid: {
                      display: true,
                      offset: false
                    },
                  },
                  price: {
                    type: 'linear' as const,
                    position: 'left',
                    min: minP,
                    max: maxP,
                    title: { display: true, text: '価格' },
                    ticks: { callback: (v: number) => v.toLocaleString() },
                    grid: { drawOnChartArea: true },
                  },
                  volume: {
                    type: 'linear' as const,
                    position: 'right',
                    beginAtZero: true,
                    title: { display: true, text: '出来高' },
                    ticks: { callback: (v: number) => v.toLocaleString() },
                    grid: { drawOnChartArea: false },
                  },
                },
              };

              /* ---- 出力 ---- */
              return (
                <div
                  key={code}
                  className="border p-2"
                  style={{
                    width: '48%',
                    height: 320,
                    marginTop: idx ? '2.5rem' : 0,
                  }}
                >
                  <h3 className="font-semibold mb-8">
                    {code} - {rows[0].name}
                  </h3>
                  <Chart type="candlestick" data={data} options={options} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
