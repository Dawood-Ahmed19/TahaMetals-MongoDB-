import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const quotations = db.collection("quotations");

    const quotation = await quotations.findOne({
      quotationId: id,
    });

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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const quotations = db.collection("quotations");

    const result = await quotations.deleteOne({ quotationId: id });

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
