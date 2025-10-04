import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!month || !year)
      return NextResponse.json({
        success: false,
        message: "Month and year are required",
      });

    const client = await clientPromise;
    const db = client.db();

    const key = `${year}-${String(month).padStart(2, "0")}`;
    const doc = await db.collection("expenses").findOne({ month: key });
    const totalExpenses = doc
      ? doc.entries.reduce(
          (sum: number, e: any) => sum + (Number(e.amount) || 0),
          0
        )
      : 0;

    return NextResponse.json({ success: true, totalExpenses });
  } catch (err: any) {
    console.error("Error in /api/reports/monthly-expenses:", err);
    return NextResponse.json({ success: false, message: err.message });
  }
}
