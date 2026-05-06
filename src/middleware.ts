import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
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
  '/settings(.*)',
  '/sitemap.xml',
  '/robots.txt',
  '/googlef88c1df448f5c76f.html',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
