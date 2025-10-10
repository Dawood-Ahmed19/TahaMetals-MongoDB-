import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const items = await db.collection("hardware_items").find().toArray();
    return NextResponse.json({ success: true, items });
  } catch (err) {
    console.error("❌ Error fetching hardware items:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch hardware items" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      sizes = {},
      colors = [],
      pipeTypes = [],
      priceType = "unit",
      hasPipeTypes = true,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    const normalizedSizes: any = hasPipeTypes
      ? {
          Round: sizes.Round || sizes.round || [],
          Square: sizes.Square || sizes.square || [],
        }
      : { general: sizes.general || [] };

    const db = await getDb();

    await db.collection("hardware_items").insertOne({
      name: name.trim(),
      sizes: normalizedSizes,
      colors,
      pipeTypes,
      priceType,
      hasPipeTypes,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Hardware item added successfully",
    });
  } catch (err) {
    console.error("❌ Error inserting hardware item:", err);
    return NextResponse.json(
      { success: false, message: "Failed to save hardware item" },
      { status: 500 }
    );
  }
}
