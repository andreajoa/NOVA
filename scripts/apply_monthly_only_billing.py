from pathlib import Path


pricing = Path("src/app/pricing/page.jsx")
text = pricing.read_text(encoding="utf-8")

for marker in [
    '      "70 credits/mo",',
    '      "500 credits/mo",',
    '      "3,000 credits/mo",',
    '      "3,000 credits in total/mo",',
]:
    if marker not in text:
        raise SystemExit(f"Pricing feature marker not found: {marker}")
    text = text.replace(marker, marker + '\n      "20 NOVA VIDEO generations/mo",', 1)

text = text.replace('function PlanCard({ plan, annual }) {', 'function PlanCard({ plan }) {', 1)
text = text.replace('  const displayPrice = annual ? plan.price : plan.monthlyPrice;\n', '  const displayPrice = plan.monthlyPrice;\n', 1)
text = text.replace('  const displayOldPrice = annual ? plan.oldPrice : "";\n', '  const displayOldPrice = "";\n', 1)
text = text.replace('  const displayBilling = annual ? plan.billing : "per month, billed monthly";\n', '  const displayBilling = "per month, billed monthly";\n', 1)
text = text.replace('  const displayHighlight = annual ? plan.highlight : "No annual commitment";\n', '  const displayHighlight = "Renews monthly · cancel anytime";\n', 1)
text = text.replace('href={`/checkout/plan?plan=${plan.name.toLowerCase()}&billing=${annual ? "annual" : "monthly"}`}', 'href={`/checkout/plan?plan=${plan.name.toLowerCase()}&billing=monthly`}', 1)
text = text.replace('  const [annual, setAnnual] = useState(true);\n', '', 1)
text = text.replace('<Pill>Limited Time</Pill>', '<Pill>Monthly Plans</Pill>', 1)
text = text.replace('Create without limits. Save more.', 'Create with a simple monthly subscription.', 1)
text = text.replace('Get <span className="font-black text-[#D7FF00]">30% OFF</span> on annual NOVA plans — including high limits, premium models and Unlimited video generation.', 'Choose the NOVA plan that fits your workflow. Paid plans renew automatically every month until you cancel.', 1)
text = text.replace('30% Off Annual Plans', 'View Monthly Plans', 1)

old_toggle = '''          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[.035] px-4 py-2 text-xs text-white/45">
            <span>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative h-6 w-11 rounded-full transition ${annual ? "bg-[#D7FF00]" : "bg-white/20"}`}
              aria-label="Toggle annual billing"
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full transition ${annual ? "left-6 bg-black" : "left-1 bg-white"}`} />
            </button>
            <span className="font-bold text-white">Annual</span>
            <Pill>30% Off</Pill>
          </div>
'''
new_toggle = '''          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[.035] px-4 py-2 text-xs text-white/55">
            <span className="font-bold text-white">Monthly billing</span>
            <span>·</span>
            <span>Renews automatically</span>
            <span>·</span>
            <span>Cancel anytime</span>
          </div>
'''
if old_toggle not in text:
    raise SystemExit("Annual pricing toggle not found")
text = text.replace(old_toggle, new_toggle, 1)
text = text.replace('<PlanCard key={plan.name} plan={plan} annual={annual} />', '<PlanCard key={plan.name} plan={plan} />', 1)
text = text.replace('<div className="p-4">Annual 30% Off</div>', '<div className="p-4">Monthly plans</div>', 1)

generic_faq = '                  NOVA plans are designed for AI video and image generation. Credits, Unlimited access and model availability may vary depending on the selected plan and model usage.\n'
faq_answer = '''                  {question === "Is my subscription automatically renewed?"
                    ? "Yes. Every paid NOVA plan renews automatically each month on the saved payment method until you cancel. The new monthly allowance is released after the renewal payment is successfully approved."
                    : question === "How many videos can I generate?"
                      ? "NOVA VIDEO includes 10 generations per calendar month on Free and 20 generations per paid monthly cycle on every paid plan. Admin accounts remain unlimited."
                      : "NOVA plans are designed for AI video and image generation. Credits, Unlimited access and model availability may vary depending on the selected plan and model usage."}
'''
if generic_faq not in text:
    raise SystemExit("FAQ answer marker not found")
text = text.replace(generic_faq, faq_answer, 1)

for value in ["setAnnual", "annual={annual}", "30% Off Annual", "Annual 30% Off", "Toggle annual billing"]:
    if value in text:
        raise SystemExit(f"Annual pricing UI remains: {value}")

pricing.write_text(text, encoding="utf-8")

checkout = Path("src/app/api/checkout/plans/session/route.ts")
text = checkout.read_text(encoding="utf-8")
old_map = '''const PRICE_MAP: Record<string, string> = {
  basic_monthly:    "price_1TTbBXPsIezuzlaECvxgoy59",
  basic_annual:     "price_1TTbElPsIezuzlaEdfyVUJw7",
  plus_monthly:     "price_1TTbORPsIezuzlaEwyo0LYhF",
  plus_annual:      "price_1TTbQHPsIezuzlaE7gXw5TEb",
  ultra_monthly:    "price_1TTbVuPsIezuzlaEiJP3ukGR",
  ultra_annual:     "price_1TTbbDPsIezuzlaESnMNcqne",
  business_monthly: "price_1TTbkxPsIezuzlaEysolpSAz",
  business_annual:  "price_1TTbirPsIezuzlaECJ38sSiO",
};
'''
new_map = '''const PRICE_MAP: Record<string, string> = {
  basic: "price_1TTbBXPsIezuzlaECvxgoy59",
  plus: "price_1TTbORPsIezuzlaEwyo0LYhF",
  ultra: "price_1TTbVuPsIezuzlaEiJP3ukGR",
  business: "price_1TTbkxPsIezuzlaEysolpSAz",
};
'''
if old_map not in text:
    raise SystemExit("Checkout price map marker not found")
text = text.replace(old_map, new_map, 1)
old_body = '''    const { plan, billing } = await req.json();
    const key = `${plan}_${billing}`;
    const priceId = PRICE_MAP[key];

    if (!priceId) {
      return NextResponse.json({ error: `Invalid plan: ${key}` }, { status: 400 });
    }
'''
new_body = '''    const body = await req.json();
    const plan = String(body?.plan || "").toLowerCase();
    const billing = "monthly";
    const priceId = PRICE_MAP[plan];

    if (!priceId) {
      return NextResponse.json({ error: `Invalid plan: ${plan}` }, { status: 400 });
    }
'''
if old_body not in text:
    raise SystemExit("Checkout request marker not found")
text = text.replace(old_body, new_body, 1)
if "_annual" in text:
    raise SystemExit("Annual Stripe price remains in new checkout route")
checkout.write_text(text, encoding="utf-8")

print("Monthly-only NOVA billing patch applied")
