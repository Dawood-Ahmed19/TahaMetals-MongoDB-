import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      employeeId,
      month,
      year,
      totalSalary,
      paidAmount = 0,
      balanceRemaining = totalSalary,
      fullyPaid = false,
    } = body;

    const db = await getDb();

    const match = {
      employeeId: new ObjectId(employeeId),
      month,
      year,
    };

    // create or overwrite safely
    const result = await db.collection("salaries").updateOne(
      match,
      {
        $set: {
          employeeId: new ObjectId(employeeId),
          month,
          year,
          totalSalary,
          paidAmount,
          balanceRemaining,
          fullyPaid,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true } // create new if not existing
    );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create or update salary record" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, payAmount } = body;
    const db = await getDb();

    const record = await db
      .collection("salaries")
      .findOne({ _id: new ObjectId(id) });
    if (!record)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const newPaid = record.paidAmount + payAmount;
    const newBalance = record.totalSalary - newPaid;

    await db.collection("salaries").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          paidAmount: newPaid,
          balanceRemaining: newBalance,
          fullyPaid: newBalance <= 0,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update salary" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await getDb();
    const salaries = await db
      .collection("salaries")
      .aggregate([
        {
          $lookup: {
            from: "employees",
            localField: "employeeId",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: "$employee" },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    return NextResponse.json(salaries);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch salaries" },
      { status: 500 }
    );
  }
}
