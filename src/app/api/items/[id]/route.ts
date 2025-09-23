import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

interface Params {
  params: { id: string };
}

// ✅ GET item by ID
export async function GET(req: Request, { params }: Params) {
  try {
    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const collection = db.collection("inventory");

    const item = await collection.findOne({ _id: new ObjectId(params.id) });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, item }, { status: 200 });
  } catch (err) {
    console.error("Error fetching item:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// ✅ POST new item (though usually POST is at `/items`, not `/items/[id]`)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const collection = db.collection("inventory");

    const result = await collection.insertOne(body);

    return NextResponse.json(
      { success: true, item: { _id: result.insertedId, ...body } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inserting item:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save" },
      { status: 500 }
    );
  }
}

// ✅ DELETE item by ID
export async function DELETE(req: Request, { params }: Params) {
  try {
    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const collection = db.collection("inventory");

    const result = await collection.deleteOne({ _id: new ObjectId(params.id) });

    if (result.deletedCount > 0) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }
  } catch (err) {
    console.error("Error deleting item:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete item" },
      { status: 500 }
    );
  }
}

// ✅ PUT update item by ID
export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const collection = db.collection("inventory");

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: body }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    const updatedDoc = await collection.findOne({
      _id: new ObjectId(params.id),
    });

    return NextResponse.json(
      { success: true, item: updatedDoc },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating item:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
