import crypto from "crypto"
import {
  createApiKeyRow,
  findApiKeyByHash,
  listApiKeysByUser,
  revokeApiKeyById,
  touchApiKeyLastUsed,
} from "@/lib/db"

export function generatePlainApiKey() {
  return `nv_live_sk_${crypto.randomBytes(32).toString("base64url")}`
}

export function hashApiKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex")
}

export function getApiKeyPublicParts(key: string) {
  return {
    keyPrefix: key.slice(0, 10),
    keySuffix: key.slice(-4),
  }
}

export function serializeApiKey(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name),
    keyPrefix: String(row.key_prefix),
    keySuffix: String(row.key_suffix),
    createdAt: Number(row.created_at),
    lastUsedAt: row.last_used_at ? Number(row.last_used_at) : null,
    revokedAt: row.revoked_at ? Number(row.revoked_at) : null,
  }
}

export async function listUserApiKeys(userId: string) {
  const rows = await listApiKeysByUser(userId)
  return rows.map(serializeApiKey)
}

export async function createUserApiKey(userId: string, name: string) {
  const secret = generatePlainApiKey()
  const { keyPrefix, keySuffix } = getApiKeyPublicParts(secret)

  const row = await createApiKeyRow({
    id: crypto.randomUUID(),
    userId,
    name,
    keyHash: hashApiKey(secret),
    keyPrefix,
    keySuffix,
  })

  if (!row) throw new Error("Failed to create API key")

  return {
    key: serializeApiKey(row),
    secret,
  }
}

export async function revokeUserApiKey(id: string, userId: string) {
  return revokeApiKeyById(id, userId)
}

export async function validateApiKeyFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization") || ""

  if (!authHeader.startsWith("Bearer ")) return null

  const secret = authHeader.replace("Bearer ", "").trim()

  if (!secret.startsWith("nv_live_sk_")) return null

  const keyHash = hashApiKey(secret)
  const row = await findApiKeyByHash(keyHash)

  if (!row) return null

  await touchApiKeyLastUsed(String(row.id))

  return {
    userId: String(row.user_id),
    apiKeyId: String(row.id),
    name: String(row.name),
  }
}
