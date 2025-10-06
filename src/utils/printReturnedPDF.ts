import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReturnItem {
  itemName: string;
  qty: number;
  rate: number;
  refundAmount: number;
  refundProfit?: number;
  refundWeight?: number;
}

interface ReturnRecord {
  returnId: string;
  referenceInvoice: string;
  createdAt: string;
  itemReturned?: ReturnItem | ReturnItem[];
  itemsReturned?: ReturnItem[];
}

export const printReturnPDF = async (returnId: string) => {
  try {
    // Fetch return record
    const res = await fetch(`/api/returns/${returnId}`);
    if (!res.ok) {
      const text = await res.text();
      console.error("❌ API returned non-OK:", text);
      alert("Failed to fetch return data for printing.");
      return;
    }

    const data = await res.json();
    if (!data.success || !data.returnRecord) {
      console.error("❌ Invalid JSON:", data);
      alert("No return record found.");
      return;
    }

    const rtn: ReturnRecord = data.returnRecord;

    // Normalize possible schema variations
    const items: ReturnItem[] = Array.isArray(rtn.itemsReturned)
      ? rtn.itemsReturned
      : rtn.itemReturned
      ? Array.isArray(rtn.itemReturned)
        ? rtn.itemReturned
        : [rtn.itemReturned]
      : [];

    if (items.length === 0) {
      alert("⚠️ No return items found to print.");
      return;
    }

    // Fetch inventory (so we can retrieve descriptive names)
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

    // ✨ Helper to show descriptive item names (same as invoice)
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

    // 🧾 Start the PDF
    const doc = new jsPDF({ unit: "pt", format: "a5" });
    const brandX = 40,
      brandY = 30;

    // Header
    doc.setFontSize(18).setFont("helvetica", "bold");
    doc.text("Taha", brandX, brandY);
    const tahaWidth = (doc as any).getTextWidth("Taha");
    doc.text("Metals", brandX + tahaWidth + 6, brandY);

    doc.setFontSize(11).setFont("helvetica", "normal");
    doc.text("Return Invoice / Credit Note", brandX, brandY + 18);

    const pageWidth = doc.internal.pageSize.getWidth();
    const rightX = pageWidth - 50;
    const today = new Date(rtn.createdAt).toLocaleDateString();

    doc
      .setFontSize(8)
      .text(`Date: ${today}`, rightX, brandY, { align: "right" });
    doc.setFontSize(8).setFont("helvetica", "bold").setTextColor(107, 114, 128);
    doc.text(`Return ID: ${rtn.returnId}`, rightX, brandY + 12, {
      align: "right",
    });
    doc.text(
      `Reference Invoice: ${rtn.referenceInvoice}`,
      rightX,
      brandY + 24,
      {
        align: "right",
      }
    );
    doc.setTextColor(0, 0, 0);

    // 📦 Table setup
    const head = [["Qty", "Item", "Weight", "Rate", "Refund"]];
    const body = items.map((it) => [
      String(it.qty),
      getDisplayItem(it.itemName),
      it.refundWeight
        ? it.refundWeight.toLocaleString("en-US", { maximumFractionDigits: 2 })
        : "",
      Number(it.rate).toLocaleString("en-US"),
      `- ${Number(it.refundAmount).toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })}`,
    ]);

    (autoTable as any)(doc, {
      head,
      body,
      startY: 100,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [45, 55, 72], textColor: 255 },
      margin: { left: 40, right: 40 },
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const rightMargin = 40;
    const rightXTotal = pageWidth - rightMargin;
    const labelX = rightXTotal - 100;

    const totalRefund = items.reduce(
      (sum, it) => sum + (it.refundAmount || 0),
      0
    );

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("REFUND TOTAL:", labelX, finalY, { align: "left" });
    doc.text(`- ${totalRefund.toLocaleString()}`, rightXTotal, finalY, {
      align: "right",
    });

    // Footer
    doc
      .setFontSize(10)
      .setFont("helvetica", "normal")
      .text(
        "This is a system-generated Return Invoice",
        40,
        doc.internal.pageSize.height - 40
      );

    // Print
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
    console.error("❌ Error printing Return PDF:", err);
    alert("❌ Failed to print Return PDF");
  }
};
