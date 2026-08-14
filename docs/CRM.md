# NOVA CRM — motor de e-mail

Sequência de 60 e-mails bilíngue (PT/EN), disparada automaticamente, rodando na
stack que a NOVA já usa: Cloudflare D1 + Resend + Vercel Cron. Sem serviço novo.

---

## Como funciona

```
Cadastro (webhook Clerk)  ──┐
Importação de CSV (painel) ─┼──► crm_contacts ──► crm_enrollments
                            │                          │
                            │              cron horário │ (/api/cron/crm-dispatch)
                            │                          ▼
                            │                    runDispatch()
                            │                    ├─ kill switch?
                            │                    ├─ suprimido?
                            │                    ├─ sem abrir há N?
                            │                    └─ Resend.send() ──► crm_email_log
                            │                                              ▲
Assinatura (webhook Stripe) ┘                                              │
   └─► markContactAsCustomer() → sai da sequência      webhook Resend ──────┘
                                                       (abertura, clique,
                                                        bounce, reclamação)
```

**Entrada.** Quem se cadastra na NOVA entra automaticamente no passo 1 (o passo 0
é o e-mail de boas-vindas que o webhook do Clerk já mandava — não duplicamos).
Listas externas entram pelo importador de CSV no painel.

**Saída.** Três formas de sair, todas automáticas:
- **Converteu** — assinou um plano → sai na hora (`exited_converted`). Continuar
  mandando "assine a NOVA" para quem acabou de assinar é a forma mais rápida de
  ganhar uma reclamação de spam de um cliente pagante.
- **Descadastrou** — link do rodapé ou one-click do Gmail → supressão permanente.
- **Parou de abrir** — N e-mails seguidos sem abertura → pausa automática.

---

## A sequência

60 e-mails em 6 arcos, ~11 meses, cadência escalonada (densa no começo, afinando):

| Arco | E-mails | Dias | Tema |
|---|---|---|---|
| 1 | 1–10 | 0–22 | Ativação — tirar a pessoa do zero |
| 2 | 11–20 | 26–62 | Features — cada ferramenta da plataforma |
| 3 | 21–30 | 68–122 | Nicho — Shopify, TikTok, dropshipping, agência, moda, beleza… |
| 4 | 31–40 | 129–192 | Objeções — "é caro", "não sei prompt", "IA parece falsa"… |
| 5 | 41–50 | 200–272 | Oferta — a conta, comparação de planos, urgência |
| 6 | 51–60 | 279–342 | Win-back — reativação e despedida |

### Estrutura de cada e-mail (Hormozi + Gary Vee)

```
HOOK      headline curta e pesada, alinhada à esquerda
BODY      frases curtas, uma ideia por linha
TÁTICA    bloco destacado que ENSINA algo aplicável hoje, de graça
PROVA     número concreto (quando existir)
CTA       UM só — discreto no 'jab', botão sólido no 'hook'
P.S.      segunda linha mais lida do e-mail depois do assunto
```

O **bloco de tática** é o núcleo: cada e-mail entrega algo que a pessoa consegue
usar sem pagar nada (a fórmula de prompt, a lista de planos, a receita de luz da
Apple, o método das duas passadas). É o "jab" do Gary Vee e o *give away the
secrets, sell the implementation* do Hormozi. É o que faz o e-mail ser guardado
em vez de deletado.

**Ritmo atual: 36 jabs / 24 hooks.** Fora do arco 5 — que existe justamente para
pedir a venda — são 14 hooks em 50 e-mails, ou seja, ~1 pedido a cada 4 e-mails.

Copy em `src/lib/crm/emails/content.js`, camada de conversão em
`src/lib/crm/emails/tactics.js`. Estão separados de propósito: dá para bater o
olho em `tactics.js` e ver o ritmo inteiro sem ler 60 e-mails.

---

## Proteção de entregabilidade

O Gmail e o Yahoo suspendem remetentes em massa acima de **0,3% de reclamação**.
Se isso acontecer, o domínio `novvideos.online` para de entregar **tudo** —
inclusive recuperação de senha e recibo do Stripe. Por isso o motor tem:

