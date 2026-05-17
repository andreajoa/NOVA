declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const GA_ID = "G-ES6ER30RY4"

function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return
  window.gtag?.(...args)
}

export function trackPageView(url: string) {
  gtag("event", "page_view", {
    send_to: GA_ID,
    page_path: url,
    page_location: typeof window !== "undefined" ? window.location.href : url,
    page_title: typeof document !== "undefined" ? document.title : undefined,
  })
}

export function trackViewItem(item: {
  item_id: string
  item_name: string
  item_category?: string
  value?: number
}) {
  gtag("event", "view_item", {
    send_to: GA_ID,
    currency: "USD",
    value: item.value,
    items: [item],
  })
}

export function trackViewItemList(listName: string, items: unknown[] = []) {
  gtag("event", "view_item_list", {
    send_to: GA_ID,
    item_list_name: listName,
    items,
  })
}

export function trackSelectItem(item: {
  item_id: string
  item_name: string
  item_category?: string
  value?: number
}) {
  gtag("event", "select_item", {
    send_to: GA_ID,
    item_list_name: item.item_category,
    items: [item],
  })
}

export function trackAddToCart(item: {
  item_id: string
  item_name: string
  item_category?: string
  price?: number
  quantity?: number
}) {
  gtag("event", "add_to_cart", {
    send_to: GA_ID,
    currency: "USD",
    value: item.price,
    items: [{ quantity: 1, ...item }],
  })
}

export function trackBeginCheckout(params: {
  plan?: string
  billing?: string
  pack?: string
  value?: number
  currency?: string
}) {
  gtag("event", "begin_checkout", {
    send_to: GA_ID,
    currency: params.currency || "USD",
    value: params.value,
    plan: params.plan,
    billing: params.billing,
    pack: params.pack,
  })
}

export function trackPurchase(params: {
  transaction_id?: string
  value?: number
  currency?: string
  plan?: string
  billing?: string
}) {
  gtag("event", "purchase", {
    send_to: GA_ID,
    transaction_id: params.transaction_id,
    value: params.value,
    currency: params.currency || "USD",
    plan: params.plan,
    billing: params.billing,
  })
}

export function trackSignUp(method = "email") {
  gtag("event", "sign_up", {
    send_to: GA_ID,
    method,
  })
}

export function trackLogin(method = "email") {
  gtag("event", "login", {
    send_to: GA_ID,
    method,
  })
}

export function trackGenerateContent(params: {
  model?: string
  mode?: string
  type?: string
  value?: number
}) {
  gtag("event", "generate_content", {
    send_to: GA_ID,
    model: params.model,
    mode: params.mode,
    type: params.type,
    value: params.value,
  })
}
