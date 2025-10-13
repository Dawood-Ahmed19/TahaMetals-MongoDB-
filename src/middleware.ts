import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "replace_this_secret";

const encoder = new TextEncoder();
const secret = encoder.encode(JWT_SECRET);

const roleAccessMap = {
  admin: [
    "/Dashboard",
    "/Inventory",
    "/addItem",
    "/Invoice",
    "/Reports",
    "/Returned",
    "/Ratelist",
    "/Expenses",
    "/Settings",
    "/Salary",
    "/AddSalary",
    "/admin",
  ],
  user: [
    "/Dashboard",
    "/Inventory",
    "/addItem",
    "/Invoice",
    "/Returned",
    "/Settings",
    "/Expenses",
  ],
};

async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    console.error("❌ JWT verification failed:", err);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("authToken")?.value;
  const pathname = req.nextUrl.pathname;

  console.log("🔍 Middleware triggered for path:", pathname);
  console.log("🔍 Token present:", !!token);

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/Login";
    return NextResponse.redirect(url);
  }

  const decoded: any = await verifyJWT(token);
  if (!decoded) {
    const url = req.nextUrl.clone();
    url.pathname = "/Login";
    return NextResponse.redirect(url);
  }

  const role = (decoded.role || "guest").toString().toLowerCase();
  console.log("✅ Decoded JWT:", decoded);

  const allowedPaths = roleAccessMap[role as keyof typeof roleAccessMap] || [];
  const hasAccess = allowedPaths.some((p) => pathname.startsWith(p));

  if (!hasAccess) {
    console.warn(`🚫 Role '${role}' cannot access ${pathname}`);
    const url = req.nextUrl.clone();
    url.pathname = "/Dashboard";
    return NextResponse.redirect(url);
  }

  console.log("✅ Access granted for role:", role);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/Dashboard/:path*",
    "/Inventory/:path*",
    "/addItem/:path*",
    "/Invoice/:path*",
    "/Reports/:path*",
    "/Returned/:path*",
    "/Ratelist/:path*",
    "/Expenses/:path*",
    "/Settings/:path*",
    "/Salary/:path*",
    "/AddSalary/:path*",
    "/admin/:path*",
  ],
};
