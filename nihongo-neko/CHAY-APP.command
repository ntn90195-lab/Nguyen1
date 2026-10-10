#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Chua cai Node.js. Hay tai ban LTS tai https://nodejs.org roi chay lai."
  read -p "Nhan Enter de dong..."
  exit 1
fi
(sleep 1.5; open http://localhost:3000) &
node server.js
