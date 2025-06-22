import { useState } from "react";
import axios from "axios";

export const Home = () => {
  const [ticker, setTicker] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await axios.post<{ text: string }>("/api/stocks/analyze", { ticker });
      setResult(res.data.text);
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
      {result && (
        <div className="border p-3 rounded bg-gray-50">
          <h2 className="font-semibold mb-1">分析結果</h2>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
};
