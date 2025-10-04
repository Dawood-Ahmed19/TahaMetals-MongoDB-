import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Payment {
  amount: number;
  date: string;
}

interface Quotation {
  _id: string;
  quotationId: string;
  date: string;
  total: number;
  discount: number;
  loading?: number;
  grandTotal: number;
  payments?: Payment[];
  items?: any[];
}

export const printInvoicePDF = async (quotationId: string) => {
  try {
    // Fetch quotation data
    const res = await fetch(`/api/quotations/${quotationId}`);
    if (!res.ok) {
      const text = await res.text();
      console.error("❌ API returned non-OK:", text);
      alert("Failed to fetch quotation data for printing.");
      return;
    }

    const data = await res.json();
    if (!data.success || !data.quotation?.items) {
      console.error("❌ Invalid quotation data:", data);
      alert("No items found for this quotation.");
      return;
    }

    const quotation: Quotation = data.quotation;
    const items = quotation.items || [];

    // Fetch inventory data
    const inventoryRes = await fetch("/api/inventory");
    if (!inventoryRes.ok) {
      console.error("❌ Failed to fetch inventory:", await inventoryRes.text());
      alert("Failed to fetch inventory data for printing.");
      return;
    }

    const inventoryData = await inventoryRes.json();
    const inventoryItems = inventoryData.success
      ? inventoryData.items || []
      : [];

    // Helper function for item display
    const getDisplayItem = (itemName: string) => {
      const invItem = inventoryItems.find((inv: any) => inv.name === itemName);
      if (invItem) {
        if (invItem.type.toLowerCase().includes("pillar")) {
          return `${invItem.type} ${invItem.size ? invItem.size : ""}${
            invItem.gote &&
            invItem.gote.trim() !== "" &&
            invItem.gote.toLowerCase() !== "without gote"
              ? invItem.gote
              : ""
          } - ${invItem.guage || ""}`.trim();
        } else if (invItem.type.toLowerCase() === "hardware") {
          return `${invItem.name} ${invItem.size ? invItem.size : ""}${
            invItem.color && invItem.color.trim() !== "" ? invItem.color : ""
          }`.trim();
        } else {
          return `${invItem.type}${invItem.size ? invItem.size : ""}${
            invItem.guage || ""
          }`.trim();
        }
      }
      return itemName;
    };

    // Create a new PDF document
    const doc = new jsPDF({
      unit: "pt",
      format: "a5",
    });

    const brandX = 40,
      brandY = 30;

    // Header and branding
    doc.setFontSize(18).setFont("helvetica", "bold").setTextColor(0, 0, 0);
    doc.text("Taha", brandX, brandY);
    const tahaWidth = (doc as any).getTextWidth("Taha");
    doc.text("Metals", brandX + tahaWidth + 6, brandY);

    doc.setFontSize(11).setFont("helvetica", "normal");
    doc.text("Invoice / Quotation", brandX, brandY + 18);

    const pageWidth = doc.internal.pageSize.getWidth();
    const rightX = pageWidth - 50;
    const today = new Date(quotation.date).toLocaleDateString();

    doc.setFontSize(10).text(`Date: ${today}`, rightX, brandY, {
      align: "right",
    });

    if (quotation.quotationId) {
      doc
        .setFontSize(9)
        .setFont("helvetica", "bold")
        .setTextColor(107, 114, 128);
      doc.text(`Quotation ID: ${quotation.quotationId}`, rightX, brandY + 15, {
        align: "right",
      });
      doc.setTextColor(0, 0, 0);
    }

    // Table structure
    const head = [["Qty", "Item", "Guage", "Weight", "Rate", "Amount"]];
    const body = items.map((r: any) => [
      String(r.qty),
      getDisplayItem(r.item),
      r.guage || "",
      Number(r.weight).toLocaleString("en-US", { maximumFractionDigits: 2 }),
      Number(r.rate).toLocaleString("en-US"),
      Number(r.amount).toLocaleString("en-US", { maximumFractionDigits: 2 }),
    ]);

    (autoTable as any)(doc, {
      head,
      body,
      startY: 100,
      theme: "striped",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [45, 55, 72], textColor: 255 },
      margin: { left: 40, right: 40 },
    });

    // Totals section
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const rightXTotal = pageWidth - 160;
    const paid =
      quotation.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) ||
      0;
    const balance = quotation.grandTotal - paid;

    doc.setFontSize(11);
    let yPos = finalY;

    doc.text(`TOTAL: ${quotation.total.toLocaleString()}`, rightXTotal, yPos);
    yPos += 16;
    doc.text(
      `DISCOUNT: ${quotation.discount.toLocaleString()}`,
      rightXTotal,
      yPos
    );
    yPos += 16;
    doc.text(`BALANCE: ${balance.toLocaleString()}`, rightXTotal, yPos);
    yPos += 16;

    if (
      quotation.hasOwnProperty("loading") &&
      quotation.loading !== undefined &&
      quotation.loading !== null
    ) {
      doc.text(
        `LOADING: ${quotation.loading.toLocaleString()}`,
        rightXTotal,
        yPos
      );
      yPos += 16;
    }

    doc.text(
      `GRAND TOTAL: ${quotation.grandTotal.toLocaleString()}`,
      rightXTotal,
      yPos
    );

    doc
      .setFontSize(10)
      .text("Thank you for Purchasing!", 40, doc.internal.pageSize.height - 40);

    // --- Print directly ---
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);

    const printWindow = window.open(blobUrl);
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        printWindow.focus();
        printWindow.print();
      });
    } else {
      alert("Please allow pop-ups to enable printing.");
    }
  } catch (err) {
    console.error("❌ Error printing invoice:", err);
    alert("Failed to print invoice.");
  }
};
