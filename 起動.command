#!/bin/zsh
# 変身スタジオ起動: サーバーが生きていればそれを使い、無ければ python3 http.server(4488) を立てて controller.html をブラウザで開く。ダブルクリックで使用。
cd "$(dirname "$0")"
PORT=4488
URL="http://localhost:${PORT}/controller.html"

# 既にサーバーが応答するなら再利用（二重起動しない）
if ! curl -s -o /dev/null "http://127.0.0.1:${PORT}/controller.html"; then
  echo "サーバーを起動します: http://localhost:${PORT}/"
  nohup python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/henshin-studio.log 2>&1 &
  # 起動待ち（最大5秒）
  for i in {1..20}; do
    curl -s -o /dev/null "http://127.0.0.1:${PORT}/controller.html" && break
    sleep 0.25
  done
else
  echo "既存サーバーを再利用します: http://localhost:${PORT}/"
fi

open "$URL"
