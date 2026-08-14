import { EMAILS } from "@/lib/crm/emails/content";

export const SEQUENCE_ID = "nova-nurture-60";

/**
 * Cadência escalonada: densa no começo (quando o interesse está no pico),
 * afinando com o tempo. Os 60 e-mails cobrem ~11 meses.
 *
 *   Arco 1 — Ativação      dias 0..22    (a cada 1-3 dias)
 *   Arco 2 — Features      dias 26..62   (a cada 4 dias)
 *   Arco 3 — Nicho/prova   dias 68..122  (a cada 6 dias)
 *   Arco 4 — Objeções      dias 129..192 (semanal)
 *   Arco 5 — Oferta        dias 200..272 (a cada 8 dias)
 *   Arco 6 — Win-back      dias 279..342 (semanal)
 *
 * Para voltar à cadência fixa de 2 em 2 dias, troque por:
 *   export const SCHEDULE_DAYS = EMAILS.map((_, i) => i * 2)
 * ou ajuste CRM_CADENCE_DAYS no painel — o motor lê de lá em runtime.
 */
export const SCHEDULE_DAYS = [
  // Arco 1 — Ativação
  0, 1, 3, 5, 7, 10, 13, 16, 19, 22,
  // Arco 2 — Features
  26, 30, 34, 38, 42, 46, 50, 54, 58, 62,
  // Arco 3 — Nicho e prova social
  68, 74, 80, 86, 92, 98, 104, 110, 116, 122,
  // Arco 4 — Objeções
  129, 136, 143, 150, 157, 164, 171, 178, 185, 192,
  // Arco 5 — Oferta e urgência
  200, 208, 216, 224, 232, 240, 248, 256, 264, 272,
  // Arco 6 — Win-back
  279, 286, 293, 300, 307, 314, 321, 328, 335, 342,
];

const DAY = 86400;

/** Passos = e-mails + o dia em que cada um sai. */
export const STEPS = EMAILS.map((email, index) => ({
  stepNumber: index,
  id: email.id,
  arc: email.arc,
  day: SCHEDULE_DAYS[index] ?? index * 2,
  email,
}));

export const TOTAL_STEPS = STEPS.length;

export function getStep(stepNumber) {
  return STEPS[stepNumber] ?? null;
}

/**
 * Quando o passo `stepNumber` deve sair, dado o início da inscrição.
 * Se a cadência custom (cadenceDays) for informada, ela substitui o schedule.
 */
export function sendTimeFor(stepNumber, enrolledAt, cadenceDays = null) {
  if (cadenceDays && Number(cadenceDays) > 0) {
    return Number(enrolledAt) + stepNumber * Number(cadenceDays) * DAY;
  }
  const step = getStep(stepNumber);
  if (!step) return null;
  return Number(enrolledAt) + step.day * DAY;
}

/**
 * Próximo passo a partir do atual. Retorna null quando a sequência acaba.
 * O intervalo é sempre a diferença entre os dias dos dois passos — assim
 * um contato que entrou atrasado não recebe uma rajada de e-mails atrasados.
 */
export function nextStepAfter(stepNumber, cadenceDays = null) {
  const next = stepNumber + 1;
  if (next >= TOTAL_STEPS) return null;

  if (cadenceDays && Number(cadenceDays) > 0) {
    return { stepNumber: next, delaySeconds: Number(cadenceDays) * DAY };
  }

  const currentDay = getStep(stepNumber)?.day ?? 0;
  const nextDay = getStep(next)?.day ?? currentDay + 2;
  return { stepNumber: next, delaySeconds: Math.max(1, nextDay - currentDay) * DAY };
}
