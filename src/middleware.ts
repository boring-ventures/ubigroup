import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Skip auth check for the auth callback route
  if (req.nextUrl.pathname.startsWith("/auth/callback")) {
    return res;
  }

  // If there's no user and the user is trying to access a protected route
  if (!user && req.nextUrl.pathname.startsWith("/dashboard")) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If there's a user and the user is trying to access auth routes
  if (
    user &&
    (req.nextUrl.pathname.startsWith("/sign-in") ||
      req.nextUrl.pathname.startsWith("/sign-up"))
  ) {
    // For middleware, we'll redirect to dashboard and let the dashboard page handle role-based rendering
    // This is simpler than trying to fetch user profile in middleware
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up", "/auth/callback"],
};
