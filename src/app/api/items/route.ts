import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
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
  price?: number;
  date: string;
  index?: number;
  height?: string | null;
  uniqueKey?: string;
}

// 🔹 Normalize item (for duplicate check)
function normalizeItem(item: any) {
  const name = (item.name || "").trim().toLowerCase();
  const size = String(item.size ?? "")
    .trim()
    .toLowerCase();
  const guage = String(item.guage ?? "")
    .trim()
    .toLowerCase();
  const pipeType = String(item.pipeType ?? "")
    .trim()
    .toLowerCase();
  const type = String(item.type ?? "")
    .trim()
    .toLowerCase();

  const uniqueKey = `${name}_${size}_${guage}_${pipeType}`;

  return {
    ...item,
    name,
    size,
    guage,
    pipeType,
    type,
    uniqueKey,
  };
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const collection = db.collection<InventoryItem>("inventory");

    const items = await collection.find({}).toArray();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const normalized = normalizeItem(body);

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const collection = db.collection<InventoryItem>("inventory");

    const existingItem = await collection.findOne({
      uniqueKey: normalized.uniqueKey,
    });

    if (existingItem) {
      const addedQty = Number(normalized.quantity ?? 0);

      // calculate unit weight
      const unitWeight =
        existingItem.quantity > 0
          ? existingItem.weight / existingItem.quantity
          : 0;

      const newQuantity = existingItem.quantity + addedQty;
      const newWeight = unitWeight * newQuantity;

      const result = await collection.updateOne(
        { _id: existingItem._id },
        {
          $set: {
            quantity: newQuantity,
            weight: newWeight,
            date: new Date().toISOString(),
          },
        }
      );

      return NextResponse.json(
        {
          success: result.modifiedCount > 0,
          item: { ...existingItem, quantity: newQuantity, weight: newWeight },
        },
        { status: 200 }
      );
    }

    let itemName = normalized.name;
    let itemIndex: number | undefined;

    if (!itemName && normalized.type?.toLowerCase() === "pipe") {
      const lastPipe = await collection
        .find({ type: "pipe" })
        .sort({ index: -1 })
        .limit(1)
        .toArray();

      const nextNumber =
        lastPipe.length > 0 && lastPipe[0].index !== undefined
          ? lastPipe[0].index + 1
          : 1;

      itemName = `p${String(nextNumber).padStart(3, "0")}`;
      normalized.name = itemName;
      normalized.index = nextNumber;
      itemIndex = nextNumber;
    }

    // ✅ Insert new item
    const newItem = await collection.insertOne({
      ...normalized,
      name: normalized.name,
      index: itemIndex ?? 1,
      quantity: Number(normalized.quantity ?? 0),
      date: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, item: { _id: newItem.insertedId, ...normalized } },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error saving item:", err);
    return NextResponse.json(
      { success: false, error: "Failed to save item" },
      { status: 500 }
    );
  }
}

// ✅ PATCH (deduct stock)
export async function PATCH(req: Request) {
  try {
    const { name, qty, weight } = await req.json();

    if (!name || qty == null || weight == null) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const collection = db.collection<InventoryItem>("inventory");

    // Find item by name
    const item = await collection.findOne({ name });
    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    const currentQuantity = Number(item.quantity) || 0;
    const currentWeight = Number(item.weight) || 0;
    const soldQty = Number(qty) || 0;
    const soldWeight = Number(weight) || 0;

    const newQuantity = Math.max(currentQuantity - soldQty, 0);
    const newWeight = Math.max(currentWeight - soldWeight, 0);

    await collection.updateOne(
      { _id: item._id },
      {
        $set: {
          quantity: newQuantity,
          weight: newWeight,
          date: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      updated: { name, newQuantity, newWeight },
    });
  } catch (err) {
    console.error("Error deducting inventory:", err);
    return NextResponse.json(
      { success: false, error: "Failed to deduct stock" },
      { status: 500 }
    );
  }
}
