const BUILT_IN_ADMIN_EMAILS = [
  "anamacielboutique@gmail.com",
];

function splitList(value = "") {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeEmail(email = "") {
  return String(email || "").trim().toLowerCase();
}

export function novaAdminEmails() {
  return [
    ...BUILT_IN_ADMIN_EMAILS,
    ...splitList(process.env.NOVA_ADMIN_EMAILS),
    ...splitList(process.env.OWNER_EMAIL),
  ]
    .map(normalizeEmail)
    .filter(Boolean);
}

export function novaAdminUserIds() {
  return splitList(process.env.NOVA_ADMIN_USER_IDS);
}

export function isNovaAdminEmail(email) {
  const clean = normalizeEmail(email);
  if (!clean) return false;
  return novaAdminEmails().includes(clean);
}

export function isNovaAdminUserId(userId) {
  if (!userId) return false;
  return novaAdminUserIds().includes(String(userId).trim());
}

export function getEmailFromSessionClaims(sessionClaims = {}) {
  const direct =
    sessionClaims?.email ||
    sessionClaims?.emailAddress ||
    sessionClaims?.primary_email_address ||
    sessionClaims?.primaryEmailAddress?.emailAddress ||
    sessionClaims?.publicMetadata?.email ||
    sessionClaims?.privateMetadata?.email ||
    "";

  if (direct) return normalizeEmail(direct);

  const emails =
    sessionClaims?.email_addresses ||
    sessionClaims?.emailAddresses ||
    sessionClaims?.publicMetadata?.email_addresses ||
    [];

  if (Array.isArray(emails)) {
    const first = emails.find((item) =>
      typeof item === "string"
        ? item
        : item?.emailAddress || item?.email_address || item?.email
    );

    if (first) {
      return normalizeEmail(
        typeof first === "string"
          ? first
          : first.emailAddress || first.email_address || first.email
      );
    }
  }

  return "";
}

async function getClerkClientSafe() {
  try {
    const mod = await import("@clerk/nextjs/server");
    const client = mod.clerkClient;
    return typeof client === "function" ? await client() : client;
  } catch {
    return null;
  }
}

async function getUserEmailFromClerk(userId) {
  if (!userId) return "";

  try {
    const client = await getClerkClientSafe();
    const user = await client?.users?.getUser?.(userId);

    const primary =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.find?.((email) => email?.id === user?.primaryEmailAddressId)?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "";

    return normalizeEmail(primary);
  } catch {
    return "";
  }
}

async function getUserEmailFromD1(userId) {
  if (
    !userId ||
    !process.env.CLOUDFLARE_ACCOUNT_ID ||
    !process.env.CLOUDFLARE_D1_DATABASE_ID ||
    !process.env.CLOUDFLARE_API_TOKEN
  ) {
    return "";
  }

  const base = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_D1_DATABASE_ID}`;

  try {
    const res = await fetch(`${base}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sql: "SELECT email FROM users WHERE id = ? OR clerk_id = ? LIMIT 1",
        params: [userId, userId],
      }),
    });

    const json = await res.json().catch(() => ({}));
    const email = json?.result?.[0]?.results?.[0]?.email || "";
    return normalizeEmail(email);
  } catch {
    return "";
  }
}

export async function getUserEmailByClerkId(userId) {
  return (
    (await getUserEmailFromClerk(userId)) ||
    (await getUserEmailFromD1(userId)) ||
    ""
  );
}

export async function isNovaAdminUser(userId) {
  if (!userId) return false;
  if (isNovaAdminUserId(userId)) return true;

  const email = await getUserEmailByClerkId(userId);
  return isNovaAdminEmail(email);
}

export async function isNovaAdminFromAuth(userId, sessionClaims) {
  if (!userId) return false;
  if (isNovaAdminUserId(userId)) return true;

  const claimEmail = getEmailFromSessionClaims(sessionClaims);
  if (isNovaAdminEmail(claimEmail)) return true;

  return isNovaAdminUser(userId);
}

export function novaAdminBypassResult(extra = {}) {
  return {
    ok: true,
    adminBypass: true,
    charged: 0,
    currentBalance: 999999999,
    remainingBalance: 999999999,
    remainingCredits: 999999999,
    remainingApiCredits: 999999999,
    ...extra,
  };
}
