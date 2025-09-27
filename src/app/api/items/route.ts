// import clientPromise from "@/lib/mongodb";
// import { NextResponse } from "next/server";
// import { ObjectId } from "mongodb";

// interface InventoryItem {
//   _id?: string | ObjectId;
//   name: string;
//   type: string;
//   pipeType?: string;
//   guage?: string | number;
//   gote?: string | number;
//   size: string;
//   weight: number;
//   quantity: number;
//   pricePerKg?: number | null;
//   pricePerUnit?: number | null;
//   date: string;
//   index?: number;
//   height?: string | null;
//   uniqueKey?: string;
//   color?: string;
// }

// function normalizeItem(item: any): InventoryItem {
//   const name = (item.name || "").trim().toLowerCase();
//   const size = String(item.size ?? "")
//     .trim()
//     .toLowerCase();
//   const guage = String(item.guage ?? "")
//     .trim()
//     .toLowerCase();
//   const pipeType = String(item.pipeType ?? "")
//     .trim()
//     .toLowerCase();
//   const type = String(item.type ?? "")
//     .trim()
//     .toLowerCase();

//   const uniqueKey = `${name}_${size}_${guage}_${pipeType}`;

//   let pricePerKg =
//     item.pricePerKg != null ? Math.round(Number(item.pricePerKg)) : null;
//   let pricePerUnit =
//     item.pricePerUnit != null ? Math.round(Number(item.pricePerUnit)) : null;

//   const weight = Number(item.weight ?? 0);
//   const quantity = Number(item.quantity ?? 0);

//   // ✅ Auto calculate pricePerUnit for pipes/pillars
//   if (
//     (!pricePerUnit || pricePerUnit === 0) &&
//     pricePerKg &&
//     weight > 0 &&
//     quantity > 0
//   ) {
//     const unitWeight = weight / quantity;
//     pricePerUnit = Number((unitWeight * pricePerKg).toFixed(2));
//   }

//   return {
//     ...item,
//     name,
//     size,
//     guage,
//     pipeType,
//     type,
//     uniqueKey,
//     pricePerKg,
//     pricePerUnit,
//     weight,
//     quantity,
//   };
// }

// // ✅ GET (with filtering support)
// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const type = searchParams.get("type");
//     const search = searchParams.get("search");

//     const client = await clientPromise;
//     const db = client.db("TahaMetals");
//     const collection = db.collection<InventoryItem>("inventory");

//     const query: any = {};

//     if (type && type.toLowerCase() !== "all") {
//       query.type = { $regex: new RegExp(`^${type}$`, "i") };
//     }

//     if (search) {
//       query.name = { $regex: search, $options: "i" };
//     }

//     const items = await collection.find(query).toArray();

//     return NextResponse.json({ success: true, items });
//   } catch (error) {
//     console.error("Error fetching items:", error);
//     return NextResponse.json(
//       { success: false, error: "Failed to fetch items" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const normalized = normalizeItem(body);

//     const client = await clientPromise;
//     const db = client.db("TahaMetals");
//     const collection = db.collection<InventoryItem>("inventory");

//     const existingItem = await collection.findOne({
//       uniqueKey: normalized.uniqueKey,
//     });

//     if (existingItem) {
//       const addedQty = Number(normalized.quantity ?? 0);

//       const unitWeight =
//         existingItem.quantity > 0
//           ? existingItem.weight / existingItem.quantity
//           : 0;

//       const newQuantity = existingItem.quantity + addedQty;
//       const newWeight = unitWeight * newQuantity;

//       // ✅ Recalculate pricePerUnit if pricePerKg exists
//       let pricePerUnit = existingItem.pricePerUnit ?? null;
//       if (existingItem.pricePerKg && unitWeight > 0) {
//         pricePerUnit = Number(
//           (unitWeight * existingItem.pricePerKg).toFixed(2)
//         );
//       }

//       const result = await collection.updateOne(
//         { _id: existingItem._id },
//         {
//           $set: {
//             quantity: newQuantity,
//             weight: newWeight,
//             pricePerUnit,
//             date: new Date().toISOString(),
//           },
//         }
//       );

//       return NextResponse.json(
//         {
//           success: result.modifiedCount > 0,
//           item: {
//             ...existingItem,
//             quantity: newQuantity,
//             weight: newWeight,
//             pricePerUnit,
//           },
//         },
//         { status: 200 }
//       );
//     }

//     // Auto-generate Pipe Code
//     let itemName = normalized.name;
//     let itemIndex: number | undefined;
//     if (!itemName && normalized.type?.toLowerCase() === "pipe") {
//       const lastPipe = await collection
//         .find({ type: "pipe" })
//         .sort({ index: -1 })
//         .limit(1)
//         .toArray();

//       const nextNumber =
//         lastPipe.length > 0 && lastPipe[0].index !== undefined
//           ? lastPipe[0].index + 1
//           : 1;

//       itemName = `p${String(nextNumber).padStart(3, "0")}`;
//       normalized.name = itemName;
//       normalized.index = nextNumber;
//       itemIndex = nextNumber;
//     }

//     const newItem = await collection.insertOne({
//       ...normalized,
//       name: normalized.name,
//       index: itemIndex ?? 1,
//       date: new Date().toISOString(),
//     });

