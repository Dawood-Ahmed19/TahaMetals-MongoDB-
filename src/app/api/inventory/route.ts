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
  price: number;
  date: string;
  index?: number;
  height?: string | null;
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
      price,
      height,
    } = await req.json();

    // ✅ Normalize values
    type = String(type).trim().toLowerCase();
    pipeType = String(pipeType || "")
      .trim()
      .toLowerCase();
    guage = guage ? String(guage).trim().toLowerCase() : "";
    gote = gote ? String(gote).trim().toLowerCase() : "";
    size = String(size).trim().toLowerCase();
    weight = Number(weight);
    quantity = Number(quantity);
    price = Number(price);

    let itemName = name; // Default to original name
    let itemIndex: number | undefined;

    const client = await clientPromise;
    const db = client.db("TahaMetals"); // change if needed
    const collection = db.collection<InventoryItem>("inventory");

    // ✅ Auto-generate Pipe Code
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

    // ✅ Check if item already exists
    const existingItem = await collection.findOne({
      name: itemName,
      type,
      pipeType,
      guage,
      gote,
      size,
      weight,
    });

    if (existingItem && existingItem._id) {
      const result = await collection.updateOne(
        { _id: new ObjectId(existingItem._id) },
        { $inc: { quantity }, $set: { date: new Date().toISOString() } }
      );

      if (result.modifiedCount > 0) {
        return NextResponse.json({
          success: true,
          message: "Quantity updated on existing item ✅",
          updatedId: existingItem._id.toString(),
        });
      } else {
        return NextResponse.json(
          { success: false, message: "Failed to update item ❌" },
          { status: 500 }
        );
      }
    }

    // ✅ Otherwise, insert new
    const newItem = await collection.insertOne({
      name: itemName,
      type,
      pipeType,
      guage,
      gote,
      size,
      weight,
      quantity,
      price,
      height: height || null,
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
        price,
        height: height || null,
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
