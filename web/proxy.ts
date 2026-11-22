import { NextResponse, type NextRequest } from "next/server";
import { getNeonAuth, hasAuthServerConfig } from "@/lib/auth/server";

export async function proxy(request: NextRequest) {
  if (!hasAuthServerConfig()) {
    const loginUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return getNeonAuth().middleware({
    loginUrl: "/sign-in",
  })(request);
}

export default proxy;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/analyses/:path*",
    "/history/:path*",
    "/settings/:path*",
  ],
};
