import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// Shared types
interface Payment {
  amount: number;
  date: string;
}

interface Quotation {
  _id?: string;
  quotationId: string;
  items: any[];
  discount: number;
  total: number;
  grandTotal: number;
  payments: Payment[];
  amount: number;
  date: string;
  totalReceived?: number;
  balance?: number;
}

// ✅ Create new quotation
export async function POST(req: Request) {
  try {
    const { items, discount, total, grandTotal, payments } = await req.json();

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const quotationsCol = db.collection<Quotation>("quotations");
    const inventoryCol = db.collection("inventory");

    // 1️⃣ Validate stock before creating quotation
    for (const soldItem of items) {
      const { item, qty } = soldItem;

      const inventoryItem = await inventoryCol.findOne({ name: item });
      if (!inventoryItem) {
        return NextResponse.json(
          { success: false, error: `❌ No inventory found for "${item}".` },
          { status: 400 }
        );
      }

      if (Number(qty) > Number(inventoryItem.quantity)) {
        return NextResponse.json(
          {
            success: false,
            error: `❌ Not enough stock for "${item}". Available: ${inventoryItem.quantity}, Requested: ${qty}`,
          },
          { status: 400 }
        );
      }
    }

    // 2️⃣ Generate quotation ID
    const count = await quotationsCol.countDocuments({});
    const quotationId = `INV-${String(count + 1).padStart(4, "0")}`;

    const safePayments: Payment[] = Array.isArray(payments) ? payments : [];

    // 3️⃣ Insert quotation
    const result = await quotationsCol.insertOne({
      quotationId,
      items,
      discount,
      total,
      grandTotal,
      payments: safePayments,
      amount: grandTotal,
      date: new Date().toISOString(),
    });

    // 4️⃣ Deduct stock
    for (const soldItem of items) {
      const { item, qty, weight } = soldItem;

      const inventoryItem = await inventoryCol.findOne({ name: item });
      if (inventoryItem) {
        const currentQty = Number(inventoryItem.quantity) || 0;
        const currentWeight = Number(inventoryItem.weight) || 0;

        const newQty = Math.max(currentQty - Number(qty), 0);
        const newWeight = Math.max(currentWeight - Number(weight), 0);

        await inventoryCol.updateOne(
          { _id: inventoryItem._id },
          {
            $set: {
              quantity: newQty,
              weight: newWeight,
              date: new Date().toISOString(),
            },
          }
        );
      }
    }

    // 5️⃣ Calculate balance
    const totalReceived = safePayments.reduce((s, p) => s + p.amount, 0);
    const balance = grandTotal - totalReceived;

    return NextResponse.json({
      success: true,
      quotation: {
        _id: result.insertedId,
        quotationId,
        items,
        discount,
        total,
        grandTotal,
        payments: safePayments,
        amount: grandTotal,
        date: new Date().toISOString(),
        totalReceived,
        balance,
      },
    });
  } catch (err: any) {
    console.error("Error saving quotation:", err);
    return NextResponse.json(
      { success: false, error: "Failed to save quotation" },
      { status: 500 }
    );
  }
}

// ✅ Get all quotations
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const quotationsCol = db.collection<Quotation>("quotations");

    const rawDocs = await quotationsCol.find({}).sort({ date: -1 }).toArray();
    const count = await quotationsCol.countDocuments({});

    const quotations: Quotation[] = rawDocs.map((q) => {
      const payments: Payment[] = Array.isArray(q.payments) ? q.payments : [];

      const totalReceived = payments.reduce(
        (s: number, p: Payment) => s + p.amount,
        0
      );
      const balance = q.grandTotal
        ? q.grandTotal - totalReceived
        : q.amount - totalReceived;

      return {
        ...q,
        payments,
        totalReceived,
        balance,
      };
    });

    return NextResponse.json({ success: true, quotations, count });
  } catch (err) {
    console.error("Error fetching quotations:", err);
    return NextResponse.json(
      { success: false, quotations: [], count: 0 },
      { status: 500 }
    );
  }
}
