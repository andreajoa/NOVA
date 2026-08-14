# Correções de bugs — auditoria

Bugs encontrados na auditoria do repositório e o que foi feito com cada um.

---

## 1. `window` dentro de route handler — cobrança sem entrega

`src/app/api/talking-avatar/generate/route.js`

```js
window?.dispatchEvent?.(new Event("nova:credits-refresh"));
```

`window?.` **não** protege contra identificador não declarado — o optional
chaining só cobre `null`/`undefined` de uma variável que existe. No servidor
isso lançava `ReferenceError`, e lançava **depois** de debitar os créditos e
gerar o vídeo. O usuário pagava, o vídeo era produzido, e a resposta era 500
sem a URL.

**Correção:** linha removida. O refresh de saldo é do cliente, que dispara o
evento ao receber a resposta. Adicionado estorno no `catch`.

---

## 2. Landing page nunca funcionou para cliente pagante

`src/app/api/landing-page/generate/route.js`

```js
async function getDb() {
  const mod = await import("@/lib/db").catch(() => null);
  return mod.prisma || mod.db || mod.default || null;   // nenhum existe
}
```

Sobra de uma arquitetura com Prisma. O projeto fala com o D1 por REST e não
exporta nenhuma dessas três coisas, então `getDb()` devolvia `null` sempre e a
rota retornava `NOVA_DB_NOT_FOUND` 500 para **todo** usuário não-admin. Só o
admin passava, pelo bypass — por isso nunca apareceu em teste.

**Correção:** `chargeInternalCredits` reescrito sobre
`ensureUserGenerationAccount` / `debitGenerationCredits` /
`refundGenerationCredits`. Cerca de 90 linhas de código morto removidas.

---

## 3. `generationUpgradePayload` referenciava variáveis fora de escopo

`src/app/api/generate/route.js`

A função é de módulo, mas lia `endpoint`, `model`, `mode` e `userId`, que só
existem dentro do `POST`. Qualquer chamada com `FAL_KEY` ausente era
`ReferenceError`. Ela também tentava retornar um `NextResponse` de dentro de um
construtor de payload.

**Correção:** virou função pura. A checagem de `FAL_KEY` subiu para o início do
`POST` — **antes** do débito, porque cobrar para depois estourar por falta de
credencial é cobrar por nada.

---

## 4. "Imagens ilimitadas no Basic" não existia

`src/lib/db.ts` → agora `src/lib/planConfig.js`

```js
basic: { credits: 70, imageUnlimited: false, imageMonthlyLimit: null }
```

E em `checkAndDebitImageGen`:

```js
const limit = account.imageMonthlyLimit ?? 10
```

`null ?? 10` = 10. Basic e Plus ficavam com o mesmo teto de 10 imagens/mês do
trial, enquanto o e-mail de boas-vindas anunciava *"Unlimited on Basic — Generate
unlimited e-commerce images"*.

**Correção:** `imageUnlimited: true` a partir do Basic, alinhando o código com o
que é vendido. A tabela saiu para `src/lib/planConfig.js` — módulo sem imports,
para poder ser lido por componentes de cliente sem arrastar o módulo de servidor
para o bundle. Isso também eliminou a cópia divergente que existia em
`falModels.js`.

> Nota de margem: imagem custa da ordem de US$ 0,003 a 0,04 por geração. Se
> aparecer abuso por script, o caminho é um teto alto (tipo 2.000/mês) em vez de
> voltar para 10.

---

## 5. Falha de geração não estornava crédito

Cinco rotas debitavam antes de chamar o fal.ai e não devolviam nada quando a
chamada falhava:

- `/api/generate`
- `/api/video/extend`
- `/api/long-video/render`
- `/api/music-video/jobs/[id]`
- `/api/talking-avatar/generate`

**Correção:** `refundGenerationCredits`, `refundImageGen` e `refundApiCredits`
em `src/lib/db.ts`, chamados no `catch` e também quando o provedor responde sem
URL de mídia. O estorno de API credits registra a transação como `refund` para a
conta fechar. As funções nunca lançam — falha no estorno não pode derrubar a
resposta de erro original.

Em três dessas rotas as variáveis de cobrança viviam dentro do `try`, então o
`catch` não conseguia enxergá-las. Foram elevadas para o escopo da função, com
um flag `charged` que garante que o estorno só acontece se o débito ocorreu.

A resposta de erro agora traz `refunded: true|false`, para o front conseguir
dizer ao usuário se o crédito voltou.

---

## 6. Geração de áudio saía de graça

`src/app/api/audio/generate/route.js`

```js
// TODO: connect to NOVA credit debit before public release.
```

A rota estava publicada e gerava narração sem debitar nada.

**Correção:** débito antes da chamada, paywall 402 quando falta saldo, bypass de
admin e estorno em caso de falha — o mesmo padrão das outras rotas.

---

## 7. Validação de resolução por modelo estava morta

`normalizeResolutionForEndpoint` existia, estava correta e **nunca era chamada**.
`body.resolution` ia cru para o fal.ai. Mandar `1080p` para um endpoint que só
aceita até 720p faz o fal recusar a chamada inteira — depois do débito.

**Correção:** ligada dentro de `normalizeFalInput`. Resolução fora da lista do
modelo é normalizada para a mais próxima válida; endpoint que não aceita o
parâmetro tem o campo removido.

---

## 8. Função inexistente e chaves duplicadas

`normalizeFalInput` chamava `normalizeFalInputForEndpoint`, que não existe em
lugar nenhum do repositório. Protegida por `typeof`, era um no-op permanente que
parecia fazer alguma coisa.

O objeto de input do fal repetia `image_urls` duas vezes, em dois lugares, e a
montagem estava duplicada entre o caminho de admin e o normal.

**Correção:** chamada morta removida, input unificado em `buildFalInput()`.

---

## Extras encontrados durante as correções

**Artefato de citação de IA vazando na interface.**
`src/app/dashboard/characters/page.jsx` exibia para o usuário:

```
Model: Seedance 2.0 image-to-video. It is designed to animate still images
into cinematic video with motion prompts. :contentReference[oaicite:2]{index=2}
```

Além do texto lixo visível, `{index=2}` é interpretado pelo JSX como expressão
atribuindo a uma variável externa. Substituído por texto limpo.

**Lint zerado.** 8 erros pré-existentes resolvidos: dois `any` explícitos,
imports e variáveis mortas, apóstrofos não escapados em JSX nas páginas `/ai/*`,
e links de rodapé em `/pricing` que usavam `<a>` para páginas internas em vez de
`next/link`. Onde a regra era falso positivo — `<a>` apontando para uma rota de
API que devolve HTML, e hidratação de `localStorage` em efeito — ficou um
`eslint-disable` com o motivo escrito.

---

## Verificação

```
npx tsc --noEmit     sem erro
npx eslint src       0 erros
npx next build       compila, 65 rotas
```
