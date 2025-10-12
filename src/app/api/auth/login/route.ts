import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "replace_this_secret";

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { success: false, message: "Email, password, and role are required." },
        { status: 400 }
      );
    }

    console.log(
      "🔍 MONGODB_URI:",
      process.env.MONGODB_URI ? "Loaded ✅" : "Missing ❌"
    );
    console.log("🔍 MONGODB_DB:", process.env.MONGODB_DB || "Not found");

    const db = await getDb();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.role !== role) {
      return NextResponse.json(
        { success: false, message: `Invalid role selected for this account.` },
        { status: 403 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash || ""
    );
    if (!passwordMatches) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.isVerified === false) {
      return NextResponse.json(
        {
          success: false,
          message: "Please verify your email before logging in.",
        },
        { status: 403 }
      );
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    return NextResponse.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id.toString(),
        name: user.name || "Unnamed User",
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("❌ Login error:", err);
    return NextResponse.json(
      { success: false, message: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
