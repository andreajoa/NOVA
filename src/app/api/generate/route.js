export async function POST(req) {
  const body = await req.json();

  const { endpoint, prompt } = body;

  console.log("REQUEST:", { endpoint, prompt });

  // 🔥 MOCK RESPONSE (sem usar fal ainda)
  return Response.json({
    success: true,
    data: {
      type: endpoint.includes("video") ? "video" : "image",
      url: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4"
    }
  });
}
