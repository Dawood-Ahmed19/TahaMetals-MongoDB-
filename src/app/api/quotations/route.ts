// import { NextResponse } from "next/server";
// import clientPromise from "@/lib/mongodb";

// // Shared types
// interface Payment {
//   amount: number;
//   date: string;
// }

// interface Quotation {
//   _id?: string;
//   quotationId: string;
//   items: any[];
//   discount: number;
//   total: number;
//   grandTotal: number;
//   payments: Payment[];
//   amount: number;
//   date: string;
//   totalReceived?: number;
//   balance?: number;
// }

// // ✅ Create new quotation
// export async function POST(req: Request) {
//   try {
//     const { items, discount, total, grandTotal, payments } = await req.json();

//     const client = await clientPromise;
//     const db = client.db("TahaMetals");
//     const quotationsCol = db.collection<Quotation>("quotations");
//     const inventoryCol = db.collection("inventory");

//     const enrichedItems = [];

//     for (const soldItem of items) {
//       const { item, qty, weight, rate } = soldItem;

//       // Find in inventory
//       const inventoryItem = await inventoryCol.findOne({ name: item });
//       if (!inventoryItem) {
//         return NextResponse.json(
//           { success: false, error: `❌ No inventory found for "${item}".` },
//           { status: 400 }
//         );
//       }

//       if (Number(qty) > Number(inventoryItem.quantity)) {
//         return NextResponse.json(
//           {
//             success: false,
//             error: `❌ Not enough stock for "${item}". Available: ${inventoryItem.quantity}, Requested: ${qty}`,
//           },
//           { status: 400 }
//         );
//       }

//       const costPerUnit = Number(inventoryItem.pricePerUnit);
//       const invoiceRatePerUnit = Number(rate);
//       const profitPerUnit = Math.round(invoiceRatePerUnit - costPerUnit);
//       const totalProfit = Math.round(profitPerUnit * qty);

//       enrichedItems.push({
//         ...soldItem,
//         costPerUnit,
//         invoiceRatePerUnit,
//         profitPerUnit,
//         totalProfit,
//       });
//     }

//     // 2️⃣ Generate quotation ID
//     const count = await quotationsCol.countDocuments({});
//     const quotationId = `INV-${String(count + 1).padStart(4, "0")}`;

//     const safePayments: Payment[] = Array.isArray(payments) ? payments : [];

//     // 3️⃣ Insert enriched quotation
//     const result = await quotationsCol.insertOne({
//       quotationId,
//       items: enrichedItems, // 👈 use the enriched ones
//       discount,
//       total,
//       grandTotal,
//       payments: safePayments,
//       amount: grandTotal,
//       date: new Date().toISOString(),
//     });

//     // 4️⃣ Deduct stock
//     for (const soldItem of items) {
//       const { item, qty, weight } = soldItem;

//       const inventoryItem = await inventoryCol.findOne({ name: item });
//       if (inventoryItem) {
//         const currentQty = Number(inventoryItem.quantity) || 0;
//         const currentWeight = Number(inventoryItem.weight) || 0;

//         const newQty = Math.max(currentQty - Number(qty), 0);
//         const newWeight = Math.max(currentWeight - Number(weight), 0);

//         await inventoryCol.updateOne(
//           { _id: inventoryItem._id },
//           {
//             $set: {
//               quantity: newQty,
//               weight: newWeight,
//               date: new Date().toISOString(),
//             },
//           }
//         );
//       }
//     }

//     // 5️⃣ Calculate balance
//     const totalReceived = safePayments.reduce((s, p) => s + p.amount, 0);
//     const balance = grandTotal - totalReceived;

//     return NextResponse.json({
//       success: true,
//       quotation: {
//         _id: result.insertedId,
//         quotationId,
//         items: enrichedItems,
//         discount,
//         total,
//         grandTotal,
//         payments: safePayments,
//         amount: grandTotal,
//         date: new Date().toISOString(),
//         totalReceived,
//         balance,
//       },
//     });
//   } catch (err: any) {
//     console.error("Error saving quotation:", err);
//     return NextResponse.json(
//       { success: false, error: "Failed to save quotation" },
//       { status: 500 }
//     );
//   }
// }

// // ✅ Get quotations with filtering (search + Paid/Unpaid/All)
// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const status = searchParams.get("status"); // "Paid" | "Unpaid" | "All"
//     const search = searchParams.get("search");

//     const client = await clientPromise;
//     const db = client.db("TahaMetals");
//     const quotationsCol = db.collection<Quotation>("quotations");

//     // 1️⃣ Base query
//     const query: any = {};

//     if (search) {
//       query.quotationId = { $regex: search, $options: "i" };
//     }

//     // 2️⃣ Fetch docs
//     const rawDocs = await quotationsCol
//       .find(query)
//       .sort({ date: -1 })
//       .toArray();
//     const count = await quotationsCol.countDocuments(query);

