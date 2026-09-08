import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "portfolio_session";

/**
 * Redirect-only guard for the admin area.
 *
 * This runs in the Edge runtime and cannot reach the database, so it does no
 * more than check whether a session cookie is present. That is enough to send a
 * logged-out visitor to the login form instead of a flashing empty dashboard.
 *
 * It is deliberately NOT the authorisation boundary. A forged cookie gets past
 * this check and is then rejected by `requireAdmin()` in the admin layout and by
 * `requireAdminApi()` in every mutating route handler, both of which verify the
 * session against the database.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/admin/login") {
    if (hasCookie) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!hasCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    // Send the visitor back where they were headed after signing in.
    if (pathname !== "/admin") loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
