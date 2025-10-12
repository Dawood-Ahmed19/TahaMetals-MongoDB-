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
  pricePerKg?: number | null;
  pricePerUnit?: number | null;
  date: string;
  index?: number;
  height?: string | null;
  color?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Incoming body →", body);

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
    } = body;

    // Normalize
    type = String(type || "")
      .trim()
      .toLowerCase();
    pipeType = String(pipeType || "")
      .trim()
      .toLowerCase();
    guage = guage ? String(guage).trim().toLowerCase() : "";
    gote = gote ? String(gote).trim().toLowerCase() : "";
    size = String(size || "")
      .trim()
      .toLowerCase();

    weight = Number(weight) || 0;
    quantity = Number(quantity) || 0;
    pricePerKg = pricePerKg ? Number(pricePerKg) : null;
    pricePerUnit = pricePerUnit ? Number(pricePerUnit) : null;

    if (pricePerKg && quantity > 0 && weight > 0) {
      const unitWeight = weight / quantity;
      pricePerUnit = Number((unitWeight * pricePerKg).toFixed(2));
    }

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const collection = db.collection<InventoryItem>("inventory");

    let itemName = name?.trim() || "";
    let itemIndex: number | undefined;

    // Auto-generate for pipes
    if (type === "pipe") {
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
      itemIndex = nextNumber;
    }

    // Auto-generate for pillars (singular OR plural)
    if (type === "pillar" || type === "pillars") {
      const lastPillar = await collection
        .find({ type: { $in: ["pillar", "pillars"] } })
        .sort({ index: -1 })
        .limit(1)
        .toArray();

      const nextNumber =
        lastPillar.length > 0 && lastPillar[0].index !== undefined
          ? lastPillar[0].index + 1
          : 1;

      itemName = `pl${String(nextNumber).padStart(3, "0")}`;
      itemIndex = nextNumber;
    }

    // Always fallback to avoid empty names
    if (!itemName) {
      itemName = "unnamed";
    }

    console.log("✅ Final type:", type, "→ Generated name:", itemName);

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
      message: "Item created ✅",
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
    console.error("❌ Error in inventory POST:", err);
    return NextResponse.json(
      { success: false, error: "Failed to add item ❌" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const collection = db.collection<InventoryItem>("inventory");

    let filter: any = {};

    if (search && search.trim()) {
      filter = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { type: { $regex: search, $options: "i" } },
          { size: { $regex: search, $options: "i" } },
          { gote: { $regex: search, $options: "i" } },
          { guage: { $regex: search, $options: "i" } },

          {
            $expr: {
              $regexMatch: {
                input: {
                  $concat: ["$type", " ", "$size", " ", "$gote", " ", "$guage"],
                },
                regex: search,
                options: "i",
              },
            },
          },
        ],
      };
    }

    const items = await collection.find(filter).toArray();

    const safeItems = items.map((item) => ({
      ...item,
      _id: item._id?.toString(),
    }));

    return NextResponse.json({ success: true, items: safeItems });
  } catch (err) {
    console.error("❌ Error fetching inventory:", err);
    return NextResponse.json({ success: false, items: [] }, { status: 500 });
  }
}
