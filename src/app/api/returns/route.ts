import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { invoiceId, itemName, qty } = await req.json();

    if (!invoiceId || !itemName || !qty) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice ID, itemName and qty are required.",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const quotationsCollection = db.collection("quotations");
    const inventoryCollection = db.collection("inventory");
    const reportsCollection = db.collection("reportsSummary");

    // 1️⃣ Find the invoice
    const invoice = await quotationsCollection.findOne({
      quotationId: invoiceId,
    });
    if (!invoice) {
      return NextResponse.json(
        { success: false, message: "Invoice not found." },
        { status: 404 }
      );
    }
    if (invoice.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Invoice is not active." },
        { status: 400 }
      );
    }

    // 2️⃣ Find the item in invoice
    const itemIndex = invoice.items.findIndex(
      (i: any) => i.originalName === itemName
    );
    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Item not found in this invoice." },
        { status: 404 }
      );
    }

    const item = invoice.items[itemIndex];
    if (qty > item.qty) {
      return NextResponse.json(
        { success: false, message: "Return qty exceeds sold qty." },
        { status: 400 }
      );
    }

    // 3️⃣ Calculate effects of return
    const refundAmount = item.rate * qty;
    const refundProfit = item.profitPerUnit * qty;
    const refundWeight =
      item.weight && item.qty > 0 ? (item.weight / item.qty) * qty : 0;

    // 4️⃣ Update invoice items
    let updatedItems = [...invoice.items];
    if (qty === item.qty) {
      // remove the whole item
      updatedItems.splice(itemIndex, 1);
    } else {
      updatedItems[itemIndex].qty -= qty;
      updatedItems[itemIndex].amount -= refundAmount;
      updatedItems[itemIndex].weight -= refundWeight;
      updatedItems[itemIndex].totalProfit -= refundProfit;
    }

    // 5️⃣ Update invoice totals
    const newGrandTotal = invoice.grandTotal - refundAmount;
    const newProfit = (invoice.quotationTotalProfit || 0) - refundProfit;

    await quotationsCollection.updateOne(
      { quotationId: invoiceId },
      {
        $set: {
          items: updatedItems,
          grandTotal: newGrandTotal,
          quotationTotalProfit: newProfit,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    if (updatedItems.length === 0) {
      await quotationsCollection.updateOne(
        { quotationId: invoiceId },
        {
          $set: {
            status: "returned",
            grandTotal: 0,
            quotationTotalProfit: 0,
            updatedAt: new Date().toISOString(),
          },
        }
      );
    }

    // 6️⃣ Restore inventory
    await inventoryCollection.updateOne(
      { name: item.originalName },
      {
        $inc: {
          quantity: qty,
          weight: refundWeight,
        },
      },
      { upsert: true }
    );

    // 7️⃣ Adjust reports
    await reportsCollection.updateOne(
      {},
      {
        $inc: {
          totalAmount: -refundAmount,
          totalProfit: -refundProfit,
        },
      },
      { upsert: true }
    );

    return NextResponse.json(
      { success: true, message: "Item returned successfully." },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error processing return:", err);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while processing the return.",
      },
      { status: 500 }
    );
  }
}