//     // 3️⃣ Compute payments + balance
//     let quotations: Quotation[] = rawDocs.map((q) => {
//       const payments: Payment[] = Array.isArray(q.payments) ? q.payments : [];
//       const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
//       const balance = q.grandTotal
//         ? q.grandTotal - totalReceived
//         : q.amount - totalReceived;

//       return {
//         ...q,
//         payments,
//         totalReceived,
//         balance,
//       };
//     });

//     // 4️⃣ Apply Paid / Unpaid filter AFTER balance calculation
//     if (status === "Paid") {
//       quotations = quotations.filter(
//         (q) => q.balance !== undefined && q.balance <= 0
//       );
//     } else if (status === "Unpaid") {
//       quotations = quotations.filter(
//         (q) => q.balance !== undefined && q.balance > 0
//       );
//     }

//     return NextResponse.json({ success: true, quotations, count });
//   } catch (err) {
//     console.error("Error fetching quotations:", err);
//     return NextResponse.json(
//       { success: false, quotations: [], count: 0 },
//       { status: 500 }
//     );
//   }
// }

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
  quotationTotalProfit?: number; // ✅ new field
}

// ✅ Create new quotation
export async function POST(req: Request) {
  try {
    const { items, discount, total, grandTotal, payments } = await req.json();

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const quotationsCol = db.collection<Quotation>("quotations");
    const inventoryCol = db.collection("inventory");

    const enrichedItems: any[] = [];

    for (const soldItem of items) {
      const { item, qty, weight, rate } = soldItem;

      // Find in inventory
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

      const costPerUnit = Number(inventoryItem.pricePerUnit);
      const invoiceRatePerUnit = Number(rate);

      const profitPerUnit = Math.round(invoiceRatePerUnit - costPerUnit);
      const totalProfit = Math.round(profitPerUnit * qty);

      enrichedItems.push({
        ...soldItem,
        costPerUnit,
        invoiceRatePerUnit,
        profitPerUnit,
        totalProfit,
      });
    }

    // ✅ Calculate total profit of this quotation
    const quotationTotalProfit = enrichedItems.reduce(
      (sum, i) => sum + (i.totalProfit || 0),
      0
    );

    // 2️⃣ Generate quotation ID
    const count = await quotationsCol.countDocuments({});
    const quotationId = `INV-${String(count + 1).padStart(4, "0")}`;

    const safePayments: Payment[] = Array.isArray(payments) ? payments : [];

    // 3️⃣ Insert enriched quotation
    const result = await quotationsCol.insertOne({
      quotationId,
      items: enrichedItems, // 👈 enriched items with profit
      discount,
      total,
      grandTotal,
      payments: safePayments,
      amount: grandTotal,
      date: new Date().toISOString(),
      quotationTotalProfit, // ✅ save total profit for the invoice
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
        items: enrichedItems,
        discount,
        total,
        grandTotal,
        payments: safePayments,
        amount: grandTotal,
        date: new Date().toISOString(),
        quotationTotalProfit, // ✅ included in response
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

// ✅ Get quotations with filtering (search + Paid/Unpaid/All)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // "Paid" | "Unpaid" | "All"
    const search = searchParams.get("search");

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const quotationsCol = db.collection<Quotation>("quotations");

    // 1️⃣ Base query
    const query: any = {};

    if (search) {
      query.quotationId = { $regex: search, $options: "i" };
    }

    // 2️⃣ Fetch docs
    const rawDocs = await quotationsCol
      .find(query)
      .sort({ date: -1 })
      .toArray();
    const count = await quotationsCol.countDocuments(query);

    // 3️⃣ Compute payments + balance + safe profits
    let quotations: Quotation[] = rawDocs.map((q) => {
      const payments: Payment[] = Array.isArray(q.payments) ? q.payments : [];
      const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
      const balance = q.grandTotal
        ? q.grandTotal - totalReceived
        : q.amount - totalReceived;

      // ✅ Ensure total profit exists (calculate for old data missing it)
      const quotationTotalProfit =
        q.quotationTotalProfit ??
        (q.items?.reduce(
          (sum: number, i: any) => sum + (i.totalProfit || 0),
          0
        ) ||
          0);

      return {
        ...q,
        payments,
        totalReceived,
        balance,
        quotationTotalProfit, // ✅ returned
      };
    });

    // 4️⃣ Apply Paid / Unpaid filter AFTER balance calculation
    if (status === "Paid") {
      quotations = quotations.filter(
        (q) => q.balance !== undefined && q.balance <= 0
      );
    } else if (status === "Unpaid") {
      quotations = quotations.filter(
        (q) => q.balance !== undefined && q.balance > 0
      );
    }

    return NextResponse.json({ success: true, quotations, count });
  } catch (err) {
    console.error("Error fetching quotations:", err);
    return NextResponse.json(
      { success: false, quotations: [], count: 0 },
      { status: 500 }
    );
  }
}
