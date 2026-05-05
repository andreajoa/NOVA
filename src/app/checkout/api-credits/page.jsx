import ApiCreditsCheckoutClient from "./ApiCreditsCheckoutClient";

export const dynamic = "force-dynamic";

export default async function ApiCreditsCheckoutPage({ searchParams }) {
  const params = await searchParams;
  const pack = typeof params?.pack === "string" ? params.pack : "starter";

  return <ApiCreditsCheckoutClient initialPack={pack} />;
}
