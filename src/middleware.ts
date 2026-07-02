import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const path = nextUrl.pathname;

  if (path.startsWith("/admin")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    if (role !== "SUPER_ADMIN") return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (path.startsWith("/store")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    if (role === "DELIVERY") return NextResponse.redirect(new URL("/driver", nextUrl));
    if (role !== "STORE_OWNER" && role !== "STORE_STAFF") {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
  }

  if (path.startsWith("/driver")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    if (role !== "DELIVERY") return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (path === "/login" && isLoggedIn && role === "DELIVERY") {
    return NextResponse.redirect(new URL("/driver", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/store/:path*", "/driver/:path*", "/login"],
};
