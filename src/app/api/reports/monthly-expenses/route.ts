import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!month || !year) {
      return NextResponse.json({
        success: false,
        message: "Month and year are required",
      });
    }

    const db = await getDb();

    // key format: YYYY-MM (e.g. "2025-10")
    const key = `${year}-${String(month).padStart(2, "0")}`;

    // 1️⃣  sum up all expense amounts for that month
    const doc = await db.collection("expenses").findOne({ month: key });
    const monthlyExpenses = doc?.entries?.length
      ? doc.entries.reduce(
          (sum: number, e: any) => sum + (Number(e.amount) || 0),
          0
        )
      : 0;

    // 2️⃣  total all salaries & advances actually paid for that month
    const salaryAgg = await db
      .collection("salaries")
      .aggregate([
        { $match: { month: key } },
        {
          $group: {
            _id: null,
            totalPaid: {
              // ensure both fields are numeric even if stored as strings
              $sum: {
                $add: [
                  { $toDouble: { $ifNull: ["$paidAmount", 0] } },
                  { $toDouble: { $ifNull: ["$advancePaid", 0] } },
                ],
              },
            },
          },
        },
      ])
      .toArray();

    const salariesPaid = salaryAgg.length ? salaryAgg[0].totalPaid : 0;

    // 3️⃣  total outgoing = expenses + salaries
    const grandTotalExpenses = monthlyExpenses + salariesPaid;

    return NextResponse.json({
      success: true,
      month: key,
      monthlyExpenses, // individual expense total
      salariesPaid, // total salaries/advances
      grandTotalExpenses, // combined total for reports
    });
  } catch (err: any) {
    console.error("Error in /api/reports/monthly-expenses:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
