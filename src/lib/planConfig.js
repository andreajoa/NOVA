/**
 * Tabela de planos — fonte única de verdade.
 *
 * Fica num módulo próprio, SEM imports, porque é consumida tanto pelo servidor
 * (@/lib/db) quanto por componentes de cliente (@/lib/falModels). Se ela morasse
 * em db.ts, importá-la de um componente com "use client" arrastaria o módulo de
 * servidor inteiro (Clerk, D1) para o bundle do browser e o build quebraria.
 *
 * imageUnlimited a partir do Basic é o que a landing e o e-mail de boas-vindas
 * prometem. Antes, basic e plus tinham imageMonthlyLimit: null, e
 * checkAndDebitImageGen faz `?? 10` — o assinante pagante ficava com o mesmo
 * teto de 10 imagens do trial.
 *
 * imageMonthlySoftCap: imagens grátis por mês em planos ilimitados.
 * Depois do soft cap, cada imagem adicional custa imageOverCapCredits créditos
 * do saldo de vídeo do plano, garantindo que o plano continue lucrativo
 * mesmo com uso intenso de imagens.
 */
export const PLAN_CONFIG = {
  trial:    { credits: 150,    imageUnlimited: false, imageMonthlyLimit: 10,   imageMonthlySoftCap: null, imageOverCapCredits: 0 },
  basic:    { credits: 70,     imageUnlimited: true,  imageMonthlyLimit: null, imageMonthlySoftCap: 100,  imageOverCapCredits: 2 },
  plus:     { credits: 500,    imageUnlimited: true,  imageMonthlyLimit: null, imageMonthlySoftCap: 500,  imageOverCapCredits: 2 },
  ultra:    { credits: 3000,   imageUnlimited: true,  imageMonthlyLimit: null, imageMonthlySoftCap: 2000, imageOverCapCredits: 2 },
  business: { credits: 3000,   imageUnlimited: true,  imageMonthlyLimit: null, imageMonthlySoftCap: 3000, imageOverCapCredits: 2 },
  admin:    { credits: 999999, imageUnlimited: true,  imageMonthlyLimit: null, imageMonthlySoftCap: null, imageOverCapCredits: 0 },
};
