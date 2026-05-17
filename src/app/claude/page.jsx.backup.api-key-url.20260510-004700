const mcpUrl = "https://www.novvideos.online/api/claude/mcp";

const tools = [
  {
    name: "nova_generate_complete_landing_page",
    title: "Complete landing pages",
    body: "Claude can ask NOVA to generate a complete landing page with layout, copy, 4 AI-generated images and a ZIP export for Shopify Theme, Hydrogen/Oxygen, Next.js, React or HTML.",
  },
  {
    name: "nova_create_landing_page_design",
    title: "Landing page strategy",
    body: "Create the structure, sections, copy, visual direction and platform plan before generating the full export.",
  },
  {
    name: "nova_export_landing_page_zip",
    title: "Export ZIP packages",
    body: "Export usable files for HTML, React, Next.js, Hydrogen/Oxygen or Shopify Theme.",
  },
  {
    name: "nova_create_campaign",
    title: "Campaign creation",
    body: "Turn a product into positioning, hooks, UGC ideas, image prompts, video prompts and campaign direction.",
  },
  {
    name: "nova_generate_image",
    title: "Product images",
    body: "Use Claude as the creative director and NOVA as the image generation engine for product ads, banners and ecommerce visuals.",
  },
  {
    name: "nova_generate_video",
    title: "Short videos",
    body: "Generate product reveals, UGC-style ideas and cinematic social video concepts through NOVA.",
  },
];

const flow = [
  {
    title: "Using Claude AI",
    body: "Claude connects to NOVA through the MCP connector. This is external API usage, so it requires a NOVA API Key and NOVA API credits.",
  },
  {
    title: "Using NOVA dashboard",
    body: "When you generate directly inside NOVA, you do not need an API Key. Dashboard generation uses your internal NOVA credits.",
  },
  {
    title: "No credits?",
    body: "Claude receives a message telling the user to buy API credits. Inside NOVA, the user sees the upgrade/credits popup.",
  },
];

export default function ClaudeConnectorPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white md:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-lime-300/20 bg-white/[0.035] p-6 shadow-2xl md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-300">
            NOVA × Claude AI Connector
          </p>

          <h1 className="mt-5 max-w-5xl text-4xl font-black uppercase leading-[0.88] tracking-[-0.07em] md:text-7xl">
            Use Claude as the creative brain and NOVA as the execution engine.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-white/60 md:text-lg">
            Connect Claude AI to NOVA and generate campaigns, product images, short videos,
            and complete landing pages with AI-generated images and exportable files.
          </p>

          <div className="mt-8 rounded-3xl border border-lime-300/20 bg-lime-300/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
              Remote MCP Connector URL
            </p>
            <code className="mt-3 block break-all rounded-2xl bg-black/60 p-4 text-sm text-lime-300">
              {mcpUrl}
            </code>
            <p className="mt-4 text-sm leading-7 text-white/65">
              Add this URL inside Claude.ai as a custom connector. Claude Free users may be able to connect
              one custom connector if the feature is available in their account. Generation through Claude
              requires NOVA API credits and a NOVA API Key.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {flow.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-black/40 p-5">
                <h2 className="text-lg font-black tracking-[-0.03em]">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/60">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-300">
            What Claude can do with NOVA
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <div key={tool.name} className="rounded-3xl border border-white/10 bg-black/40 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-300">
                  {tool.name}
                </p>
                <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">{tool.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">{tool.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <h2 className="text-2xl font-black tracking-[-0.04em]">Claude AI usage</h2>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Use this when the user wants Claude to call NOVA externally. This requires
              API credits and a NOVA API Key.
            </p>
            <div className="mt-5 rounded-2xl bg-black/50 p-4 text-sm text-white/70">
              <p>Minimum API credit purchase: $10</p>
              <p>Complete landing page generation: 24 API credits</p>
              <p>Authentication: Authorization Bearer NOVA_API_KEY</p>
            </div>
            <a
              href="/checkout/api-credits?pack=starter"
              className="mt-5 inline-flex rounded-2xl bg-lime-300 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-black"
            >
              Buy API Credits
            </a>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <h2 className="text-2xl font-black tracking-[-0.04em]">NOVA dashboard usage</h2>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Use this when the user is logged into NOVA and wants to generate directly inside
              the platform. No API Key is required.
            </p>
            <div className="mt-5 rounded-2xl bg-black/50 p-4 text-sm text-white/70">
              <p>Credit wallet: internal NOVA credits</p>
              <p>Complete landing page generation: 24 internal credits</p>
              <p>No API Key required inside the dashboard</p>
            </div>
            <a
              href="/dashboard/landing-page"
              className="mt-5 inline-flex rounded-2xl bg-lime-300 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-black"
            >
              Open Landing Page Studio
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}
