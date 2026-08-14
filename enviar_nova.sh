#!/bin/bash
#
# Disparo manual de campanha via Resend.
#
# SUPERSEDIDO pelo CRM (src/lib/crm) — prefira importar a lista em
# /dashboard/admin/crm, que respeita supressão, descadastro e reclamação.
#
# Uso:
#   export RESEND_API_KEY="re_..."
#   ./enviar_nova.sh destinatarios.txt /tmp/nova_email.html
#
# O arquivo de destinatários é um e-mail por linha e NÃO fica no repositório:
# endereço de cliente é dado pessoal e este repositório é público.

set -euo pipefail

: "${RESEND_API_KEY:?RESEND_API_KEY não definida. Rode: export RESEND_API_KEY=...}"

FROM_EMAIL="${CRM_FROM_EMAIL:-NOVA AI Studio <noreply@novvideos.online>}"
SUBJECT="${CAMPAIGN_SUBJECT:-Create stunning product images & videos — AI in seconds}"

RECIPIENTS_FILE="${1:-}"
HTML_FILE="${2:-/tmp/nova_email.html}"

if [[ -z "$RECIPIENTS_FILE" || ! -f "$RECIPIENTS_FILE" ]]; then
  echo "Uso: $0 <arquivo_destinatarios> [arquivo_html]" >&2
  exit 1
fi

if [[ ! -f "$HTML_FILE" ]]; then
  echo "Arquivo HTML não encontrado: $HTML_FILE" >&2
  exit 1
fi

mapfile -t EMAILS < <(grep -E '.+@.+\..+' "$RECIPIENTS_FILE" | tr -d '\r' | sed '/^$/d')

TOTAL=${#EMAILS[@]}
OK=0
FAIL=0

echo ""
echo "NOVA — disparo de campanha"
echo "Total: $TOTAL destinatários"
echo "De: $FROM_EMAIL"
echo "-------------------------------------------------------"

i=0
for email in "${EMAILS[@]}"; do
  i=$((i + 1))

  RESPONSE=$(
    RECIPIENT="$email" \
    FROM_EMAIL="$FROM_EMAIL" \
    SUBJECT="$SUBJECT" \
    HTML_FILE="$HTML_FILE" \
    node -e "
const https = require('https');
const html = require('fs').readFileSync(process.env.HTML_FILE, 'utf8');
const body = JSON.stringify({
  from: process.env.FROM_EMAIL,
  to: [process.env.RECIPIENT],
  subject: process.env.SUBJECT,
  html,
});
const req = https.request({
  hostname: 'api.resend.com',
  path: '/emails',
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => console.log(data));
});
req.on('error', (e) => console.log(JSON.stringify({ error: e.message })));
req.write(body);
req.end();
"
  )

  if echo "$RESPONSE" | grep -q '\"id\"'; then
    OK=$((OK + 1))
    printf "OK   [%03d/%d] %s\n" "$i" "$TOTAL" "$email"
  else
    FAIL=$((FAIL + 1))
    printf "FAIL [%03d/%d] %s -> %s\n" "$i" "$TOTAL" "$email" "$RESPONSE"
  fi

  sleep 0.5
done

echo "-------------------------------------------------------"
echo ""
echo "Enviados: $OK   Falhas: $FAIL"
