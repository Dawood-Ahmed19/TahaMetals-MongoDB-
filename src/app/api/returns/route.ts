import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb"; // Import the MongoDB client promise

export async function POST(req: Request) {
  try {
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, message: "Invoice ID is required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("TahaMetals"); // Ensure the database name matches
    const quotationsCollection = db.collection("quotations"); // Explicitly set collection name

    console.log("Attempting to update invoice:", invoiceId);

    // Debug: Check if any documents match the quotationId
    const existingDoc = await quotationsCollection.findOne({
      quotationId: invoiceId,
    });
    if (!existingDoc) {
      console.log("No document found with quotationId:", invoiceId);
      return NextResponse.json(
        { success: false, message: "Invoice not found." },
        { status: 404 }
      );
    }

    console.log("Existing document found:", {
      quotationId: existingDoc.quotationId,
      status: existingDoc.status,
    });

    // Check if the invoice is already returned or not active
    if (existingDoc.status && existingDoc.status !== "active") {
      console.log(
        "Status is not 'active':",
        existingDoc.status,
        "- Skipping return."
      );
      return NextResponse.json(
        {
          success: false,
          message: `Invoice is already ${existingDoc.status}. Cannot process return.`,
        },
        { status: 400 }
      );
    }

    // Prepare the query: match quotationId and status is "active"
    const query = { quotationId: invoiceId, status: "active" };

    // Debug: Check matching documents
    const matchingDocs = await quotationsCollection.find(query).toArray();
    console.log("Matching documents before update:", matchingDocs);

    // Perform the update with upsert: false to avoid creating new documents
    const invoiceResult = await quotationsCollection.findOneAndUpdate(
      query,
      { $set: { status: "returned", updatedAt: new Date().toISOString() } }, // Add updatedAt to force a change
      { returnDocument: "after", upsert: false } // Return the updated document, no new document creation
    );

    // Log the full result for debugging
    console.log("findOneAndUpdate result:", invoiceResult);

    // Check if invoiceResult is null (operation failed)
    if (!invoiceResult) {
      console.error("findOneAndUpdate returned null for invoiceId:", invoiceId);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to process the return operation. Check server logs.",
        },
        { status: 500 }
      );
    }

    // Check if the updated document value is null (no matching document or no change)
    if (!invoiceResult.value) {
      console.log(
        "No active invoice found or no change applied for invoiceId:",
        invoiceId
      );
      return NextResponse.json(
        {
          success: false,
          message: "Active invoice not found or already processed.",
        },
        { status: 404 }
      );
    }

    const invoice = invoiceResult.value; // Safely assign the non-null value
    const { grandTotal, quotationTotalProfit, items } = invoice;

    // Extract itemId (assuming it's in the first item of the items array under 'name')
    const itemId = items?.[0]?.name; // Adjust based on your schema (e.g., items[0].item if different)

    if (!itemId) {
      console.warn("No itemId found in invoice:", invoice);
      return NextResponse.json(
        { success: false, message: "No itemId found for inventory update." },
        { status: 400 }
      );
    }

    // Adjust Reports totals (subtract amount and profit from active totals)
    const reportsCollection = db.collection("reportsSummary");
    await reportsCollection.updateOne(
      {},
      {
        $inc: {
          totalAmount: -grandTotal,
          totalProfit: -(quotationTotalProfit || 0),
        },
      },
      { upsert: true }
    );

    // Update inventory (increment itemsInStock based on item name)
    const inventoryCollection = db.collection("inventory");
    await inventoryCollection.updateOne(
      { name: itemId }, // Use name from items array
      { $inc: { quantity: 1 } }, // Adjust based on your inventory schema
      { upsert: true }
    );

    return NextResponse.json(
      { success: true, message: "Return processed successfully." },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error processing return:", err);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while processing the return.",
      },
      { status: 500 }
    );
  }
}
