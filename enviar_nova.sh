#!/bin/bash

RESEND_API_KEY="re_WRDv2VxB_G1t5mtXTACTC3v12to4zZWW1"
HTML_FILE="/tmp/nova_email.html"
SUBJECT="Create stunning product images & videos — AI in seconds"

EMAILS=(
  "saifshakeel032@gmail.com"
  "475277864@qq.com"
  "polkadot.girl.101@gmail.com"
  "likyujyth@qq.com"
  "youqisi1314@gmail.com"
  "amengd31@gmail.com"
  "592272755@qq.com"
  "debzpamyde@oiyyjkfy.xyz"
  "haavshsbs@gmail.com"
  "ceciliashajan827@gmail.com"
  "dserewfwfe@gmx.com"
  "kanesoko@gmail.com"
  "1004hoobin1004@gmail.com"
  "ypangzhi@gmail.com"
  "uzut31@cartolina.net"
  "hibij18492@4nly.com"
  "mazengoherman@gmail.com"
  "piktras8@gmail.com"
  "krays7490@gmail.com"
  "alabimustafa06@gmail.com"
  "ivankulson1@gmail.com"
  "yonsmhmd39@gmail.com"
  "kozuranibal@gmail.com"
  "weitongxue93@gmail.com"
  "kifflom033@gmail.com"
  "luizhenriquemaia123321@gmail.com"
  "ljimmy@seznam.cz"
  "valuesdrama@gmail.com"
  "kkxx59946@gmail.com"
  "sidhishah9799@gmail.com"
  "iqbalmw4@gmail.com"
  "tinhluc02@gmail.com"
  "yxs01012qq@gmail.com"
  "tdahma2@gmail.com"
  "andremuseu@gmail.com"
  "andrezohoemail@gmail.com"
  "anamacielboutique@gmail.com"
)

TOTAL=${#EMAILS[@]}
OK=0
FAIL=0

echo ""
echo "🚀 NOVA Email Marketing"
echo "📧 Total: $TOTAL destinatários"
echo "-------------------------------------------------------"

i=0
for email in "${EMAILS[@]}"; do
  i=$((i+1))
  RESPONSE=$(node -e "
const https = require('https');
const html = require('fs').readFileSync('$HTML_FILE', 'utf8');
const body = JSON.stringify({
  from: 'NOVA AI Studio <noreply@novvideos.online>',
  to: ['$email'],
  subject: '$SUBJECT',
  html: html
});
const req = https.request({
  hostname: 'api.resend.com',
  path: '/emails',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer $RESEND_API_KEY',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
}, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(data));
});
req.on('error', e => console.log(JSON.stringify({error: e.message})));
req.write(body);
req.end();
")

  if echo "$RESPONSE" | grep -q '"id"'; then
    OK=$((OK+1))
    printf "✅ [%02d/%d] %s\n" "$i" "$TOTAL" "$email"
  else
    FAIL=$((FAIL+1))
    printf "❌ [%02d/%d] %s → %s\n" "$i" "$TOTAL" "$email" "$RESPONSE"
  fi

  sleep 0.5
done

echo "-------------------------------------------------------"
echo ""
echo "✅ Enviados: $OK  ❌ Falhas: $FAIL"
echo ""
echo "🎉 Campanha concluída!"
