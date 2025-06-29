# -------------------------------------------------------------------
# 開発用 Dockerfile (frontend/Dockerfile)
# -------------------------------------------------------------------
    FROM node:18-alpine

    # 作業ディレクトリ
    WORKDIR /app
    
    # 1) 依存関係の定義ファイルを先にコピー
    COPY package.json package-lock.json* ./
    
    # 2) ランタイム依存と型定義を一気にインストール
    #    - 通常の deps
    RUN npm install react react-dom axios \
        # 型定義（開発用）
     && npm install --save-dev typescript @types/react @types/react-dom chart.js react-chartjs-2 chartjs-chart-financial chartjs-adapter-date-fns date-fns  @amcharts/amcharts4
        # その後、残りの package.json 依存も解決 

    # 3) ソースコード一式をコピー
    COPY . .
    
    # 4) ホットリロード用にポート解放
    EXPOSE 3000
    
    # 5) 開発サーバー起動 (Vite 想定)
    CMD ["npm", "run", "dev"]
    