| Proteção | Onde |
|---|---|
| Kill switch global | painel → `crm_paused` |
| Lista de supressão consultada antes de cada envio | `dispatch.js` |
| Bounce duro e reclamação → supressão automática | webhook Resend |
| Pausa automática de quem não abre | `crm_max_no_open_streak` (padrão 10) |
| One-click unsubscribe (RFC 8058) | header `List-Unsubscribe-Post` |
| Limite de envios por ciclo | `crm_max_per_run` (padrão 60/hora ≈ 1.400/dia) |
| Intervalo entre envios | 550 ms, respeita o rate limit da Resend |
| Saída automática na conversão | webhook Stripe |

O painel mostra a taxa de reclamação com semáforo: verde abaixo de 0,1%,
amarelo entre 0,1% e 0,3%, vermelho acima — que é onde o bloqueio acontece.

---

## Cadência

O padrão é **escalonado** (`SCHEDULE_DAYS` em `sequence.js`). Para trocar por
cadência fixa de 2 em 2 dias, basta pôr `2` no campo "Cadência fixa (dias)" do
painel — o motor lê isso em runtime, sem deploy.

> Os 60 e-mails de 2 em 2 dias cobrem 120 dias de e-mail publicitário contínuo.
> É uma cadência que costuma passar de 0,3% de reclamação. Se for usar, ligue
> junto o freio por engajamento (`crm_max_no_open_streak`) e acompanhe o
> semáforo do painel nas primeiras semanas.

---

## Configuração

Variáveis novas (ver `.env.example`):

```
RESEND_API_KEY=          # já existente — agora só via env, nunca no código
RESEND_WEBHOOK_SECRET=   # Resend > Webhooks. Sem isto, bounce/reclamação não suprimem
CRM_FROM_EMAIL=          # padrão: NOVA AI Studio <noreply@novvideos.online>
CRM_REPLY_TO=
CRM_DEFAULT_LOCALE=      # en | pt
CRON_SECRET=             # openssl rand -base64 32 — SEM ISTO O CRON RECUSA TUDO
```

Passos:

1. Definir as variáveis acima no Vercel.
2. Em **Resend → Webhooks**, apontar para `https://www.novvideos.online/api/webhooks/resend`
   e assinar os eventos `email.delivered`, `email.opened`, `email.clicked`,
   `email.bounced`, `email.complained`.
3. O cron já está declarado em `vercel.json` (de hora em hora). O plano Hobby do
   Vercel limita crons a 1 execução por dia — para disparo horário é preciso plano
   Pro, ou apontar um cron externo para `/api/cron/crm-dispatch?secret=$CRON_SECRET`.
4. As tabelas se criam sozinhas no primeiro request (`ensureCrmTables`). O DDL de
   referência está em `src/lib/crm/schema.sql`.

---

## Painel

`/dashboard/admin/crm` — restrito a admin (`isNovaAdminFromAuth`).

- Funil: contatos, clientes, enviados, taxa de reclamação com semáforo
- Kill switch, cadência, freio de engajamento, limite por ciclo
- **Simular ciclo** (dry run, não envia nada) e **Rodar ciclo agora**
- Performance por e-mail na ordem da sequência — mostra qual assunto morre
- Contatos com busca, filtro por status, suprimir/reinscrever manual
- Importador de CSV

---

## Arquivos

```
src/lib/crm/
  schema.sql          DDL de referência
  db.js               contatos, enrollments, supressão, log, settings
  sequence.js         os 60 passos e a cadência
  dispatch.js         o motor de envio
  render.js           monta o e-mail final (copy + tática + shell)
  guard.js            portão de admin
  emails/
    content.js        copy dos 60 e-mails × 2 idiomas
    tactics.js        bloco de tática, prova, P.S. e ritmo jab/hook
    shell.js          HTML e texto puro
src/app/api/cron/crm-dispatch/     cron horário
src/app/api/webhooks/resend/       eventos de entrega
src/app/api/crm/unsubscribe/       GET (link) e POST (one-click)
src/app/api/admin/crm/             stats · contacts · import · settings
src/app/dashboard/admin/crm/       painel
```
