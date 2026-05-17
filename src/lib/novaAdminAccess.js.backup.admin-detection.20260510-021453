const BUILT_IN_ADMIN_EMAILS = [
  "anamacielboutique@gmail.com",
];

function splitList(value = "") {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function novaAdminEmails() {
  return [
    ...BUILT_IN_ADMIN_EMAILS,
    ...splitList(process.env.NOVA_ADMIN_EMAILS),
    ...splitList(process.env.OWNER_EMAIL),
  ]
    .map((email) => email.toLowerCase())
    .filter(Boolean);
}

export function novaAdminUserIds() {
  return splitList(process.env.NOVA_ADMIN_USER_IDS);
}

export function isNovaAdminEmail(email) {
  if (!email) return false;
  return novaAdminEmails().includes(String(email).trim().toLowerCase());
}

export function isNovaAdminUserId(userId) {
  if (!userId) return false;
  return novaAdminUserIds().includes(String(userId).trim());
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

export async function getUserEmailByClerkId(userId) {
  if (!userId) return "";

  try {
    const client = await getClerkClientSafe();
    const user = await client?.users?.getUser?.(userId);

    const primary =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.find?.((email) => email?.id === user?.primaryEmailAddressId)?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "";

    return String(primary || "").trim().toLowerCase();
  } catch {
    return "";
  }
}

export async function isNovaAdminUser(userId) {
  if (!userId) return false;
  if (isNovaAdminUserId(userId)) return true;

  const email = await getUserEmailByClerkId(userId);
  return isNovaAdminEmail(email);
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
