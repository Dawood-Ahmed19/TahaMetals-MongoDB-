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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const quotations = db.collection("quotations");
    const inventory = db.collection("inventory");

    // Find invoice first
    let query: any = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { quotationId: id };
    }

    const invoice = await quotations.findOne(query);

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: "Quotation not found" },
        { status: 404 }
      );
    }

    if (invoice.items && Array.isArray(invoice.items)) {
      for (const item of invoice.items) {
        console.log("Restoring item:", item);

        const qtyToRestore = Number(item.qty) || 0;
        const weightToRestore = Number(item.weight) || 0;

        const result = await inventory.updateOne(
          { name: item.originalName }, // matches your schema
          {
            $inc: {
              quantity: qtyToRestore,
              weight: weightToRestore,
            },
          }
        );

        // 🚨 Safeguard: if no document matched, insert a new one
        if (result.matchedCount === 0) {
          console.warn(
            `No inventory found for ${item.originalName}, inserting new...`
          );

          await inventory.insertOne({
            name: item.originalName,
            type: item.item ?? "unknown", // use invoice item text as backup
            size: item.size ?? "",
            guage: item.guage ?? "",
            gote: item.gote ?? "",
            quantity: qtyToRestore,
            weight: weightToRestore,
            color: item.color ?? "",
            pricePerKg: item.rate ?? 0,
            pricePerUnit: item.costPerUnit ?? 0,
            date: new Date(),
            uniqueKey: item.uniqueKey ?? `${item.originalName}_${Date.now()}`,
          });
        }
      }
    }

    // ✅ Delete the invoice
    const result = await quotations.deleteOne({ _id: invoice._id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Failed to delete quotation" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Quotation deleted and stock restored (with safeguard)",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
