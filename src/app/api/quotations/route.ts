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
  quotationTotalProfit?: number;
  status?: string;
  loading?: number;
}

// ✅ Create new quotation

// export async function POST(req: Request) {
//   try {
//     const {
//       items,
//       discount,
//       total,
//       grandTotal,
//       payments,
//       loading,
//       quotationId,
//     } = await req.json();

//     const client = await clientPromise;
//     const db = client.db("TahaMetals");
//     const quotationsCol = db.collection<Quotation>("quotations");
//     const inventoryCol = db.collection("inventory");

//     const enrichedItems: any[] = [];

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

//     const quotationTotalProfit = enrichedItems.reduce(
//       (sum, i) => sum + (i.totalProfit || 0),
//       0
//     );

//     const safePayments: Payment[] = Array.isArray(payments) ? payments : [];
//     const totalReceived = safePayments.reduce((s, p) => s + p.amount, 0);
//     const balance = grandTotal - totalReceived;

//     // ✅ If quotationId exists, update instead of insert
//     if (quotationId) {
//       const existing = await quotationsCol.findOne({ quotationId });

//       if (existing) {
//         await quotationsCol.updateOne(
//           { quotationId },
//           {
//             $set: {
//               items: enrichedItems,
//               discount,
//               total,
//               grandTotal,
//               payments: safePayments,
//               amount: grandTotal,
//               date: new Date().toISOString(),
//               quotationTotalProfit,
//               loading: Number(loading) || 0,
//               totalReceived,
//               balance,
//               status: "active",
//             },
//           }
//         );

//         return NextResponse.json({
//           success: true,
//           quotation: {
//             ...existing,
//             items: enrichedItems,
//             discount,
//             total,
//             grandTotal,
//             payments: safePayments,
//             amount: grandTotal,
//             date: new Date().toISOString(),
//             loading: Number(loading) || 0,
//             quotationTotalProfit,
//             totalReceived,
//             balance,
//             status: "active",
//           },
//         });
//       }
//     }

//     // 2️⃣ If no quotationId, create new
//     const count = await quotationsCol.countDocuments({});
//     const newQuotationId = `INV-${String(count + 1).padStart(4, "0")}`;

//     const result = await quotationsCol.insertOne({
//       quotationId: newQuotationId,
//       items: enrichedItems,
//       discount,
//       total,
//       grandTotal,
//       payments: safePayments,
//       amount: grandTotal,
//       date: new Date().toISOString(),
//       quotationTotalProfit,
//       loading: Number(loading) || 0,
//       status: "active",
//     });

//     return NextResponse.json({
//       success: true,
//       quotation: {
//         _id: result.insertedId,
//         quotationId: newQuotationId,
//         items: enrichedItems,
//         discount,
//         total,
//         grandTotal,
//         payments: safePayments,
//         amount: grandTotal,
//         date: new Date().toISOString(),
//         loading: Number(loading) || 0,
//         quotationTotalProfit,
//         totalReceived,
//         balance,
//         status: "active",
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

export async function POST(req: Request) {
  try {
    const {
      items,
      discount,
      total,
      grandTotal,
      payments,
      loading,
      quotationId,
    } = await req.json();

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const quotationsCol = db.collection<Quotation>("quotations");
    const inventoryCol = db.collection("inventory");

    const enrichedItems: any[] = [];

    for (const soldItem of items) {
      const { item, qty, weight, rate, originalName, size, guage } = soldItem;

      // ✅ Use (originalName, size, guage) to find exact product in inventory
      const inventoryItem = await inventoryCol.findOne({
        name: originalName || item, // fallback to item if originalName missing
        size: size || "",
        guage: guage || "",
      });

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

      // ✅ Calculate profit per unit
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

      // ✅ Deduct from inventory
      await inventoryCol.updateOne(
        {
          name: inventoryItem.name,
          size: inventoryItem.size || "",
          guage: inventoryItem.guage || "",
        },
        {
          $inc: {
            quantity: -Number(qty),
            weight: -Number(weight || 0), // handles pipe weight reductions too
          },
        }
      );
    }

    const quotationTotalProfit = enrichedItems.reduce(
      (sum, i) => sum + (i.totalProfit || 0),
      0
    );

    const safePayments: Payment[] = Array.isArray(payments) ? payments : [];
    const totalReceived = safePayments.reduce((s, p) => s + p.amount, 0);
    const balance = grandTotal - totalReceived;

    if (quotationId) {
      const existing = await quotationsCol.findOne({ quotationId });
      if (existing) {
        await quotationsCol.updateOne(
          { quotationId },
          {
            $set: {
              items: enrichedItems,
              discount,
              total,
              grandTotal,
              payments: safePayments,
              amount: grandTotal,
              date: new Date().toISOString(),
              quotationTotalProfit,
              loading: Number(loading) || 0,
              totalReceived,
              balance,
              status: "active",
            },
          }
        );

        return NextResponse.json({
          success: true,
          quotation: {
            ...existing,
            items: enrichedItems,
            discount,
            total,
            grandTotal,
            payments: safePayments,
            amount: grandTotal,
            date: new Date().toISOString(),
            loading: Number(loading) || 0,
            quotationTotalProfit,
            totalReceived,
            balance,
            status: "active",
          },
        });
      }
    }

    const count = await quotationsCol.countDocuments({});
    const newQuotationId = `INV-${String(count + 1).padStart(4, "0")}`;

    const result = await quotationsCol.insertOne({
      quotationId: newQuotationId,
      items: enrichedItems,
      discount,
      total,
      grandTotal,
      payments: safePayments,
      amount: grandTotal,
      date: new Date().toISOString(),
      quotationTotalProfit,
      loading: Number(loading) || 0,
      status: "active",
    });

    return NextResponse.json({
      success: true,
      quotation: {
        _id: result.insertedId,
        quotationId: newQuotationId,
        items: enrichedItems,
        discount,
        total,
        grandTotal,
        payments: safePayments,
        amount: grandTotal,
        date: new Date().toISOString(),
        loading: Number(loading) || 0,
        quotationTotalProfit,
        totalReceived,
        balance,
        status: "active",
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const client = await clientPromise;
    const db = client.db("TahaMetals");
    const quotationsCol = db.collection<Quotation>("quotations");

    let query: any = {};

    if (status && !["All", "Paid", "Unpaid"].includes(status)) {
      query.status = status;
    }

    if (search) {
      query.quotationId = { $regex: search, $options: "i" };
    }

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
      query.date = { $gte: start.toISOString(), $lte: end.toISOString() };
    } else if (year) {
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year), 11, 31, 23, 59, 59);
      query.date = { $gte: start.toISOString(), $lte: end.toISOString() };
    } else if (fromDate && toDate) {
      query.date = {
        $gte: new Date(fromDate).toISOString(),
        $lte: new Date(toDate).toISOString(),
      };
    }

    const rawDocs = await quotationsCol
      .find(query)
      .sort({ date: -1 })
      .toArray();
    const count = await quotationsCol.countDocuments(query);

    let quotations: Quotation[] = rawDocs.map((q: any) => {
      const payments: Payment[] = Array.isArray(q.payments) ? q.payments : [];
      const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
      const balance = q.grandTotal
        ? q.grandTotal - totalReceived
        : (q.amount || 0) - totalReceived;

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
        quotationTotalProfit,
      };
    });

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
    console.error("❌ Error fetching quotations:", err);
    return NextResponse.json(
      { success: false, quotations: [], count: 0 },
      { status: 500 }
    );
  }
}
