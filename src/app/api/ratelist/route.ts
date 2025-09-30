import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json();
    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { success: false, message: "Invalid data" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const collection = db.collection("ratelist");

    const bulkOps = rows.map((row: any) => ({
      updateOne: {
        filter: {
          name: row.name,
          size: row.size ?? "",
          guage: row.guage ?? "",
        },
        update: {
          $set: {
            name: row.name,
            size: row.size ?? "",
            guage: row.guage ?? "",
            rate: row.rate,
            ratePerUnit: row.ratePerUnit,
            quantity: row.quantity ?? 1,
          },
        },
        upsert: true,
      },
    }));

    const result = await collection.bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const collection = db.collection("ratelist");

    const items = await collection.find({}).toArray();
    return NextResponse.json({ success: true, items });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
