#!/bin/bash
# Abre o Gerador de Laudos SST neste Mac. Dê dois cliques e deixe a janela aberta enquanto usa.
cd "$(dirname "$0")" || exit 1
PORTA=8766
ENDERECO="http://localhost:$PORTA"
if lsof -nP -iTCP:"$PORTA" -sTCP:LISTEN >/dev/null 2>&1; then open "$ENDERECO"; exit 0; fi
echo "Gerador de Laudos SST em $ENDERECO — para encerrar, feche esta janela."
( sleep 1; open "$ENDERECO" ) &
exec python3 -m http.server "$PORTA" --bind 127.0.0.1
