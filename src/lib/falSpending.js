import { queryD1 } from "@/lib/db";
import { MEDIA_MODELS } from "@/lib/mediaCapabilities";

/**
 * Registra o custo estimado de uma geração fal.ai no log de gastos.
 * Chamado APÓS uma geração bem-sucedida para manter o tracking de saldo.
 * Nunca lança — um erro de log não pode derrubar a resposta de sucesso.
 */
export async function logFalSpending({ userId, endpoint, creditsCharged }) {
  try {
    // Encontra o custo estimado em USD baseado no modelo
    const model = Object.values(MEDIA_MODELS).find((m) => m.endpoint === endpoint);
    const estimatedCost = model?.estimatedFalCostUsd ?? 0.10; // fallback conservador

    await queryD1(
      `CREATE TABLE IF NOT EXISTS fal_spending_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        endpoint TEXT NOT NULL DEFAULT '',
        estimated_cost REAL NOT NULL DEFAULT 0,
        credits_charged INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )`
    );

    await queryD1(
      `INSERT INTO fal_spending_log (user_id, endpoint, estimated_cost, credits_charged)
       VALUES (?, ?, ?, ?)`,
      [userId, endpoint, estimatedCost, creditsCharged || 0]
    );
  } catch (err) {
    console.error("[fal-spending] failed to log", { userId, endpoint, err: err?.message });
  }
}
