import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
const COLLECTION = "expenses";

export async function POST(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const { month } = await req.json();

    if (!month)
      return NextResponse.json({ success: false, message: "Month required" });

    const result = await db
      .collection(COLLECTION)
      .updateOne(
        { month },
        { $set: { status: "closed", closedAt: new Date() } }
      );

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("POST /api/expenses/close", err);
    return NextResponse.json({ success: false, message: err.message });
  }
}
