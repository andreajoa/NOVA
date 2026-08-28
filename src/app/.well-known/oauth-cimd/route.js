import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const origin = req.nextUrl.origin;
  const clientId = `${origin}/.well-known/oauth-cimd`;

  return NextResponse.json(
    {
      client_id: clientId,
      client_name: "NOVA AI",
      redirect_uris: [`${origin}/oauth/callback/huggingface`],
      token_endpoint_auth_method: "none",
      client_uri: origin,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    }
  );
}
