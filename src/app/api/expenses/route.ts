import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
const COLLECTION = "expenses";

export async function GET(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    if (!month) {
      const months = await db.collection(COLLECTION).distinct("month");
      return NextResponse.json({ success: true, months });
    }

    const doc = await db.collection(COLLECTION).findOne({ month });
    return NextResponse.json({
      success: true,
      expenses: doc?.entries || [],
    });
  } catch (err: any) {
    console.error("GET /api/expenses", err);
    return NextResponse.json({ success: false, message: err.message });
  }
}

export async function POST(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const { month, entries } = await req.json();

    if (!month) {
      return NextResponse.json({
        success: false,
        message: "Month is required",
      });
    }

    const result = await db.collection(COLLECTION).updateOne(
      { path: `expenses/${month}` },
      {
        $set: {
          month,
          path: `expenses/${month}`, // readable key
          entries: Array.isArray(entries) ? entries : [],
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("POST /api/expenses", err);
    return NextResponse.json({ success: false, message: err.message });
  }
}
