import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface Payment {
  amount: number;
  date: string;
}

// POST /api/quotations/[id]/addPayments
export async function POST(req: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const { amount, date } = await req.json();

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid quotation ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const quotations = db.collection("quotations");

    const paymentEntry: Payment = {
      amount,
      date: date || new Date().toISOString(),
    };

    // Update quotation (cast to any to silence TS if needed)
    await quotations.updateOne(
      { _id: new ObjectId(id) },
      { $push: { payments: paymentEntry } as any }
    );

    // Fetch updated quotation
    const updated = await quotations.findOne({ _id: new ObjectId(id) });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Quotation not found" },
        { status: 404 }
      );
    }

    const payments: Payment[] = Array.isArray(updated.payments)
      ? updated.payments
      : [];

    const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
    const balance = updated.grandTotal
      ? updated.grandTotal - totalReceived
      : updated.amount - totalReceived;

    return NextResponse.json({
      success: true,
      quotation: {
        ...updated,
        payments,
        totalReceived,
        balance,
      },
    });
  } catch (err) {
    console.error("Error adding payment:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
