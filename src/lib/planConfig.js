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
 */
export const PLAN_CONFIG = {
  trial:    { credits: 150,    imageUnlimited: false, imageMonthlyLimit: 10   },
  basic:    { credits: 70,     imageUnlimited: true,  imageMonthlyLimit: null },
  plus:     { credits: 500,    imageUnlimited: true,  imageMonthlyLimit: null },
  ultra:    { credits: 3000,   imageUnlimited: true,  imageMonthlyLimit: null },
  business: { credits: 3000,   imageUnlimited: true,  imageMonthlyLimit: null },
  admin:    { credits: 999999, imageUnlimited: true,  imageMonthlyLimit: null },
};
