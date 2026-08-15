import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/landing-page(.*)',
  // Descadastro precisa funcionar sem login — o Gmail chama o POST de
  // one-click direto, e quem clica no rodapé raramente está logado.
  '/api/crm/unsubscribe(.*)',
  // Cron do CRM: protegido por CRON_SECRET dentro da própria rota,
  // não pela sessão do Clerk (o Vercel Cron não tem sessão).
  '/api/cron(.*)',
  '/api/analytics/event(.*)',
  '/pricing(.*)',
  '/contact(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/cookies(.*)',
  '/explore(.*)',
  '/originals(.*)',
  '/generate(.*)',
  '/product-ad-generator(.*)',
  '/brandkit(.*)',
  '/claude(.*)',
  '/api/claude(.*)',
  '/sitemap.xml',
  '/robots.txt',
  '/googlef88c1df448f5c76f.html',
  '/ai(.*)',
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (req.nextUrl.pathname.startsWith('/api/webhooks')) {
    return NextResponse.next()
  }
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
