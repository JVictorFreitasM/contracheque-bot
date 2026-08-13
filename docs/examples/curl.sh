#!/bin/bash
# docs/examples/curl.sh - Exemplos de uso da API do Contracheque Bot
set -e

API="http://localhost:3001"

echo "=== 1. Login (abrir no navegador - fluxo OAuth2 com o IdP) ==="
echo "$API/auth/login"

echo -e "\n=== 2. Usuario autenticado (precisa do cookie de sessao - copie do navegador apos logar) ==="
curl -s -b cookies.txt "$API/api/me" | jq .

echo -e "\n=== 3. Indicadores do dashboard ==="
curl -s -b cookies.txt "$API/api/dashboard/indicadores" | jq .

echo -e "\n=== 4. Status dos servicos ==="
curl -s -b cookies.txt "$API/api/status/servicos" | jq .

echo -e "\n=== 5. Upload de contracheques (PDF/XLSX/CSV) ==="
curl -s -b cookies.txt -X POST "$API/api/uploads" \
  -F "files=@contracheque1.pdf" \
  -F "files=@contracheque2.pdf" | jq .

echo -e "\n=== 6. Listar pendentes ==="
curl -s -b cookies.txt "$API/api/pendentes?page=1&limit=20" | jq .

echo -e "\n=== 7. Listar lotes ==="
curl -s -b cookies.txt "$API/api/lotes" | jq .

echo -e "\n=== 8. Reenviar todos os erros ==="
curl -s -b cookies.txt -X POST "$API/api/contracheques/reenviar-erros" | jq .

echo -e "\n=== 9. Exportar relatorio em CSV ==="
curl -s -b cookies.txt "$API/api/relatorios/exportar?formato=csv" -o relatorio.csv
echo "Salvo em relatorio.csv"

echo -e "\n=== 10. Stream SSE do processamento (Ctrl+C pra sair) ==="
echo "curl -N -b cookies.txt \"$API/api/processamento/stream\""

echo -e "\nConcluido."
