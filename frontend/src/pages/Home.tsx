import { useState } from "react";
import axios from "axios";

type StockInfo = {
  code: string;
  name: string;
  price: number;
  report_date: string;
};

type ApiResponse = {
  data?: StockInfo[];
  message?: string;
  instructions?: any;
  detail?: string;
};

export const Home = () => {
  const [ticker, setTicker] = useState("");
  const [stocks, setStocks] = useState<StockInfo[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    setStocks(null);
    try {
      const res = await axios.post<ApiResponse>(
        "/api/stocks/analyze",
        { ticker }
      );
      if (res.data.data) {
        setStocks(res.data.data);
      } else if (res.data.message) {
        setMessage(res.data.message);
      } else {
        setError("Unexpected response format");
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">銘柄分析エージェント</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="border rounded px-2 flex-grow"
          placeholder="例: 7203"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 rounded disabled:opacity-50"
          disabled={!ticker || loading}
          onClick={handleSearch}
        >
          {loading ? "分析中…" : "検索"}
        </button>
      </div>
      {error && <p className="text-red-500 mb-2">エラー: {error}</p>}
      {message && <pre className="bg-gray-100 p-3 rounded mb-2 whitespace-pre-wrap">{message}</pre>}
      {stocks && (
        <div className="space-y-3">
          {stocks.map((stock) => (
            <div
              key={stock.code}
              className="border p-3 rounded bg-gray-50"
            >
              <h2 className="font-semibold">
                {stock.code} - {stock.name}
              </h2>
              <p>株価: {stock.price}</p>
              <p>次回決算発表日: {stock.report_date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
