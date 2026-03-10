import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_SESSION_COOKIE } from "@/lib/auth/constants";

const protectedPrefixes = [
  "/dashboard",
  "/customer-management",
  "/threads",
  "/weekly-reports",
  "/account-management",
  "/my-account",
];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(AUTH_SESSION_COOKIE)?.value);
  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirectTo", `${pathname}${search || ""}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customer-management/:path*",
    "/threads/:path*",
    "/weekly-reports/:path*",
    "/account-management/:path*",
    "/my-account/:path*",
  ],
};
