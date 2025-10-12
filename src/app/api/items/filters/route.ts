import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const col = db.collection("inventory");

    const rawSizes = await col.distinct("size");
    const rawGuages = await col.distinct("guage");

    const sizes = rawSizes
      .filter((s) => s !== null && s !== undefined && s !== "")
      .map((s) => String(s));
    const guages = rawGuages
      .filter((g) => g !== null && g !== undefined && g !== "")
      .map((g) => String(g));

    const uniqueSizes = Array.from(new Set(sizes.map((s) => s.trim())));
    const uniqueGuages = Array.from(new Set(guages.map((g) => g.trim())));

    return NextResponse.json({
      success: true,
      sizes: ["All", ...uniqueSizes],
      guages: ["All", ...uniqueGuages],
    });
  } catch (e) {
    console.error("❌ Error reading inventory filters:", e);
    return NextResponse.json(
      { success: false, error: "Failed to load filter options" },
      { status: 500 }
    );
  }
}
