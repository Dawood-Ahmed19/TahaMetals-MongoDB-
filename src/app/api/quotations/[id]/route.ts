import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// -------- GET Single Invoice ----------
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const quotations = db.collection("quotations");

    let query: any = {};

    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { quotationId: id };
    }

    const quotation = await quotations.findOne(query);

    if (!quotation) {
      return NextResponse.json(
        { success: false, message: "Quotation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, quotation }, { status: 200 });
  } catch (error) {
    console.error("Error fetching quotation:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// -------- DELETE Invoice ----------
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const quotations = db.collection("quotations");

    let query: any = {};

    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { quotationId: id };
    }

    const result = await quotations.deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Quotation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Quotation deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting quotation:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
