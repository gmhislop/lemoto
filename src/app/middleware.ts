import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/app/utils/supabase/middleware";
import appConfig from "@/app/config";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  
  // For future subdomain migration: redirect /app/* to app.lemoto.com
  if (pathname.startsWith("/app/") && process.env.NODE_ENV === "production") {
    const isMainDomain = host === appConfig.domain || host === `www.${appConfig.domain}`;
    if (isMainDomain) {
      // Redirect /app/* routes to app subdomain
      const appUrl = new URL(pathname, appConfig.appUrl);
      appUrl.search = request.nextUrl.search;
      return NextResponse.redirect(appUrl);
    }
  }
  
  // Set headers for different route groups (for asset/header separation)
  const response = await updateSession(request);
  
  if (pathname.startsWith("/app/")) {
    // App routes - minimal marketing assets
    response.headers.set("X-Route-Type", "app");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  } else if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    // Auth routes
    response.headers.set("X-Route-Type", "auth");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  } else {
    // Marketing routes
    response.headers.set("X-Route-Type", "marketing");
    // Allow indexing for marketing pages
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
