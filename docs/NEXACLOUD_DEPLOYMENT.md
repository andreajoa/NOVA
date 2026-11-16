# NOVA no NexaCloud

Estado confirmado em 15/11/2026, 21h BRT (16/11/2026, 00h UTC).
Esta verificação substitui as pendências de DNS da auditoria local anterior
`HANDOFF_MIGRACAO_NOVA_2026-11-15.md`, realizada pela manhã.

## Publicação comprovada

- https://novvideos.online/ e https://www.novvideos.online/ respondem HTTP 200
  com HTTPS válido e cabeçalho `x-nexacloud: server`.
- Os dois domínios constam como `active` na API do projeto NexaCloud `nova`.
- `www.novvideos.online` aponta para `cname.nexaclouds.online`.
- https://nova.nexaclouds.online/ redireciona (308) ao domínio www.
- `/`, `/pricing`, `/sign-in`, `/explore`, `/robots.txt` e
  `/music/manifest.json` responderam HTTP 200 no domínio real.
- André informou que o NOVA está funcionando.

## Código e publicação

- Repositório: `andreajoa/NOVA`; branch de produção NexaCloud: `nexacloud-deploy`.
- Worktree de migração: `/Users/andrealmeida/nova-nexacloud`.
- Next.js 16.2.4 em servidor Node.js 24, construído remotamente pelo GitHub
  Actions e executado pelo NexaCloud. Não há novo deploy na Vercel.
- Workflow permanente: `.github/workflows/nexacloud.yml`.
- Build confirmado: https://github.com/andreajoa/NOVA/actions/runs/43704580280
  (sucesso, commit `790d2c1`, deployment `b5a04a81-095f-4265-8e8b-26086af3f21a`).
- A mudança de aplicação adicionou aliases `NOVA_CF_*`, pois o NexaCloud
  reserva nomes `CLOUDFLARE_*`. Os nomes anteriores continuam compatíveis.
- Seis scripts de teste existentes passaram; o teste do diretor também
  confirmou o uso dos aliases com requisição simulada, sem gerar conteúdo.

## Configuração e limites da verificação

- Mantidos os serviços originais: Clerk, D1, R2, Workers AI, Modal, Stripe,
  Resend e fal.ai. Nenhum banco foi migrado, recriado ou apagado.
- Verificações diretas de leitura confirmaram D1 (`SELECT 1`), Clerk
  (domínio e API), Stripe (preços existentes) e R2 (`nova-storage`).
- O endpoint público R2 corresponde ao domínio gerenciado confirmado na
  conta Cloudflare original.
- A credencial existente do worker foi transferida via artifact cifrado,
  decifrada localmente e gravada como `NOVA_MODAL_VIDEO_SECRET` no NexaCloud.
  Sua presença foi conferida na listagem de nomes de configuração.
  O artifact remoto foi removido após a importação; o workflow temporário
  de transferência foi removido. Nenhuma credencial está neste documento.
- A API confirma 27 variáveis de produção configuradas. Os valores ficam
  no armazenamento privado de configuração e no NexaCloud, nunca no Git.
- Não foram executadas gerações pagas, compras, envios de e-mail nem um
  teste completo de sessão autenticada. A disponibilidade pública não é
  prova desses fluxos.
- `STRIPE_WEBHOOK_SECRET` e `RESEND_AUDIENCE_ID` não foram recuperados.
  O webhook Stripe existente já estava desabilitado quando consultado;
  nenhuma alteração de faturamento ou webhook foi realizada. Confirmar
  essas integrações antes de afirmar compra/entrega ou newsletter validadas.

## Continuidade

Fazer futuras mudanças nesta branch/worktree, preservando os demais
projetos e as alterações existentes em `~/NexaCloud`. Push nessa branch
normalmente inicia novo build. O commit de documentação/limpeza após a
publicação usa `[skip ci]` e não muda o código da aplicação em execução.
Não reabrir migração de DNS: o domínio real já está atendido pelo NexaCloud.