//     return NextResponse.json(
//       { success: true, item: { _id: newItem.insertedId, ...normalized } },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("Error saving item:", err);
//     return NextResponse.json(
//       { success: false, error: "Failed to save item" },
//       { status: 500 }
//     );
//   }
// }

// // ✅ PATCH (deduct stock)
// export async function PATCH(req: Request) {
//   try {
//     const { name, qty, weight } = await req.json();

//     if (!name || qty == null || weight == null) {
//       return NextResponse.json(
//         { success: false, error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     const client = await clientPromise;
//     const db = client.db("TahaMetals");
//     const collection = db.collection<InventoryItem>("inventory");

//     const item = await collection.findOne({ name });
//     if (!item) {
//       return NextResponse.json(
//         { success: false, error: "Item not found" },
//         { status: 404 }
//       );
//     }

//     const currentQuantity = Number(item.quantity) || 0;
//     const currentWeight = Number(item.weight) || 0;
//     const soldQty = Number(qty) || 0;
//     const soldWeight = Number(weight) || 0;

//     const newQuantity = Math.max(currentQuantity - soldQty, 0);
//     const newWeight = Math.max(currentWeight - soldWeight, 0);

//     // ✅ Recalc unit price if needed
//     let pricePerUnit = item.pricePerUnit ?? null;
//     if (item.pricePerKg && newQuantity > 0 && newWeight > 0) {
//       const unitWeight = newWeight / newQuantity;
//       pricePerUnit = Number((unitWeight * item.pricePerKg).toFixed(2));
//     }

//     await collection.updateOne(
//       { _id: item._id },
//       {
//         $set: {
//           quantity: newQuantity,
//           weight: newWeight,
//           pricePerUnit,
//           date: new Date().toISOString(),
//         },
//       }
//     );

//     return NextResponse.json({
//       success: true,
//       updated: { name, newQuantity, newWeight, pricePerUnit },
//     });
//   } catch (err) {
//     console.error("Error deducting inventory:", err);
//     return NextResponse.json(
//       { success: false, error: "Failed to deduct stock" },
//       { status: 500 }
//     );
//   }
// }

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
  pricePerKg?: number | null;
  pricePerUnit?: number | null;
  date: string;
  index?: number;
  height?: string | null;
  uniqueKey?: string;
  color?: string;
}

function normalizeItem(item: any): InventoryItem {
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

  let pricePerKg =
    item.pricePerKg != null ? Math.round(Number(item.pricePerKg)) : null;
  let pricePerUnit =
    item.pricePerUnit != null ? Math.round(Number(item.pricePerUnit)) : null;

  const weight = Number(item.weight ?? 0);
  const quantity = Number(item.quantity ?? 0);

  // ✅ Auto calculate pricePerUnit for pipes/pillars
  if (
    (!pricePerUnit || pricePerUnit === 0) &&
    pricePerKg &&
    weight > 0 &&
    quantity > 0
  ) {
    const unitWeight = weight / quantity;
    pricePerUnit = Number((unitWeight * pricePerKg).toFixed(2));
  }

  return {
    ...item,
    name,
    size,
    guage,
    pipeType,
    type,
    uniqueKey,
    pricePerKg,
    pricePerUnit,
    weight,
    quantity,
  };
}

// ✅ GET (with filtering support)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const collection = db.collection<InventoryItem>("inventory");

    const query: any = {};

    if (type && type.toLowerCase() !== "all") {
      query.type = { $regex: new RegExp(`^${type}$`, "i") };
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const items = await collection.find(query).toArray();

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
      const addedWeight = Number(normalized.weight ?? 0);

      const newQuantity = (existingItem.quantity || 0) + addedQty;
      const newWeight = (existingItem.weight || 0) + addedWeight;

      // ✅ Recalculate pricePerUnit if pricePerKg exists
      let pricePerUnit = existingItem.pricePerUnit ?? null;
      if (existingItem.pricePerKg && newQuantity > 0) {
        const unitWeight = newWeight / newQuantity;
        pricePerUnit = Number(
          (unitWeight * existingItem.pricePerKg).toFixed(2)
        );
      }

      const result = await collection.updateOne(
        { _id: existingItem._id },
        {
          $set: {
            quantity: newQuantity,
            weight: newWeight,
            pricePerUnit,
            date: new Date().toISOString(),
          },
        }
      );

      return NextResponse.json(
        {
          success: result.modifiedCount > 0,
          item: {
            ...existingItem,
            quantity: newQuantity,
            weight: newWeight,
            pricePerUnit,
          },
        },
        { status: 200 }
      );
    }

    // Auto-generate Pipe Code
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

    const newItem = await collection.insertOne({
      ...normalized,
      name: normalized.name,
      index: itemIndex ?? 1,
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

    // ✅ Recalc unit price if needed
    let pricePerUnit = item.pricePerUnit ?? null;
    if (item.pricePerKg && newQuantity > 0 && newWeight > 0) {
      const unitWeight = newWeight / newQuantity;
      pricePerUnit = Number((unitWeight * item.pricePerKg).toFixed(2));
    }

    await collection.updateOne(
      { _id: item._id },
      {
        $set: {
          quantity: newQuantity,
          weight: newWeight,
          pricePerUnit,
          date: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      updated: { name, newQuantity, newWeight, pricePerUnit },
    });
  } catch (err) {
    console.error("Error deducting inventory:", err);
    return NextResponse.json(
      { success: false, error: "Failed to deduct stock" },
      { status: 500 }
    );
  }
}
