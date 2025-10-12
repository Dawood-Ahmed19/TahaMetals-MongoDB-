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

    // 1️⃣ fetch stored expense entries
    const doc = await db.collection(COLLECTION).findOne({ month });
    const currentEntries = doc?.entries || [];

    // 2️⃣ calculate total salaries actually paid this month
    const salaryAgg = await db
      .collection("salaries")
      .aggregate([
        { $match: { month } },
        {
          $group: {
            _id: null,
            totalPaid: {
              $sum: {
                $add: ["$paidAmount", "$advancePaid"],
              },
            },
          },
        },
      ])
      .toArray();

    const salaryTotal = salaryAgg.length > 0 ? salaryAgg[0].totalPaid : 0;

    // 3️⃣ update / insert the “Employee Salaries” row
    const other = currentEntries.filter(
      (e: any) => e.description !== "Employee Salaries"
    );

    const salaryRow = {
      date: new Date().toISOString().split("T")[0],
      description: "Employee Salaries",
      amount: salaryTotal,
    };

    const mergedEntries = [...other, salaryRow];

    // 4️⃣ upsert the merged set back into expenses
    await db.collection(COLLECTION).updateOne(
      { month },
      {
        $set: {
          month,
          path: `expenses/${month}`,
          entries: mergedEntries,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      expenses: mergedEntries,
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
