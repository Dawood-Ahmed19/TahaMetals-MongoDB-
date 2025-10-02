import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// --- Types ---
interface Payment {
  amount: number;
  date: string;
  note?: string;
}

interface Quotation {
  _id: string;
  quotationId: string;
  date: string;
  discount: number;
  amount: number;
  total: number;
  grandTotal: number;
  payments?: Payment[];
  status: string;
  quotationTotalProfit?: number;
  items: any[];
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const returnsCollection = db.collection("returns");

    const allReturns = await returnsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, returns: allReturns });
  } catch (err) {
    console.error("❌ Error fetching returns:", err);
    return NextResponse.json(
      { success: false, message: "Error fetching returns" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { invoiceId, items } = await req.json();

    if (!invoiceId || !items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice ID and at least one item are required.",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("TahaMetals");

    // ✅ typed Quotation
    const quotationsCollection = db.collection<Quotation>("quotations");
    const inventoryCollection = db.collection("inventory");
    const reportsCollection = db.collection("reportsSummary");
    const returnsCollection = db.collection("returns");

    // Fetch invoice
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
        {
          success: false,
          message: "Invoice not active. Cannot process returns.",
        },
        { status: 400 }
      );
    }

    let updatedItems = [...invoice.items];
    let returnItems: any[] = [];
    let totalRefund = 0;
    let totalProfitBack = 0;

    for (const { itemName, qty } of items) {
      const itemIndex = updatedItems.findIndex(
        (i: any) => i.originalName === itemName
      );
      if (itemIndex === -1) continue;

      const item = updatedItems[itemIndex];
      if (qty > item.qty) continue;

      const refundAmount = item.rate * qty;
      const refundProfit = item.profitPerUnit * qty;
      const refundWeight =
        item.weight && item.qty > 0 ? (item.weight / item.qty) * qty : 0;

      // Adjust invoice
      if (qty === item.qty) {
        updatedItems.splice(itemIndex, 1);
      } else {
        updatedItems[itemIndex].qty -= qty;
        updatedItems[itemIndex].amount -= refundAmount;
        updatedItems[itemIndex].weight -= refundWeight;
        updatedItems[itemIndex].totalProfit -= refundProfit;
      }

      // Update inventory back (increase qty & weight)
      await inventoryCollection.updateOne(
        { name: item.originalName },
        { $inc: { quantity: qty, weight: refundWeight } },
        { upsert: true }
      );

      // ✅ Enrich return item with inventory details
      const invItem = await inventoryCollection.findOne({
        name: item.originalName,
      });

      returnItems.push({
        itemName,
        qty,
        rate: item.rate,
        refundAmount,
        refundProfit,
        refundWeight,
        type: invItem?.type || item.type,
        size: invItem?.size || item.size,
        guage: invItem?.guage || item.guage,
        gote: invItem?.gote || item.gote,
        color: invItem?.color || item.color,
        originalName: item.originalName,
      });

      totalRefund += refundAmount;
      totalProfitBack += refundProfit;
    }

    const newGrandTotal = invoice.grandTotal - totalRefund;
    const newProfit = (invoice.quotationTotalProfit || 0) - totalProfitBack;

    // Update invoice
    await quotationsCollection.updateOne(
      { quotationId: invoiceId },
      {
        $set: {
          items: updatedItems,
          grandTotal: newGrandTotal,
          quotationTotalProfit: newProfit,
          updatedAt: new Date().toISOString(),
          ...(updatedItems.length === 0
            ? { status: "returned", grandTotal: 0, quotationTotalProfit: 0 }
            : {}),
        },
      }
    );

    // Update reportsSummary
    await reportsCollection.updateOne(
      {},
      { $inc: { totalAmount: -totalRefund, totalProfit: -totalProfitBack } },
      { upsert: true }
    );

    // --- Auto Refund into payments ---
    const receivedTotal = (invoice.payments || []).reduce(
      (sum: number, p: Payment) => sum + (p.amount || 0),
      0
    );

    if (receivedTotal > newGrandTotal) {
      const refundAmount = receivedTotal - newGrandTotal;

      await quotationsCollection.updateOne(
        { quotationId: invoiceId },
        {
          $push: {
            payments: {
              amount: -refundAmount,
              date: new Date().toISOString(),
              note: "Auto refund (return processed)",
            } as Payment,
          },
        }
      );
    }

    const lastReturn = await returnsCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    let nextNumber = 1;
    if (lastReturn.length > 0) {
      const lastId = lastReturn[0].returnId;
      const num = parseInt(lastId.replace("RTN-", ""), 10);
      nextNumber = num + 1;
    }

    const returnId = `RTN-${String(nextNumber).padStart(4, "0")}`;

    await returnsCollection.insertOne({
      returnId,
      referenceInvoice: invoiceId,
      itemsReturned: returnItems,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, message: "Return processed successfully.", returnId },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error processing return:", err);
    return NextResponse.json(
      { success: false, message: "Server error in /api/returns" },
      { status: 500 }
    );
  }
}
