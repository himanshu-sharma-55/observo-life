import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth");

  const isAuthContinue = pathname.startsWith("/auth/continue");
  const isSetPassword = pathname.startsWith("/set-password");

  if (!isLoggedIn && !isPublic && !isSetPassword && !isAuthContinue) {
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (!isLoggedIn && (isSetPassword || isAuthContinue)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
    // Same rule as Google continue: missing password → ask, else feed.
    if (req.auth?.needsPasswordSetup) {
      return NextResponse.redirect(new URL("/set-password", req.url));
    }
    return NextResponse.redirect(new URL("/feed", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)"],
};
