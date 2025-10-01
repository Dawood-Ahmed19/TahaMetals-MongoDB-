import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface Payment {
  amount: number;
  date: string;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { amount, date } = await req.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid quotation ID" },
        { status: 400 }
      );
    }

    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const quotationsCol = db.collection("quotations");

    const quotation = await quotationsCol.findOne({ _id: new ObjectId(id) });
    if (!quotation) {
      return NextResponse.json(
        { success: false, error: "Quotation not found" },
        { status: 404 }
      );
    }

    const existingPayments: Payment[] = Array.isArray(quotation.payments)
      ? quotation.payments
      : [];

    const newPayment: Payment = {
      amount: parsedAmount,
      date: date || new Date().toISOString(),
    };
    const updatedPayments = [...existingPayments, newPayment];

    const totalReceived = parseInt(
      updatedPayments.reduce((s, p) => s + p.amount, 0).toString(),
      10
    );
    const grandTotal = parseInt(
      (quotation.grandTotal ?? quotation.amount ?? 0).toString(),
      10
    );
    const balance = Math.max(
      parseInt((grandTotal - totalReceived).toString(), 10),
      0
    );

    await quotationsCol.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          payments: updatedPayments,
          totalReceived,
          balance,
        },
      }
    );

    return NextResponse.json({
      success: true,
      quotation: {
        ...quotation,
        payments: updatedPayments,
        totalReceived,
        balance,
      },
    });
  } catch (err) {
    console.error("❌ Error adding payment:", err);
    return NextResponse.json(
      { success: false, error: "Failed to add payment" },
      { status: 500 }
    );
  }
}
