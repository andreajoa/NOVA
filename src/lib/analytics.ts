declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(args)
}

export function trackPageView(url: string) {
  gtag("event", "page_view", { page_path: url })
}

export function trackViewContent(data: {
  content_name: string
  content_category?: string
  value?: number
  currency?: string
}) {
  gtag("event", "view_item", {
    currency: data.currency ?? "USD",
    value: data.value ?? 0,
    items: [{ item_name: data.content_name, item_category: data.content_category ?? "AI Video" }],
  })
}

export function trackViewItemList(items: { name: string; price: number }[]) {
  gtag("event", "view_item_list", {
    item_list_name: "Pricing Plans",
    items: items.map((i) => ({ item_name: i.name, price: i.price })),
  })
}

export function trackSelectItem(data: {
  item_name: string
  price: number
  currency?: string
}) {
  gtag("event", "select_item", {
    items: [{ item_name: data.item_name, price: data.price, currency: data.currency ?? "USD" }],
  })
}

export function trackAddToCart(data: {
  item_name: string
  value: number
  currency?: string
  quantity?: number
}) {
  gtag("event", "add_to_cart", {
    currency: data.currency ?? "USD",
    value: data.value,
    items: [{ item_name: data.item_name, price: data.value, quantity: data.quantity ?? 1 }],
  })
}

export function trackBeginCheckout(data: {
  value: number
  currency?: string
  plan?: string
  coupon?: string
}) {
  gtag("event", "begin_checkout", {
    currency: data.currency ?? "USD",
    value: data.value,
    coupon: data.coupon ?? "",
    items: [{ item_name: data.plan ?? "Nova Plan", item_category: "Subscription", price: data.value, quantity: 1 }],
  })
}

export function trackPurchase(data: {
  transaction_id: string
  value: number
  currency?: string
  plan?: string
  coupon?: string
}) {
  gtag("event", "purchase", {
    transaction_id: data.transaction_id,
    currency: data.currency ?? "USD",
    value: data.value,
    coupon: data.coupon ?? "",
    items: [{ item_name: data.plan ?? "Nova Plan", item_category: "Subscription", price: data.value, quantity: 1 }],
  })
}

export function trackApiCreditPurchase(data: {
  pack: string
  value: number
  credits: number
}) {
  gtag("event", "purchase", {
    transaction_id: `api_credits_${Date.now()}`,
    currency: "USD",
    value: data.value,
    items: [{ item_name: `API Credits - ${data.pack}`, item_category: "API Credits", price: data.value, quantity: data.credits }],
  })
}

export function trackSignUp(method = "email") {
  gtag("event", "sign_up", { method })
}

export function trackLogin(method = "email") {
  gtag("event", "login", { method })
}

export function trackGenerate(data: {
  model: string
  mode: string
  type?: "video" | "image"
}) {
  gtag("event", "generate_content", {
    model: data.model,
    mode: data.mode,
    content_type: data.type ?? "video",
  })
}
