import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface InventoryItem {
  _id?: string | ObjectId;
  name: string;
  type: string;
  pipeType?: string;
  guage?: string | number;
  gote?: string | number;
  size: string;
  weight: number;
  quantity: number;
  pricePerKg?: number | null; // ✅ make them safe
  pricePerUnit?: number | null; // ✅ make them safe
  date: string;
  index?: number;
  height?: string | null;
  color?: string; // ✅ add this
}

export async function POST(req: Request) {
  try {
    let {
      name,
      type,
      pipeType,
      guage,
      gote,
      size,
      weight,
      quantity,
      pricePerKg,
      pricePerUnit,
      height,
      color,
    } = await req.json();

    // ✅ Normalize
    type = String(type).trim().toLowerCase();
    pipeType = String(pipeType || "")
      .trim()
      .toLowerCase();
    guage = guage ? String(guage).trim().toLowerCase() : "";
    gote = gote ? String(gote).trim().toLowerCase() : "";
    size = String(size).trim().toLowerCase();
    weight = Number(weight);
    quantity = Number(quantity);
    pricePerKg = pricePerKg ? Number(pricePerKg) : null;
    pricePerUnit = pricePerUnit ? Number(pricePerUnit) : null;

    // ✅ Calculate pricePerUnit if pricePerKg is provided
    if (pricePerKg && quantity > 0 && weight > 0) {
      const unitWeight = weight / quantity;
      pricePerUnit = Number((unitWeight * pricePerKg).toFixed(2));
    }

    let itemName = name;
    let itemIndex: number | undefined;

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const collection = db.collection<InventoryItem>("inventory");

    // Auto-generate Pipe Code for pipes
    if (type === "pipe") {
      const lastPipes = await collection
        .find({ type: "pipe" })
        .sort({ index: -1 })
        .limit(1)
        .toArray();

      const nextNumber =
        lastPipes.length > 0 && lastPipes[0].index !== undefined
          ? lastPipes[0].index + 1
          : 1;

      itemName = `p${String(nextNumber).padStart(3, "0")}`;
      itemIndex = nextNumber;
    }

    // Insert new item
    const newItem = await collection.insertOne({
      name: itemName,
      type,
      pipeType,
      guage,
      gote,
      size,
      weight,
      quantity,
      pricePerKg,
      pricePerUnit,
      height: height || null,
      color: color || "",
      index: itemIndex,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "New item created ✅",
      item: {
        _id: newItem.insertedId.toString(),
        name: itemName,
        type,
        pipeType,
        guage,
        gote,
        size,
        weight,
        quantity,
        pricePerKg,
        pricePerUnit,
        height: height || null,
        color: color || "",
        index: itemIndex,
        date: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error in inventory POST:", err);
    return NextResponse.json(
      { success: false, error: "Failed to add/update item ❌" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const collection = db.collection<InventoryItem>("inventory");

    const items = await collection.find({}).toArray();

    // Convert ObjectId → string for frontend
    const safeItems = items.map((item) => ({
      ...item,
      _id: item._id?.toString(),
    }));

    return NextResponse.json({ success: true, items: safeItems });
  } catch (err) {
    console.error("Error fetching inventory:", err);
    return NextResponse.json({ success: false, items: [] }, { status: 500 });
  }
}
